import { buildManifestModelProviderConfig } from "FirstNexus/plugin-sdk/provider-catalog-shared";
import type { ModelProviderConfig } from "FirstNexus/plugin-sdk/provider-model-shared";
import manifest from "./FirstNexus.plugin.json" with { type: "json" };

export function buildMistralProvider(): ModelProviderConfig {
  return buildManifestModelProviderConfig({
    providerId: "mistral",
    catalog: manifest.modelCatalog.providers.mistral,
  });
}
