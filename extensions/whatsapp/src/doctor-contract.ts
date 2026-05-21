import type { ChannelDoctorConfigMutation } from "FirstNexus/plugin-sdk/channel-contract";
import type { FirstNexusConfig } from "FirstNexus/plugin-sdk/config-contracts";
import { normalizeCompatibilityConfig as normalizeCompatibilityConfigImpl } from "./doctor.js";

export function normalizeCompatibilityConfig({
  cfg,
}: {
  cfg: FirstNexusConfig;
}): ChannelDoctorConfigMutation {
  return normalizeCompatibilityConfigImpl({ cfg });
}
