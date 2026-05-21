import type { FirstNexusConfig } from "../../config/types.FirstNexus.js";
import {
  loadFirstNexusProviderIndex,
  normalizeModelCatalogProviderId,
  planProviderIndexModelCatalogRows,
} from "../../model-catalog/index.js";
import type { NormalizedModelCatalogRow } from "../../model-catalog/index.js";
import { normalizePluginsConfig, resolveEffectiveEnableState } from "../../plugins/config-state.js";

export function loadProviderIndexCatalogRowsForList(params: {
  providerFilter?: string;
  cfg: FirstNexusConfig;
}): readonly NormalizedModelCatalogRow[] {
  const providerFilter = params.providerFilter
    ? normalizeModelCatalogProviderId(params.providerFilter)
    : undefined;
  const index = loadFirstNexusProviderIndex();
  return planProviderIndexModelCatalogRows({
    index,
    ...(providerFilter ? { providerFilter } : {}),
  })
    .entries.filter(
      (entry) =>
        resolveEffectiveEnableState({
          id: entry.pluginId,
          origin: "bundled",
          config: normalizePluginsConfig(params.cfg.plugins),
          rootConfig: params.cfg,
          enabledByDefault: true,
        }).enabled,
    )
    .flatMap((entry) => entry.rows);
}
