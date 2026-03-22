import type { NexusClawConfig } from "./config.js";

export function ensurePluginAllowlisted(cfg: NexusClawConfig, pluginId: string): NexusClawConfig {
  const allow = cfg.plugins?.allow;
  if (!Array.isArray(allow) || allow.includes(pluginId)) {
    return cfg;
  }
  return {
    ...cfg,
    plugins: {
      ...cfg.plugins,
      allow: [...allow, pluginId],
    },
  };
}
