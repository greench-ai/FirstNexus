import type { FirstNexusConfig } from "./runtime-api.js";
import { inspectTelegramAccount } from "./src/account-inspect.js";

export function inspectTelegramReadOnlyAccount(cfg: FirstNexusConfig, accountId?: string | null) {
  return inspectTelegramAccount({ cfg, accountId });
}
