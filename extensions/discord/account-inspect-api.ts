import type { FirstNexusConfig } from "FirstNexus/plugin-sdk/config-contracts";
import { inspectDiscordAccount } from "./src/account-inspect.js";

export function inspectDiscordReadOnlyAccount(cfg: FirstNexusConfig, accountId?: string | null) {
  return inspectDiscordAccount({ cfg, accountId });
}
