import {
  getRuntimeConfig,
  getRuntimeConfigSourceSnapshot,
  type FirstNexusConfig,
} from "../config/config.js";

export function loadBrowserConfigForRuntimeRefresh(): FirstNexusConfig {
  return getRuntimeConfigSourceSnapshot() ?? getRuntimeConfig();
}
