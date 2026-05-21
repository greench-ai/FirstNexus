// Private runtime barrel for the bundled Microsoft Teams extension.
// Keep this barrel thin and aligned with the local extension surface.

export { DEFAULT_ACCOUNT_ID } from "FirstNexus/plugin-sdk/account-id";
export type { AllowlistMatch } from "FirstNexus/plugin-sdk/allow-from";
export {
  mergeAllowlist,
  resolveAllowlistMatchSimple,
  summarizeMapping,
} from "FirstNexus/plugin-sdk/allow-from";
export type {
  BaseProbeResult,
  ChannelDirectoryEntry,
  ChannelGroupContext,
  ChannelMessageActionName,
  ChannelOutboundAdapter,
} from "FirstNexus/plugin-sdk/channel-contract";
export type { ChannelPlugin } from "FirstNexus/plugin-sdk/channel-core";
export { logTypingFailure } from "FirstNexus/plugin-sdk/channel-logging";
export { createChannelPairingController } from "FirstNexus/plugin-sdk/channel-pairing";
export { resolveToolsBySender } from "FirstNexus/plugin-sdk/channel-policy";
export { createChannelMessageReplyPipeline } from "FirstNexus/plugin-sdk/channel-message";
export {
  PAIRING_APPROVED_MESSAGE,
  buildProbeChannelStatusSummary,
  createDefaultChannelRuntimeState,
} from "FirstNexus/plugin-sdk/channel-status";
export {
  buildChannelKeyCandidates,
  normalizeChannelSlug,
  resolveChannelEntryMatchWithFallback,
  resolveNestedAllowlistDecision,
} from "FirstNexus/plugin-sdk/channel-targets";
export type {
  GroupPolicy,
  GroupToolPolicyConfig,
  MSTeamsChannelConfig,
  MSTeamsConfig,
  MSTeamsReplyStyle,
  MSTeamsTeamConfig,
  MarkdownTableMode,
  FirstNexusConfig,
} from "FirstNexus/plugin-sdk/config-contracts";
export { isDangerousNameMatchingEnabled } from "FirstNexus/plugin-sdk/dangerous-name-runtime";
export { resolveDefaultGroupPolicy } from "FirstNexus/plugin-sdk/runtime-group-policy";
export { withFileLock } from "FirstNexus/plugin-sdk/file-lock";
export { keepHttpServerTaskAlive } from "FirstNexus/plugin-sdk/channel-lifecycle";
export {
  detectMime,
  extensionForMime,
  extractOriginalFilename,
  getFileExtension,
  resolveChannelMediaMaxBytes,
} from "FirstNexus/plugin-sdk/media-runtime";
export { dispatchReplyFromConfigWithSettledDispatcher } from "FirstNexus/plugin-sdk/inbound-reply-dispatch";
export { loadOutboundMediaFromUrl } from "FirstNexus/plugin-sdk/outbound-media";
export { buildMediaPayload } from "FirstNexus/plugin-sdk/reply-payload";
export type { ReplyPayload } from "FirstNexus/plugin-sdk/reply-payload";
export type { PluginRuntime } from "FirstNexus/plugin-sdk/runtime-store";
export type { RuntimeEnv } from "FirstNexus/plugin-sdk/runtime";
export type { SsrFPolicy } from "FirstNexus/plugin-sdk/ssrf-runtime";
export { fetchWithSsrFGuard } from "FirstNexus/plugin-sdk/ssrf-runtime";
export { normalizeStringEntries } from "FirstNexus/plugin-sdk/string-normalization-runtime";
export { chunkTextForOutbound } from "FirstNexus/plugin-sdk/text-chunking";
export { DEFAULT_WEBHOOK_MAX_BODY_BYTES } from "FirstNexus/plugin-sdk/webhook-ingress";
export { setMSTeamsRuntime } from "./src/runtime.js";
