import type { FirstNexusConfig } from "FirstNexus/plugin-sdk/config-contracts";

export type IMessageAccountConfig = Omit<
  NonNullable<NonNullable<FirstNexusConfig["channels"]>["imessage"]>,
  "accounts" | "defaultAccount"
>;
