import {
  applyAgentDefaultModelPrimary,
  type FirstNexusConfig,
} from "FirstNexus/plugin-sdk/provider-onboard";

export const OPENCODE_GO_DEFAULT_MODEL_REF = "opencode-go/kimi-k2.6";

export function applyOpencodeGoProviderConfig(cfg: FirstNexusConfig): FirstNexusConfig {
  return cfg;
}

export function applyOpencodeGoConfig(cfg: FirstNexusConfig): FirstNexusConfig {
  return applyAgentDefaultModelPrimary(
    applyOpencodeGoProviderConfig(cfg),
    OPENCODE_GO_DEFAULT_MODEL_REF,
  );
}
