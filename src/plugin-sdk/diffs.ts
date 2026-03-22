// Narrow plugin-sdk surface for the bundled diffs plugin.
// Keep this list additive and scoped to symbols used under extensions/diffs.

export { definePluginEntry } from "./plugin-entry.js";
export type { NexusClawConfig } from "../config/config.js";
export { resolvePreferredNexusClawTmpDir } from "../infra/tmp-nexusclaw-dir.js";
export type {
  AnyAgentTool,
  NexusClawPluginApi,
  NexusClawPluginConfigSchema,
  NexusClawPluginToolContext,
  PluginLogger,
} from "../plugins/types.js";
