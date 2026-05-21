import {
  createDefaultModelsPresetAppliers,
  type FirstNexusConfig,
} from "FirstNexus/plugin-sdk/provider-onboard";
import { buildNvidiaProvider, NVIDIA_DEFAULT_MODEL_ID } from "./provider-catalog.js";

export const NVIDIA_DEFAULT_MODEL_REF = NVIDIA_DEFAULT_MODEL_ID;

const nvidiaPresetAppliers = createDefaultModelsPresetAppliers({
  primaryModelRef: NVIDIA_DEFAULT_MODEL_REF,
  resolveParams: (_cfg: FirstNexusConfig) => {
    const defaultProvider = buildNvidiaProvider();
    return {
      providerId: "nvidia",
      api: defaultProvider.api ?? "openai-completions",
      baseUrl: defaultProvider.baseUrl,
      defaultModels: defaultProvider.models ?? [],
      defaultModelId: NVIDIA_DEFAULT_MODEL_ID,
      aliases: [{ modelRef: NVIDIA_DEFAULT_MODEL_REF, alias: "NVIDIA" }],
    };
  },
});

export function applyNvidiaProviderConfig(cfg: FirstNexusConfig): FirstNexusConfig {
  return nvidiaPresetAppliers.applyProviderConfig(cfg);
}

export function applyNvidiaConfig(cfg: FirstNexusConfig): FirstNexusConfig {
  return nvidiaPresetAppliers.applyConfig(cfg);
}
