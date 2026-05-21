import {
  getRuntimeConfigSnapshot,
  getRuntimeConfigSourceSnapshot,
} from "../config/runtime-snapshot.js";
import type { FirstNexusConfig } from "../config/types.FirstNexus.js";

export function resolvePluginActivationSourceConfig(params: {
  config?: FirstNexusConfig;
  activationSourceConfig?: FirstNexusConfig;
}): FirstNexusConfig {
  if (params.activationSourceConfig !== undefined) {
    return params.activationSourceConfig;
  }
  const sourceSnapshot = getRuntimeConfigSourceSnapshot();
  if (sourceSnapshot && params.config === getRuntimeConfigSnapshot()) {
    return sourceSnapshot;
  }
  return params.config ?? {};
}
