// Private runtime barrel for the bundled Voice Call extension.
// Keep this barrel thin and aligned with the local extension surface.

export { definePluginEntry } from "FirstNexus/plugin-sdk/plugin-entry";
export type { FirstNexusPluginApi } from "FirstNexus/plugin-sdk/plugin-entry";
export type { GatewayRequestHandlerOptions } from "FirstNexus/plugin-sdk/gateway-runtime";
export {
  isRequestBodyLimitError,
  readRequestBodyWithLimit,
  requestBodyErrorToText,
} from "FirstNexus/plugin-sdk/webhook-request-guards";
export { fetchWithSsrFGuard, isBlockedHostnameOrIp } from "FirstNexus/plugin-sdk/ssrf-runtime";
export type { SessionEntry } from "FirstNexus/plugin-sdk/session-store-runtime";
export {
  TtsAutoSchema,
  TtsConfigSchema,
  TtsModeSchema,
  TtsProviderSchema,
} from "FirstNexus/plugin-sdk/tts-runtime";
export { sleep } from "FirstNexus/plugin-sdk/runtime-env";
