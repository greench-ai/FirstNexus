// Focused runtime contract for memory plugin config/state/helpers.

export type { AnyAgentTool } from "./host/FirstNexus-runtime-agent.js";
export { resolveCronStyleNow } from "./host/FirstNexus-runtime-agent.js";
export { DEFAULT_PI_COMPACTION_RESERVE_TOKENS_FLOOR } from "./host/FirstNexus-runtime-agent.js";
export { resolveDefaultAgentId, resolveSessionAgentId } from "./host/FirstNexus-runtime-agent.js";
export { resolveMemorySearchConfig } from "./host/FirstNexus-runtime-agent.js";
export {
  asToolParamsRecord,
  jsonResult,
  readNumberParam,
  readStringParam,
} from "./host/FirstNexus-runtime-agent.js";
export { SILENT_REPLY_TOKEN } from "./host/FirstNexus-runtime-session.js";
export { parseNonNegativeByteSize } from "./host/FirstNexus-runtime-config.js";
export {
  getRuntimeConfig,
  /** @deprecated Use getRuntimeConfig(), or pass the already loaded config through the call path. */
  loadConfig,
} from "./host/FirstNexus-runtime-config.js";
export { resolveStateDir } from "./host/FirstNexus-runtime-config.js";
export { resolveSessionTranscriptsDirForAgent } from "./host/FirstNexus-runtime-config.js";
export { emptyPluginConfigSchema } from "./host/FirstNexus-runtime-memory.js";
export {
  buildActiveMemoryPromptSection,
  getMemoryCapabilityRegistration,
  listActiveMemoryPublicArtifacts,
} from "./host/FirstNexus-runtime-memory.js";
export { parseAgentSessionKey } from "./host/FirstNexus-runtime-agent.js";
export type { FirstNexusConfig } from "./host/FirstNexus-runtime-config.js";
export type { MemoryCitationsMode } from "./host/FirstNexus-runtime-config.js";
export type {
  MemoryFlushPlan,
  MemoryFlushPlanResolver,
  MemoryPluginCapability,
  MemoryPluginPublicArtifact,
  MemoryPluginPublicArtifactsProvider,
  MemoryPluginRuntime,
  MemoryPromptSectionBuilder,
} from "./host/FirstNexus-runtime-memory.js";
export type { FirstNexusPluginApi } from "./host/FirstNexus-runtime-memory.js";
