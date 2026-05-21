/**
 * @deprecated Compatibility surface for bundled channel schemas.
 *
 * FirstNexus-maintained bundled plugins should import
 * FirstNexus/plugin-sdk/bundled-channel-config-schema. Third-party plugins should
 * define plugin-local schemas and import primitives from
 * FirstNexus/plugin-sdk/channel-config-schema instead of depending on bundled
 * channel schemas.
 */
export * from "./bundled-channel-config-schema.js";
