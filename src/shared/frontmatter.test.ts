import { describe, expect, it, test } from "vitest";
import {
  applyFirstNexusManifestInstallCommonFields,
  getFrontmatterString,
  normalizeStringList,
  parseFrontmatterBool,
  parseFirstNexusManifestInstallBase,
  resolveFirstNexusManifestBlock,
  resolveFirstNexusManifestInstall,
  resolveFirstNexusManifestOs,
  resolveFirstNexusManifestRequires,
} from "./frontmatter.js";

function expectInstallBase(
  parsed: ReturnType<typeof parseFirstNexusManifestInstallBase>,
): NonNullable<ReturnType<typeof parseFirstNexusManifestInstallBase>> {
  if (parsed === undefined) {
    throw new Error("Expected manifest install base");
  }
  return parsed;
}

describe("shared/frontmatter", () => {
  test("normalizeStringList handles strings, arrays, and non-list values", () => {
    expect(normalizeStringList("a, b,,c")).toEqual(["a", "b", "c"]);
    expect(normalizeStringList([" a ", "", "b", 42])).toEqual(["a", "b", "42"]);
    expect(normalizeStringList(null)).toStrictEqual([]);
  });

  test("getFrontmatterString extracts strings only", () => {
    expect(getFrontmatterString({ a: "b" }, "a")).toBe("b");
    expect(getFrontmatterString({ a: 1 }, "a")).toBeUndefined();
  });

  test("parseFrontmatterBool respects explicit values and fallback", () => {
    expect(parseFrontmatterBool("true", false)).toBe(true);
    expect(parseFrontmatterBool("false", true)).toBe(false);
    expect(parseFrontmatterBool(undefined, true)).toBe(true);
    expect(parseFrontmatterBool("maybe", false)).toBe(false);
  });

  test("resolveFirstNexusManifestBlock reads current manifest keys and custom metadata fields", () => {
    expect(
      resolveFirstNexusManifestBlock({
        frontmatter: {
          metadata: "{ FirstNexus: { foo: 1, bar: 'baz' } }",
        },
      }),
    ).toEqual({ foo: 1, bar: "baz" });

    expect(
      resolveFirstNexusManifestBlock({
        frontmatter: {
          pluginMeta: "{ FirstNexus: { foo: 2 } }",
        },
        key: "pluginMeta",
      }),
    ).toEqual({ foo: 2 });
  });

  test("resolveFirstNexusManifestBlock reads legacy manifest keys", () => {
    expect(
      resolveFirstNexusManifestBlock({
        frontmatter: {
          metadata: "{ clawdbot: { requires: { bins: ['op'] }, install: [] } }",
        },
      }),
    ).toEqual({ requires: { bins: ["op"] }, install: [] });
  });

  test("resolveFirstNexusManifestBlock prefers current manifest keys over legacy keys", () => {
    expect(
      resolveFirstNexusManifestBlock({
        frontmatter: {
          metadata:
            "{ FirstNexus: { requires: { bins: ['current'] } }, clawdbot: { requires: { bins: ['legacy'] } } }",
        },
      }),
    ).toEqual({ requires: { bins: ["current"] } });
  });

  test("resolveFirstNexusManifestBlock returns undefined for invalid input", () => {
    expect(resolveFirstNexusManifestBlock({ frontmatter: {} })).toBeUndefined();
    expect(
      resolveFirstNexusManifestBlock({ frontmatter: { metadata: "not-json5" } }),
    ).toBeUndefined();
    expect(resolveFirstNexusManifestBlock({ frontmatter: { metadata: "123" } })).toBeUndefined();
    expect(resolveFirstNexusManifestBlock({ frontmatter: { metadata: "[]" } })).toBeUndefined();
    expect(
      resolveFirstNexusManifestBlock({ frontmatter: { metadata: "{ nope: { a: 1 } }" } }),
    ).toBeUndefined();
  });

  it("normalizes manifest requirement and os lists", () => {
    expect(
      resolveFirstNexusManifestRequires({
        requires: {
          bins: "bun, node",
          anyBins: [" ffmpeg ", ""],
          env: ["NEXISCLAW_TOKEN", " NEXISCLAW_URL "],
          config: null,
        },
      }),
    ).toEqual({
      bins: ["bun", "node"],
      anyBins: ["ffmpeg"],
      env: ["NEXISCLAW_TOKEN", "NEXISCLAW_URL"],
      config: [],
    });
    expect(resolveFirstNexusManifestRequires({})).toBeUndefined();
    expect(resolveFirstNexusManifestOs({ os: [" darwin ", "linux", ""] })).toEqual([
      "darwin",
      "linux",
    ]);
  });

  it("parses and applies install common fields", () => {
    const parsed = parseFirstNexusManifestInstallBase(
      {
        type: " Brew ",
        id: "brew.git",
        label: "Git",
        bins: [" git ", "git"],
      },
      ["brew", "npm"],
    );

    expect(parsed).toEqual({
      raw: {
        type: " Brew ",
        id: "brew.git",
        label: "Git",
        bins: [" git ", "git"],
      },
      kind: "brew",
      id: "brew.git",
      label: "Git",
      bins: ["git", "git"],
    });
    expect(parseFirstNexusManifestInstallBase({ kind: "bad" }, ["brew"])).toBeUndefined();
    expect(
      applyFirstNexusManifestInstallCommonFields<{
        extra: boolean;
        id?: string;
        label?: string;
        bins?: string[];
      }>({ extra: true }, expectInstallBase(parsed)),
    ).toEqual({
      extra: true,
      id: "brew.git",
      label: "Git",
      bins: ["git", "git"],
    });
  });

  it("prefers explicit kind, ignores invalid common fields, and leaves missing ones untouched", () => {
    const parsed = parseFirstNexusManifestInstallBase(
      {
        kind: " npm ",
        type: "brew",
        id: 42,
        label: null,
        bins: [" ", ""],
      },
      ["brew", "npm"],
    );

    expect(parsed).toEqual({
      raw: {
        kind: " npm ",
        type: "brew",
        id: 42,
        label: null,
        bins: [" ", ""],
      },
      kind: "npm",
    });
    expect(
      applyFirstNexusManifestInstallCommonFields(
        { id: "keep", label: "Keep", bins: ["bun"] },
        parsed!,
      ),
    ).toEqual({
      id: "keep",
      label: "Keep",
      bins: ["bun"],
    });
  });

  it("maps install entries through the parser and filters rejected specs", () => {
    expect(
      resolveFirstNexusManifestInstall(
        {
          install: [{ id: "keep" }, { id: "drop" }, "bad"],
        },
        (entry) => {
          if (
            typeof entry === "object" &&
            entry !== null &&
            (entry as { id?: string }).id === "keep"
          ) {
            return { id: "keep" };
          }
          return undefined;
        },
      ),
    ).toEqual([{ id: "keep" }]);
  });
});
