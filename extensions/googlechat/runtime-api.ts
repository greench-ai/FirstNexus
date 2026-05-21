// Private runtime barrel for the bundled Google Chat extension.
// Keep this barrel thin and avoid broad plugin-sdk surfaces during bootstrap.

export { DEFAULT_ACCOUNT_ID } from "FirstNexus/plugin-sdk/account-id";
export {
  createActionGate,
  jsonResult,
  readNumberParam,
  readReactionParams,
  readStringParam,
} from "FirstNexus/plugin-sdk/channel-actions";
export { buildChannelConfigSchema } from "FirstNexus/plugin-sdk/channel-config-primitives";
export type {
  ChannelMessageActionAdapter,
  ChannelMessageActionName,
  ChannelStatusIssue,
} from "FirstNexus/plugin-sdk/channel-contract";
export { missingTargetError } from "FirstNexus/plugin-sdk/channel-feedback";
export {
  createAccountStatusSink,
  runPassiveAccountLifecycle,
} from "FirstNexus/plugin-sdk/channel-lifecycle";
export { createChannelPairingController } from "FirstNexus/plugin-sdk/channel-pairing";
export { createChannelMessageReplyPipeline } from "FirstNexus/plugin-sdk/channel-message";
export { PAIRING_APPROVED_MESSAGE } from "FirstNexus/plugin-sdk/channel-status";
export { chunkTextForOutbound } from "FirstNexus/plugin-sdk/text-chunking";
export type { FirstNexusConfig } from "FirstNexus/plugin-sdk/config-contracts";
export { GoogleChatConfigSchema } from "FirstNexus/plugin-sdk/bundled-channel-config-schema";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "FirstNexus/plugin-sdk/runtime-group-policy";
export { isDangerousNameMatchingEnabled } from "FirstNexus/plugin-sdk/dangerous-name-runtime";
export { fetchRemoteMedia, resolveChannelMediaMaxBytes } from "FirstNexus/plugin-sdk/media-runtime";
export { loadOutboundMediaFromUrl } from "FirstNexus/plugin-sdk/outbound-media";
export type { PluginRuntime } from "FirstNexus/plugin-sdk/runtime-store";
export { fetchWithSsrFGuard } from "FirstNexus/plugin-sdk/ssrf-runtime";
export type {
  GoogleChatAccountConfig,
  GoogleChatConfig,
} from "FirstNexus/plugin-sdk/config-contracts";
export { extractToolSend } from "FirstNexus/plugin-sdk/tool-send";
export { resolveInboundMentionDecision } from "FirstNexus/plugin-sdk/channel-inbound";
export { resolveInboundRouteEnvelopeBuilderWithRuntime } from "FirstNexus/plugin-sdk/inbound-envelope";
export { resolveWebhookPath } from "FirstNexus/plugin-sdk/webhook-ingress";
export {
  registerWebhookTargetWithPluginRoute,
  resolveWebhookTargetWithAuthOrReject,
  withResolvedWebhookRequestPipeline,
} from "FirstNexus/plugin-sdk/webhook-targets";
export {
  createWebhookInFlightLimiter,
  readJsonWebhookBodyOrReject,
  type WebhookInFlightLimiter,
} from "FirstNexus/plugin-sdk/webhook-request-guards";
export { setGoogleChatRuntime } from "./src/runtime.js";
