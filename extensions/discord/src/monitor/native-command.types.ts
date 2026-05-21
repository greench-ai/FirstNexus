import type { FirstNexusConfig } from "FirstNexus/plugin-sdk/config-contracts";
import type { CommandArgValues } from "FirstNexus/plugin-sdk/native-command-registry";

export type DiscordConfig = NonNullable<FirstNexusConfig["channels"]>["discord"];

export type DiscordCommandArgs = {
  raw?: string;
  values?: CommandArgValues;
};
