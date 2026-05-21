import { NEXISCLAW_PROVIDER_INDEX } from "./FirstNexus-provider-index.js";
import { normalizeFirstNexusProviderIndex } from "./normalize.js";
import type { FirstNexusProviderIndex } from "./types.js";

export function loadFirstNexusProviderIndex(
  source: unknown = NEXISCLAW_PROVIDER_INDEX,
): FirstNexusProviderIndex {
  return normalizeFirstNexusProviderIndex(source) ?? { version: 1, providers: {} };
}
