// Private runtime barrel for the bundled IRC extension.
// Keep this barrel thin and generic-only.

export type { BaseProbeResult } from "FirstNexus/plugin-sdk/channel-contract";
export type { ChannelPlugin } from "FirstNexus/plugin-sdk/channel-core";
export type { FirstNexusConfig } from "FirstNexus/plugin-sdk/config-contracts";
export type { PluginRuntime } from "FirstNexus/plugin-sdk/runtime-store";
export type { RuntimeEnv } from "FirstNexus/plugin-sdk/runtime";
export type {
  BlockStreamingCoalesceConfig,
  DmConfig,
  DmPolicy,
  GroupPolicy,
  GroupToolPolicyBySenderConfig,
  GroupToolPolicyConfig,
  MarkdownConfig,
} from "FirstNexus/plugin-sdk/config-contracts";
export type { OutboundReplyPayload } from "FirstNexus/plugin-sdk/reply-payload";
export { DEFAULT_ACCOUNT_ID } from "FirstNexus/plugin-sdk/account-id";
export { buildChannelConfigSchema } from "FirstNexus/plugin-sdk/channel-config-primitives";
export {
  PAIRING_APPROVED_MESSAGE,
  buildBaseChannelStatusSummary,
} from "FirstNexus/plugin-sdk/channel-status";
export { createChannelPairingController } from "FirstNexus/plugin-sdk/channel-pairing";
export { createAccountStatusSink } from "FirstNexus/plugin-sdk/channel-lifecycle";
export { resolveControlCommandGate } from "FirstNexus/plugin-sdk/command-auth-native";
export { createChannelMessageReplyPipeline } from "FirstNexus/plugin-sdk/channel-message";
export { chunkTextForOutbound } from "FirstNexus/plugin-sdk/text-chunking";
export {
  deliverFormattedTextWithAttachments,
  formatTextWithAttachmentLinks,
  resolveOutboundMediaUrls,
} from "FirstNexus/plugin-sdk/reply-payload";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "FirstNexus/plugin-sdk/runtime-group-policy";
export { isDangerousNameMatchingEnabled } from "FirstNexus/plugin-sdk/dangerous-name-runtime";
export { logInboundDrop } from "FirstNexus/plugin-sdk/channel-inbound";
