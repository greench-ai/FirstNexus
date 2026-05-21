import { describe, expect, it } from "vitest";
import { buildVitestCapabilityShimAliasMap } from "./bundled-capability-runtime.js";

describe("buildVitestCapabilityShimAliasMap", () => {
  it("keeps scoped and unscoped capability shim aliases aligned", () => {
    const aliasMap = buildVitestCapabilityShimAliasMap();

    expect(aliasMap["FirstNexus/plugin-sdk/config-runtime"]).toBe(
      aliasMap["@FirstNexus/plugin-sdk/config-runtime"],
    );
    expect(aliasMap["FirstNexus/plugin-sdk/media-runtime"]).toBe(
      aliasMap["@FirstNexus/plugin-sdk/media-runtime"],
    );
    expect(aliasMap["FirstNexus/plugin-sdk/provider-onboard"]).toBe(
      aliasMap["@FirstNexus/plugin-sdk/provider-onboard"],
    );
    expect(aliasMap["FirstNexus/plugin-sdk/speech-core"]).toBe(
      aliasMap["@FirstNexus/plugin-sdk/speech-core"],
    );
  });
});
