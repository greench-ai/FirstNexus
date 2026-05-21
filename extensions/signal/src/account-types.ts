import type { FirstNexusConfig } from "FirstNexus/plugin-sdk/config-contracts";

export type SignalAccountConfig = Omit<
  Exclude<NonNullable<FirstNexusConfig["channels"]>["signal"], undefined>,
  "accounts"
>;
