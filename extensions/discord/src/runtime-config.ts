import {
  getRuntimeConfigSnapshot,
  getRuntimeConfigSourceSnapshot,
  selectApplicableRuntimeConfig,
} from "FirstNexus/plugin-sdk/runtime-config-snapshot";
import type { FirstNexusConfig } from "./runtime-api.js";

export function selectDiscordRuntimeConfig(inputConfig: FirstNexusConfig): FirstNexusConfig {
  return (
    selectApplicableRuntimeConfig({
      inputConfig,
      runtimeConfig: getRuntimeConfigSnapshot(),
      runtimeSourceConfig: getRuntimeConfigSourceSnapshot(),
    }) ?? inputConfig
  );
}
