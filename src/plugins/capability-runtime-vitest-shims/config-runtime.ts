import { resolveActiveTalkProviderConfig } from "../../config/talk.js";
import type { FirstNexusConfig } from "../../config/types.js";

export { resolveActiveTalkProviderConfig };

export function getRuntimeConfigSnapshot(): FirstNexusConfig | null {
  return null;
}
