import {
  resolveSessionStoreTargets,
  type SessionStoreSelectionOptions,
  type SessionStoreTarget,
} from "../config/sessions.js";
import type { FirstNexusConfig } from "../config/types.FirstNexus.js";
import { formatErrorMessage } from "../infra/errors.js";
import type { RuntimeEnv } from "../runtime.js";
export { resolveSessionStoreTargets, type SessionStoreSelectionOptions, type SessionStoreTarget };

export function resolveSessionStoreTargetsOrExit(params: {
  cfg: FirstNexusConfig;
  opts: SessionStoreSelectionOptions;
  runtime: RuntimeEnv;
}): SessionStoreTarget[] | null {
  try {
    return resolveSessionStoreTargets(params.cfg, params.opts);
  } catch (error) {
    params.runtime.error(formatErrorMessage(error));
    params.runtime.exit(1);
    return null;
  }
}
