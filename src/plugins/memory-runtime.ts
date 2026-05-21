import { resolveAgentWorkspaceDir, resolveDefaultAgentId } from "../agents/agent-scope.js";
import type { FirstNexusConfig } from "../config/types.FirstNexus.js";
import { resolveUserPath } from "../utils.js";
import { getLoadedRuntimePluginRegistry } from "./active-runtime-registry.js";
import { normalizePluginsConfig } from "./config-state.js";
import { getMemoryRuntime } from "./memory-state.js";
import { ensureStandaloneRuntimePluginRegistryLoaded } from "./runtime/standalone-runtime-registry-loader.js";

function resolveMemoryRuntimePluginIds(config: FirstNexusConfig): string[] {
  const plugins = normalizePluginsConfig(config.plugins);
  const memorySlot = plugins.slots.memory;
  if (!plugins.enabled || typeof memorySlot !== "string" || memorySlot.trim().length === 0) {
    return [];
  }
  const pluginId = memorySlot.trim();
  if (plugins.deny.includes(pluginId) || plugins.entries[pluginId]?.enabled === false) {
    return [];
  }
  return [pluginId];
}

function resolveMemoryRuntimeWorkspaceDir(cfg: FirstNexusConfig): string | undefined {
  const agentId = resolveDefaultAgentId(cfg);
  const dir = resolveAgentWorkspaceDir(cfg, agentId);
  if (typeof dir !== "string" || !dir.trim()) {
    return undefined;
  }
  return resolveUserPath(dir);
}

function ensureMemoryRuntime(cfg?: FirstNexusConfig) {
  const current = getMemoryRuntime();
  if (current || !cfg) {
    return current;
  }
  const onlyPluginIds = resolveMemoryRuntimePluginIds(cfg);
  if (onlyPluginIds.length === 0) {
    return getMemoryRuntime();
  }
  getLoadedRuntimePluginRegistry({ requiredPluginIds: onlyPluginIds });
  if (getMemoryRuntime()) {
    return getMemoryRuntime();
  }
  const workspaceDir = resolveMemoryRuntimeWorkspaceDir(cfg);
  ensureStandaloneRuntimePluginRegistryLoaded({
    requiredPluginIds: onlyPluginIds,
    loadOptions: {
      config: cfg,
      onlyPluginIds,
      workspaceDir,
    },
  });
  return getMemoryRuntime();
}

export async function getActiveMemorySearchManager(params: {
  cfg: FirstNexusConfig;
  agentId: string;
  purpose?: "default" | "status" | "cli";
}) {
  const runtime = ensureMemoryRuntime(params.cfg);
  if (!runtime) {
    return { manager: null, error: "memory plugin unavailable" };
  }
  return await runtime.getMemorySearchManager(params);
}

export function resolveActiveMemoryBackendConfig(params: {
  cfg: FirstNexusConfig;
  agentId: string;
}) {
  return ensureMemoryRuntime(params.cfg)?.resolveMemoryBackendConfig(params) ?? null;
}

export async function closeActiveMemorySearchManagers(cfg?: FirstNexusConfig): Promise<void> {
  void cfg;
  const runtime = getMemoryRuntime();
  await runtime?.closeAllMemorySearchManagers?.();
}
