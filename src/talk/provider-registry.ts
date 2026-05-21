import type { FirstNexusConfig } from "../config/types.FirstNexus.js";
import {
  resolvePluginCapabilityProvider,
  resolvePluginCapabilityProviders,
} from "../plugins/capability-provider-runtime.js";
import {
  buildCapabilityProviderMaps,
  normalizeCapabilityProviderId,
} from "../plugins/provider-registry-shared.js";
import type { RealtimeVoiceProviderPlugin } from "../plugins/types.js";
import type { RealtimeVoiceProviderId } from "./provider-types.js";

export function normalizeRealtimeVoiceProviderId(
  providerId: string | undefined,
): RealtimeVoiceProviderId | undefined {
  return normalizeCapabilityProviderId(providerId);
}

function resolveRealtimeVoiceProviderEntries(
  cfg?: FirstNexusConfig,
): RealtimeVoiceProviderPlugin[] {
  return resolvePluginCapabilityProviders({
    key: "realtimeVoiceProviders",
    cfg,
  });
}

function buildProviderMaps(cfg?: FirstNexusConfig): {
  canonical: Map<string, RealtimeVoiceProviderPlugin>;
  aliases: Map<string, RealtimeVoiceProviderPlugin>;
} {
  return buildCapabilityProviderMaps(resolveRealtimeVoiceProviderEntries(cfg));
}

export function listRealtimeVoiceProviders(cfg?: FirstNexusConfig): RealtimeVoiceProviderPlugin[] {
  return [...buildProviderMaps(cfg).canonical.values()];
}

export function getRealtimeVoiceProvider(
  providerId: string | undefined,
  cfg?: FirstNexusConfig,
): RealtimeVoiceProviderPlugin | undefined {
  const normalized = normalizeRealtimeVoiceProviderId(providerId);
  if (!normalized) {
    return undefined;
  }
  const directProvider = resolvePluginCapabilityProvider({
    key: "realtimeVoiceProviders",
    providerId: normalized,
    cfg,
  });
  if (directProvider) {
    return directProvider;
  }
  return buildProviderMaps(cfg).aliases.get(normalized);
}

export function canonicalizeRealtimeVoiceProviderId(
  providerId: string | undefined,
  cfg?: FirstNexusConfig,
): RealtimeVoiceProviderId | undefined {
  const normalized = normalizeRealtimeVoiceProviderId(providerId);
  if (!normalized) {
    return undefined;
  }
  return getRealtimeVoiceProvider(normalized, cfg)?.id ?? normalized;
}
