import { describe, expect, it } from "vitest";
import {
  compareFirstNexusReleaseVersions,
  formatPrereleaseResolutionError,
  isExactSemverVersion,
  isFirstNexusStableCorrectionVersion,
  isPrereleaseSemverVersion,
  isPrereleaseResolutionAllowed,
  parseRegistryNpmSpec,
  validateRegistryNpmSpec,
} from "./npm-registry-spec.js";

function parseSpecOrThrow(spec: string) {
  const parsed = parseRegistryNpmSpec(spec);
  if (parsed === null) {
    throw new Error(`Expected ${spec} to parse`);
  }
  return parsed;
}

describe("npm registry spec validation", () => {
  it.each([
    "@FirstNexus/voice-call",
    "@FirstNexus/voice-call@1.2.3",
    "@FirstNexus/voice-call@1.2.3-beta.4",
    "@FirstNexus/voice-call@latest",
    "@FirstNexus/voice-call@beta",
  ])("accepts %s", (spec) => {
    expect(validateRegistryNpmSpec(spec)).toBeNull();
  });

  it.each([
    {
      spec: "@FirstNexus/voice-call@^1.2.3",
      expected: "exact version or dist-tag",
    },
    {
      spec: "@FirstNexus/voice-call@~1.2.3",
      expected: "exact version or dist-tag",
    },
    {
      spec: "https://npmjs.org/pkg.tgz",
      expected: "URLs are not allowed",
    },
    {
      spec: "git+ssh://github.com/FirstNexus/FirstNexus",
      expected: "URLs are not allowed",
    },
    {
      spec: "@FirstNexus/voice-call@",
      expected: "missing version/tag after @",
    },
    {
      spec: "@FirstNexus/voice-call@../beta",
      expected: "invalid version/tag",
    },
  ])("rejects %s", ({ spec, expected }) => {
    expect(validateRegistryNpmSpec(spec)).toContain(expected);
  });
});

describe("npm registry spec parsing helpers", () => {
  it.each([
    {
      spec: "@FirstNexus/voice-call",
      expected: {
        name: "@FirstNexus/voice-call",
        raw: "@FirstNexus/voice-call",
        selectorKind: "none",
        selectorIsPrerelease: false,
      },
    },
    {
      spec: "@FirstNexus/voice-call@beta",
      expected: {
        name: "@FirstNexus/voice-call",
        raw: "@FirstNexus/voice-call@beta",
        selector: "beta",
        selectorKind: "tag",
        selectorIsPrerelease: false,
      },
    },
    {
      spec: "@FirstNexus/voice-call@2026.5.3-1",
      expected: {
        name: "@FirstNexus/voice-call",
        raw: "@FirstNexus/voice-call@2026.5.3-1",
        selector: "2026.5.3-1",
        selectorKind: "exact-version",
        selectorIsPrerelease: false,
      },
    },
    {
      spec: "@FirstNexus/voice-call@1.2.3-beta.1",
      expected: {
        name: "@FirstNexus/voice-call",
        raw: "@FirstNexus/voice-call@1.2.3-beta.1",
        selector: "1.2.3-beta.1",
        selectorKind: "exact-version",
        selectorIsPrerelease: true,
      },
    },
  ])("parses %s", ({ spec, expected }) => {
    expect(parseRegistryNpmSpec(spec)).toEqual(expected);
  });

  it.each([
    { value: "v1.2.3", expected: true },
    { value: "1.2", expected: false },
  ])("detects exact semver versions for %s", ({ value, expected }) => {
    expect(isExactSemverVersion(value)).toBe(expected);
  });

  it.each([
    { value: "1.2.3-beta.1", expected: true },
    { value: "1.2.3-1", expected: true },
    { value: "2026.5.3-beta.1", expected: true },
    { value: "2026.5.3-1", expected: false },
    { value: "2026.2.30-1", expected: true },
    { value: "1.2.3", expected: false },
  ])("detects prerelease semver versions for %s", ({ value, expected }) => {
    expect(isPrereleaseSemverVersion(value)).toBe(expected);
  });

  it.each([
    { value: "2026.5.3-1", expected: true },
    { value: "2026.5.3-2", expected: true },
    { value: "2026.5.3-beta.1", expected: false },
    { value: "1.2.3-1", expected: false },
    { value: "2026.2.30-1", expected: false },
  ])("detects FirstNexus stable correction versions for %s", ({ value, expected }) => {
    expect(isFirstNexusStableCorrectionVersion(value)).toBe(expected);
  });

  it.each([
    { left: "2026.5.3-1", right: "2026.5.3", expected: 1 },
    { left: "2026.5.3-2", right: "2026.5.3-1", expected: 1 },
    { left: "2026.5.3", right: "2026.5.3-beta.3", expected: 1 },
    { left: "2026.5.3-beta.3", right: "2026.5.3-alpha.9", expected: 1 },
    { left: "1.2.3-1", right: "1.2.3", expected: null },
  ])("compares FirstNexus release versions for %s and %s", ({ left, right, expected }) => {
    expect(compareFirstNexusReleaseVersions(left, right)).toBe(expected);
  });
});

describe("npm prerelease resolution policy", () => {
  it.each([
    {
      spec: "@FirstNexus/voice-call",
      resolvedVersion: "1.2.3-beta.1",
      expected: false,
    },
    {
      spec: "@FirstNexus/voice-call@latest",
      resolvedVersion: "1.2.3-rc.1",
      expected: false,
    },
    {
      spec: "@FirstNexus/voice-call@latest",
      resolvedVersion: "2026.5.3-1",
      expected: true,
    },
    {
      spec: "@FirstNexus/voice-call@beta",
      resolvedVersion: "1.2.3-beta.4",
      expected: true,
    },
    {
      spec: "@FirstNexus/voice-call@1.2.3-beta.1",
      resolvedVersion: "1.2.3-beta.1",
      expected: true,
    },
    {
      spec: "@FirstNexus/voice-call",
      resolvedVersion: "1.2.3",
      expected: true,
    },
    {
      spec: "@FirstNexus/voice-call@latest",
      resolvedVersion: undefined,
      expected: true,
    },
  ])("decides prerelease resolution for %s -> %s", ({ spec, resolvedVersion, expected }) => {
    expect(
      isPrereleaseResolutionAllowed({
        spec: parseSpecOrThrow(spec),
        resolvedVersion,
      }),
    ).toBe(expected);
  });

  it.each([
    {
      spec: "@FirstNexus/voice-call",
      resolvedVersion: "1.2.3-beta.1",
      expected: `Use "@FirstNexus/voice-call@beta"`,
    },
    {
      spec: "@FirstNexus/voice-call@beta",
      resolvedVersion: "1.2.3-rc.1",
      expected: "Use an explicit prerelease tag or exact prerelease version",
    },
  ])("formats prerelease guidance for %s", ({ spec, resolvedVersion, expected }) => {
    expect(
      formatPrereleaseResolutionError({
        spec: parseSpecOrThrow(spec),
        resolvedVersion,
      }),
    ).toContain(expected);
  });
});
