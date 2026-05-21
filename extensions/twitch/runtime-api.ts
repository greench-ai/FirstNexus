// Private runtime barrel for the bundled Twitch extension.
// Keep this barrel thin and aligned with the local extension surface.

export type {
  ChannelAccountSnapshot,
  ChannelCapabilities,
  ChannelGatewayContext,
  ChannelLogSink,
  ChannelMessageActionAdapter,
  ChannelMessageActionContext,
  ChannelMeta,
  ChannelOutboundAdapter,
  ChannelOutboundContext,
  ChannelResolveKind,
  ChannelResolveResult,
  ChannelStatusAdapter,
} from "FirstNexus/plugin-sdk/channel-contract";
export type { ChannelPlugin } from "FirstNexus/plugin-sdk/channel-core";
export type { OutboundDeliveryResult } from "FirstNexus/plugin-sdk/channel-send-result";
export type { FirstNexusConfig } from "FirstNexus/plugin-sdk/config-contracts";
export type { RuntimeEnv } from "FirstNexus/plugin-sdk/runtime";
export type { WizardPrompter } from "FirstNexus/plugin-sdk/setup";
