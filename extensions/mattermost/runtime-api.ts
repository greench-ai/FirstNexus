// Private runtime barrel for the bundled Mattermost extension.
// Keep this barrel thin and generic-only.

export type {
  BaseProbeResult,
  ChannelAccountSnapshot,
  ChannelDirectoryEntry,
  ChannelGroupContext,
  ChannelMessageActionName,
  ChannelPlugin,
  ChatType,
  HistoryEntry,
  FirstNexusConfig,
  FirstNexusPluginApi,
  PluginRuntime,
} from "FirstNexus/plugin-sdk/core";
export type { RuntimeEnv } from "FirstNexus/plugin-sdk/runtime";
export type { ReplyPayload } from "FirstNexus/plugin-sdk/reply-runtime";
export type { ModelsProviderData } from "FirstNexus/plugin-sdk/models-provider-runtime";
export type {
  BlockStreamingCoalesceConfig,
  DmPolicy,
  GroupPolicy,
} from "FirstNexus/plugin-sdk/config-contracts";
export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  createDedupeCache,
  parseStrictPositiveInteger,
  resolveClientIp,
  isTrustedProxyAddress,
} from "FirstNexus/plugin-sdk/core";
export { buildComputedAccountStatusSnapshot } from "FirstNexus/plugin-sdk/channel-status";
export { createAccountStatusSink } from "FirstNexus/plugin-sdk/channel-lifecycle";
export { buildAgentMediaPayload } from "FirstNexus/plugin-sdk/agent-media-payload";
export {
  listSkillCommandsForAgents,
  resolveControlCommandGate,
  resolveStoredModelOverride,
} from "FirstNexus/plugin-sdk/command-auth-native";
export { buildModelsProviderData } from "FirstNexus/plugin-sdk/models-provider-runtime";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "FirstNexus/plugin-sdk/runtime-group-policy";
export { isDangerousNameMatchingEnabled } from "FirstNexus/plugin-sdk/dangerous-name-runtime";
export { loadSessionStore, resolveStorePath } from "FirstNexus/plugin-sdk/session-store-runtime";
export { formatInboundFromLabel } from "FirstNexus/plugin-sdk/channel-inbound";
export { logInboundDrop } from "FirstNexus/plugin-sdk/channel-inbound";
export { createChannelPairingController } from "FirstNexus/plugin-sdk/channel-pairing";
export { createChannelMessageReplyPipeline } from "FirstNexus/plugin-sdk/channel-message";
export { logTypingFailure } from "FirstNexus/plugin-sdk/channel-feedback";
export { loadOutboundMediaFromUrl } from "FirstNexus/plugin-sdk/outbound-media";
export { rawDataToString } from "FirstNexus/plugin-sdk/webhook-ingress";
export { chunkTextForOutbound } from "FirstNexus/plugin-sdk/text-chunking";
export {
  DEFAULT_GROUP_HISTORY_LIMIT,
  buildPendingHistoryContextFromMap,
  clearHistoryEntriesIfEnabled,
  recordPendingHistoryEntryIfEnabled,
} from "FirstNexus/plugin-sdk/reply-history";
export { normalizeAccountId, resolveThreadSessionKeys } from "FirstNexus/plugin-sdk/routing";
export { resolveAllowlistMatchSimple } from "FirstNexus/plugin-sdk/allow-from";
export { registerPluginHttpRoute } from "FirstNexus/plugin-sdk/webhook-targets";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
} from "FirstNexus/plugin-sdk/webhook-ingress";
export {
  applyAccountNameToChannelSection,
  applySetupAccountConfigPatch,
  migrateBaseNameToDefaultAccount,
} from "FirstNexus/plugin-sdk/setup";
export {
  getAgentScopedMediaLocalRoots,
  resolveChannelMediaMaxBytes,
} from "FirstNexus/plugin-sdk/media-runtime";
export { normalizeProviderId } from "FirstNexus/plugin-sdk/provider-model-shared";
export { setMattermostRuntime } from "./src/runtime.js";
