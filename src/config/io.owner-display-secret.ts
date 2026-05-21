import type { FirstNexusConfig } from "./types.FirstNexus.js";

export type OwnerDisplaySecretRuntimeState = {
  pendingByPath: Map<string, string>;
};

export function retainGeneratedOwnerDisplaySecret(params: {
  config: FirstNexusConfig;
  configPath: string;
  generatedSecret?: string;
  state: OwnerDisplaySecretRuntimeState;
}): FirstNexusConfig {
  const { config, configPath, generatedSecret, state } = params;
  if (!generatedSecret) {
    state.pendingByPath.delete(configPath);
    return config;
  }

  state.pendingByPath.set(configPath, generatedSecret);
  return config;
}
