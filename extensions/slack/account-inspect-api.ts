import type { FirstNexusConfig } from "FirstNexus/plugin-sdk/config-contracts";
import { inspectSlackAccount } from "./src/account-inspect.js";

export function inspectSlackReadOnlyAccount(cfg: FirstNexusConfig, accountId?: string | null) {
  return inspectSlackAccount({ cfg, accountId });
}
