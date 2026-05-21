import {
  createDefaultModelsPresetAppliers,
  type FirstNexusConfig,
} from "FirstNexus/plugin-sdk/provider-onboard";
import { buildXiaomiProvider, XIAOMI_DEFAULT_MODEL_ID } from "./provider-catalog.js";

export const XIAOMI_DEFAULT_MODEL_REF = `xiaomi/${XIAOMI_DEFAULT_MODEL_ID}`;

const xiaomiPresetAppliers = createDefaultModelsPresetAppliers({
  primaryModelRef: XIAOMI_DEFAULT_MODEL_REF,
  resolveParams: (_cfg: FirstNexusConfig) => {
    const defaultProvider = buildXiaomiProvider();
    return {
      providerId: "xiaomi",
      api: defaultProvider.api ?? "openai-completions",
      baseUrl: defaultProvider.baseUrl,
      defaultModels: defaultProvider.models ?? [],
      defaultModelId: XIAOMI_DEFAULT_MODEL_ID,
      aliases: [{ modelRef: XIAOMI_DEFAULT_MODEL_REF, alias: "Xiaomi" }],
    };
  },
});

export function applyXiaomiProviderConfig(cfg: FirstNexusConfig): FirstNexusConfig {
  return xiaomiPresetAppliers.applyProviderConfig(cfg);
}

export function applyXiaomiConfig(cfg: FirstNexusConfig): FirstNexusConfig {
  return xiaomiPresetAppliers.applyConfig(cfg);
}
