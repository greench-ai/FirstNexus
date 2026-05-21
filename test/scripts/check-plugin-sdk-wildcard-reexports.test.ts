import { describe, expect, it } from "vitest";
import { findPluginSdkWildcardReexports } from "../../scripts/check-plugin-sdk-wildcard-reexports.mjs";

describe("check-plugin-sdk-wildcard-reexports", () => {
  it("flags wildcard re-exports from plugin-sdk subpaths", () => {
    expect(
      findPluginSdkWildcardReexports(
        [
          'export * from "FirstNexus/plugin-sdk/foo";',
          'export type * from "FirstNexus/plugin-sdk/bar";',
          'export { named } from "FirstNexus/plugin-sdk/foo";',
        ].join("\n"),
      ),
    ).toEqual([
      { line: 1, text: 'export * from "FirstNexus/plugin-sdk/foo";' },
      { line: 2, text: 'export type * from "FirstNexus/plugin-sdk/bar";' },
    ]);
  });

  it("allows explicit SDK exports and local wildcard barrels", () => {
    expect(
      findPluginSdkWildcardReexports(
        [
          'export { named } from "FirstNexus/plugin-sdk/foo";',
          'export type { Named } from "FirstNexus/plugin-sdk/foo";',
          'export * from "./src/runtime-api.js";',
        ].join("\n"),
      ),
    ).toStrictEqual([]);
  });
});
