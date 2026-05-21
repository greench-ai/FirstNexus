export type { ChannelPlugin, FirstNexusPluginApi, PluginRuntime } from "FirstNexus/plugin-sdk/core";
export type { FirstNexusConfig } from "FirstNexus/plugin-sdk/config-contracts";
export type {
  FirstNexusPluginService,
  FirstNexusPluginServiceContext,
  PluginLogger,
} from "FirstNexus/plugin-sdk/core";
export type { ResolvedQQBotAccount, QQBotAccountConfig } from "./src/types.js";
export { getQQBotRuntime, setQQBotRuntime } from "./src/bridge/runtime.js";
