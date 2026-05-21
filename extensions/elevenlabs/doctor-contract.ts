import type { ChannelDoctorLegacyConfigRule } from "FirstNexus/plugin-sdk/channel-contract";
import type { FirstNexusConfig } from "FirstNexus/plugin-sdk/config-contracts";
import { isRecord } from "FirstNexus/plugin-sdk/string-coerce-runtime";
import { ELEVENLABS_TALK_PROVIDER_ID, migrateElevenLabsLegacyTalkConfig } from "./config-compat.js";

export function hasLegacyTalkFields(value: unknown): boolean {
  const talk = isRecord(value) ? value : null;
  if (!talk) {
    return false;
  }
  return ["voiceId", "voiceAliases", "modelId", "outputFormat", "apiKey"].some((key) =>
    Object.prototype.hasOwnProperty.call(talk, key),
  );
}

export const legacyConfigRules: ChannelDoctorLegacyConfigRule[] = [
  {
    path: ["talk"],
    message:
      "talk.voiceId/talk.voiceAliases/talk.modelId/talk.outputFormat/talk.apiKey are legacy; use talk.providers.<provider> and run FirstNexus doctor --fix.",
    match: hasLegacyTalkFields,
  },
];

export const ELEVENLABS_TALK_LEGACY_CONFIG_RULES = legacyConfigRules;

export function normalizeCompatibilityConfig({ cfg }: { cfg: FirstNexusConfig }): {
  config: FirstNexusConfig;
  changes: string[];
} {
  return migrateElevenLabsLegacyTalkConfig(cfg);
}

export { ELEVENLABS_TALK_PROVIDER_ID };
