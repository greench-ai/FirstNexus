import type { FirstNexusConfig } from "FirstNexus/plugin-sdk/config-contracts";

export type WhatsAppAccountConfig = NonNullable<
  NonNullable<NonNullable<FirstNexusConfig["channels"]>["whatsapp"]>["accounts"]
>[string];
