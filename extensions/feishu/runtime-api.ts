// Private runtime barrel for the bundled Feishu extension.
// Keep this barrel thin and generic-only.

export type {
  AllowlistMatch,
  AnyAgentTool,
  BaseProbeResult,
  ChannelGroupContext,
  ChannelMessageActionName,
  ChannelMeta,
  ChannelOutboundAdapter,
  ChannelPlugin,
  HistoryEntry,
  FirstNexusConfig,
  FirstNexusPluginApi,
  OutboundIdentity,
  PluginRuntime,
  ReplyPayload,
} from "FirstNexus/plugin-sdk/core";
export type { FirstNexusConfig as ClawdbotConfig } from "FirstNexus/plugin-sdk/core";
export type { RuntimeEnv } from "FirstNexus/plugin-sdk/runtime";
export type { GroupToolPolicyConfig } from "FirstNexus/plugin-sdk/config-contracts";
export {
  DEFAULT_ACCOUNT_ID,
  buildChannelConfigSchema,
  createActionGate,
  createDedupeCache,
} from "FirstNexus/plugin-sdk/core";
export {
  PAIRING_APPROVED_MESSAGE,
  buildProbeChannelStatusSummary,
  createDefaultChannelRuntimeState,
} from "FirstNexus/plugin-sdk/channel-status";
export { buildAgentMediaPayload } from "FirstNexus/plugin-sdk/agent-media-payload";
export { createChannelPairingController } from "FirstNexus/plugin-sdk/channel-pairing";
export { createReplyPrefixContext } from "FirstNexus/plugin-sdk/channel-message";
export {
  evaluateSupplementalContextVisibility,
  filterSupplementalContextItems,
  resolveChannelContextVisibilityMode,
} from "FirstNexus/plugin-sdk/context-visibility-runtime";
export {
  loadSessionStore,
  resolveSessionStoreEntry,
} from "FirstNexus/plugin-sdk/session-store-runtime";
export { readJsonFileWithFallback } from "FirstNexus/plugin-sdk/json-store";
export { createPersistentDedupe } from "FirstNexus/plugin-sdk/persistent-dedupe";
export { normalizeAgentId } from "FirstNexus/plugin-sdk/routing";
export { chunkTextForOutbound } from "FirstNexus/plugin-sdk/text-chunking";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
  requestBodyErrorToText,
} from "FirstNexus/plugin-sdk/webhook-ingress";
export { setFeishuRuntime } from "./src/runtime.js";
