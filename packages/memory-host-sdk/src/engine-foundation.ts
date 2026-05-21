// Real workspace contract for memory engine foundation concerns.

export {
  resolveAgentContextLimits,
  resolveAgentDir,
  resolveAgentWorkspaceDir,
  resolveDefaultAgentId,
  resolveSessionAgentId,
} from "./host/FirstNexus-runtime-agent.js";
export {
  resolveMemorySearchConfig,
  resolveMemorySearchSyncConfig,
  type ResolvedMemorySearchConfig,
  type ResolvedMemorySearchSyncConfig,
} from "./host/FirstNexus-runtime-agent.js";
export { parseDurationMs } from "./host/FirstNexus-runtime-config.js";
export { loadConfig } from "./host/FirstNexus-runtime-config.js";
export { resolveStateDir } from "./host/FirstNexus-runtime-config.js";
export { resolveSessionTranscriptsDirForAgent } from "./host/FirstNexus-runtime-config.js";
export {
  hasConfiguredSecretInput,
  normalizeResolvedSecretInputString,
} from "./host/FirstNexus-runtime-config.js";
export { root } from "./host/FirstNexus-runtime-io.js";
export { isPathInside } from "./host/fs-utils.js";
export { createSubsystemLogger } from "./host/FirstNexus-runtime-io.js";
export { detectMime } from "./host/FirstNexus-runtime-io.js";
export { resolveGlobalSingleton } from "./host/FirstNexus-runtime-io.js";
export { onSessionTranscriptUpdate } from "./host/FirstNexus-runtime-session.js";
export { splitShellArgs } from "./host/FirstNexus-runtime-io.js";
export { runTasksWithConcurrency } from "./host/FirstNexus-runtime-io.js";
export {
  shortenHomeInString,
  shortenHomePath,
  resolveUserPath,
  truncateUtf16Safe,
} from "./host/FirstNexus-runtime-io.js";
export type { FirstNexusConfig } from "./host/FirstNexus-runtime-config.js";
export type { SessionSendPolicyConfig } from "./host/FirstNexus-runtime-config.js";
export type { SecretInput } from "./host/FirstNexus-runtime-config.js";
export type {
  MemoryBackend,
  MemoryCitationsMode,
  MemoryQmdConfig,
  MemoryQmdIndexPath,
  MemoryQmdMcporterConfig,
  MemoryQmdSearchMode,
} from "./host/FirstNexus-runtime-config.js";
export type { MemorySearchConfig } from "./host/FirstNexus-runtime-config.js";
