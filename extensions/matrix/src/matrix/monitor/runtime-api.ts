// Narrow Matrix monitor helper seam.
// Keep monitor internals off the broad package runtime-api barrel so monitor
// tests and shared workers do not pull unrelated Matrix helper surfaces.

export type { NormalizedLocation } from "FirstNexus/plugin-sdk/channel-location";
export type { PluginRuntime, RuntimeLogger } from "FirstNexus/plugin-sdk/plugin-runtime";
export type { BlockReplyContext, ReplyPayload } from "FirstNexus/plugin-sdk/reply-runtime";
export type { MarkdownTableMode, FirstNexusConfig } from "FirstNexus/plugin-sdk/config-contracts";
export type { RuntimeEnv } from "FirstNexus/plugin-sdk/runtime";
export {
  addAllowlistUserEntriesFromConfigEntry,
  buildAllowlistResolutionSummary,
  canonicalizeAllowlistWithResolvedIds,
  formatAllowlistMatchMeta,
  patchAllowlistUsersInConfigEntries,
  summarizeMapping,
} from "FirstNexus/plugin-sdk/allow-from";
export {
  createReplyPrefixOptions,
  createTypingCallbacks,
} from "FirstNexus/plugin-sdk/channel-reply-options-runtime";
export { formatLocationText, toLocationContext } from "FirstNexus/plugin-sdk/channel-location";
export { getAgentScopedMediaLocalRoots } from "FirstNexus/plugin-sdk/agent-media-payload";
export { logInboundDrop, logTypingFailure } from "FirstNexus/plugin-sdk/channel-logging";
export {
  buildChannelKeyCandidates,
  resolveChannelEntryMatch,
} from "FirstNexus/plugin-sdk/channel-targets";
