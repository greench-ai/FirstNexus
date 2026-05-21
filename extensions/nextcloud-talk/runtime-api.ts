// Private runtime barrel for the bundled Nextcloud Talk extension.
// Keep this barrel thin and aligned with the local extension surface.

export type { AllowlistMatch } from "FirstNexus/plugin-sdk/allow-from";
export type { ChannelGroupContext } from "FirstNexus/plugin-sdk/channel-contract";
export { logInboundDrop } from "FirstNexus/plugin-sdk/channel-logging";
export { createChannelPairingController } from "FirstNexus/plugin-sdk/channel-pairing";
export type {
  BlockStreamingCoalesceConfig,
  DmConfig,
  DmPolicy,
  GroupPolicy,
  GroupToolPolicyConfig,
  FirstNexusConfig,
} from "FirstNexus/plugin-sdk/config-contracts";
export {
  GROUP_POLICY_BLOCKED_LABEL,
  resolveAllowlistProviderRuntimeGroupPolicy,
  resolveDefaultGroupPolicy,
  warnMissingProviderGroupPolicyFallbackOnce,
} from "FirstNexus/plugin-sdk/runtime-group-policy";
export { createChannelMessageReplyPipeline } from "FirstNexus/plugin-sdk/channel-message";
export type { OutboundReplyPayload } from "FirstNexus/plugin-sdk/reply-payload";
export { deliverFormattedTextWithAttachments } from "FirstNexus/plugin-sdk/reply-payload";
export type { PluginRuntime } from "FirstNexus/plugin-sdk/runtime-store";
export type { RuntimeEnv } from "FirstNexus/plugin-sdk/runtime";
export type { SecretInput } from "FirstNexus/plugin-sdk/secret-input";
export { fetchWithSsrFGuard } from "FirstNexus/plugin-sdk/ssrf-runtime";
export { setNextcloudTalkRuntime } from "./src/runtime.js";
