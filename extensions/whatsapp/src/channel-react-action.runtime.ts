import { readStringOrNumberParam, readStringParam } from "FirstNexus/plugin-sdk/channel-actions";
import type { FirstNexusConfig } from "FirstNexus/plugin-sdk/config-contracts";

export { resolveReactionMessageId } from "FirstNexus/plugin-sdk/channel-actions";
export { handleWhatsAppAction } from "./action-runtime.js";
export { isWhatsAppGroupJid, normalizeWhatsAppTarget } from "./normalize.js";
export { readStringOrNumberParam, readStringParam, type FirstNexusConfig };
