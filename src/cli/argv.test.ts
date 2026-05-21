import { describe, expect, it } from "vitest";
import {
  buildParseArgv,
  getFlagValue,
  getCommandPath,
  getCommandPositionalsWithRootOptions,
  getCommandPathWithRootOptions,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasHelpOrVersion,
  hasFlag,
  isHelpOrVersionInvocation,
  isRootHelpInvocation,
  isRootVersionInvocation,
  shouldMigrateState,
  shouldMigrateStateFromPath,
} from "./argv.js";

describe("argv helpers", () => {
  it.each([
    {
      name: "help flag",
      argv: ["node", "FirstNexus", "--help"],
      expected: true,
    },
    {
      name: "version flag",
      argv: ["node", "FirstNexus", "-V"],
      expected: true,
    },
    {
      name: "normal command",
      argv: ["node", "FirstNexus", "status"],
      expected: false,
    },
    {
      name: "root -v alias",
      argv: ["node", "FirstNexus", "-v"],
      expected: true,
    },
    {
      name: "root -v alias with profile",
      argv: ["node", "FirstNexus", "--profile", "work", "-v"],
      expected: true,
    },
    {
      name: "root -v alias with log-level",
      argv: ["node", "FirstNexus", "--log-level", "debug", "-v"],
      expected: true,
    },
    {
      name: "subcommand -v should not be treated as version",
      argv: ["node", "FirstNexus", "acp", "-v"],
      expected: false,
    },
    {
      name: "root -v alias with equals profile",
      argv: ["node", "FirstNexus", "--profile=work", "-v"],
      expected: true,
    },
    {
      name: "subcommand path after global root flags should not be treated as version",
      argv: ["node", "FirstNexus", "--dev", "skills", "list", "-v"],
      expected: false,
    },
  ])("detects help/version flags: $name", ({ argv, expected }) => {
    expect(hasHelpOrVersion(argv)).toBe(expected);
  });

  it.each([
    {
      name: "root help command",
      argv: ["node", "FirstNexus", "help"],
      expected: true,
    },
    {
      name: "root help command with target",
      argv: ["node", "FirstNexus", "help", "matrix"],
      expected: true,
    },
    {
      name: "nested help command",
      argv: ["node", "FirstNexus", "matrix", "encryption", "help"],
      expected: true,
    },
    {
      name: "known subcommand root help command",
      argv: ["node", "FirstNexus", "config", "help"],
      expected: true,
    },
    {
      name: "known leaf command positional help",
      argv: ["node", "FirstNexus", "docs", "help"],
      expected: false,
    },
    {
      name: "known subcommand leaf positional help",
      argv: ["node", "FirstNexus", "config", "set", "some.path", "help"],
      expected: false,
    },
    {
      name: "unknown plugin command help",
      argv: ["node", "FirstNexus", "external-plugin", "tools", "help"],
      expected: true,
    },
    {
      name: "help flag",
      argv: ["node", "FirstNexus", "matrix", "encryption", "--help"],
      expected: true,
    },
    {
      name: "help as option value",
      argv: ["node", "FirstNexus", "agent", "--message", "help"],
      expected: false,
    },
    {
      name: "help after terminator",
      argv: ["node", "FirstNexus", "nodes", "invoke", "--", "help"],
      expected: false,
    },
    {
      name: "help flag after terminator",
      argv: ["node", "FirstNexus", "nodes", "invoke", "--", "--help"],
      expected: false,
    },
    {
      name: "version flag after terminator",
      argv: ["node", "FirstNexus", "nodes", "invoke", "--", "--version"],
      expected: false,
    },
  ])("detects help/version invocations: $name", ({ argv, expected }) => {
    expect(isHelpOrVersionInvocation(argv)).toBe(expected);
  });

  it.each([
    {
      name: "root --version",
      argv: ["node", "FirstNexus", "--version"],
      expected: true,
    },
    {
      name: "root -V",
      argv: ["node", "FirstNexus", "-V"],
      expected: true,
    },
    {
      name: "root -v alias with profile",
      argv: ["node", "FirstNexus", "--profile", "work", "-v"],
      expected: true,
    },
    {
      name: "subcommand version flag",
      argv: ["node", "FirstNexus", "status", "--version"],
      expected: false,
    },
    {
      name: "unknown root flag with version",
      argv: ["node", "FirstNexus", "--unknown", "--version"],
      expected: false,
    },
  ])("detects root-only version invocations: $name", ({ argv, expected }) => {
    expect(isRootVersionInvocation(argv)).toBe(expected);
  });

  it.each([
    {
      name: "root --help",
      argv: ["node", "FirstNexus", "--help"],
      expected: true,
    },
    {
      name: "root -h",
      argv: ["node", "FirstNexus", "-h"],
      expected: true,
    },
    {
      name: "root --help with profile",
      argv: ["node", "FirstNexus", "--profile", "work", "--help"],
      expected: true,
    },
    {
      name: "subcommand --help",
      argv: ["node", "FirstNexus", "status", "--help"],
      expected: false,
    },
    {
      name: "help before subcommand token",
      argv: ["node", "FirstNexus", "--help", "status"],
      expected: false,
    },
    {
      name: "help after -- terminator",
      argv: ["node", "FirstNexus", "nodes", "invoke", "--", "device.status", "--help"],
      expected: false,
    },
    {
      name: "unknown root flag before help",
      argv: ["node", "FirstNexus", "--unknown", "--help"],
      expected: false,
    },
    {
      name: "unknown root flag after help",
      argv: ["node", "FirstNexus", "--help", "--unknown"],
      expected: false,
    },
  ])("detects root-only help invocations: $name", ({ argv, expected }) => {
    expect(isRootHelpInvocation(argv)).toBe(expected);
  });

  it.each([
    {
      name: "single command with trailing flag",
      argv: ["node", "FirstNexus", "status", "--json"],
      expected: ["status"],
    },
    {
      name: "two-part command",
      argv: ["node", "FirstNexus", "agents", "list"],
      expected: ["agents", "list"],
    },
    {
      name: "terminator cuts parsing",
      argv: ["node", "FirstNexus", "status", "--", "ignored"],
      expected: ["status"],
    },
  ])("extracts command path: $name", ({ argv, expected }) => {
    expect(getCommandPath(argv, 2)).toEqual(expected);
  });

  it("extracts command path while skipping known root option values", () => {
    expect(
      getCommandPathWithRootOptions(
        [
          "node",
          "FirstNexus",
          "--profile",
          "work",
          "--container",
          "demo",
          "--no-color",
          "config",
          "validate",
        ],
        2,
      ),
    ).toEqual(["config", "validate"]);
  });

  it("extracts routed config get positionals with interleaved root options", () => {
    expect(
      getCommandPositionalsWithRootOptions(
        ["node", "FirstNexus", "config", "get", "--log-level", "debug", "update.channel", "--json"],
        {
          commandPath: ["config", "get"],
          booleanFlags: ["--json"],
        },
      ),
    ).toEqual(["update.channel"]);
  });

  it("extracts routed config unset positionals with interleaved root options", () => {
    expect(
      getCommandPositionalsWithRootOptions(
        ["node", "FirstNexus", "config", "unset", "--profile", "work", "update.channel"],
        {
          commandPath: ["config", "unset"],
        },
      ),
    ).toEqual(["update.channel"]);
  });

  it("returns null when routed command sees unknown options", () => {
    expect(
      getCommandPositionalsWithRootOptions(
        ["node", "FirstNexus", "config", "get", "--mystery", "value", "update.channel"],
        {
          commandPath: ["config", "get"],
          booleanFlags: ["--json"],
        },
      ),
    ).toBeNull();
  });

  it.each([
    {
      name: "returns first command token",
      argv: ["node", "FirstNexus", "agents", "list"],
      expected: "agents",
    },
    {
      name: "returns null when no command exists",
      argv: ["node", "FirstNexus"],
      expected: null,
    },
    {
      name: "skips known root option values",
      argv: ["node", "FirstNexus", "--log-level", "debug", "status"],
      expected: "status",
    },
  ])("returns primary command: $name", ({ argv, expected }) => {
    expect(getPrimaryCommand(argv)).toBe(expected);
  });

  it.each([
    {
      name: "detects flag before terminator",
      argv: ["node", "FirstNexus", "status", "--json"],
      flag: "--json",
      expected: true,
    },
    {
      name: "ignores flag after terminator",
      argv: ["node", "FirstNexus", "--", "--json"],
      flag: "--json",
      expected: false,
    },
  ])("parses boolean flags: $name", ({ argv, flag, expected }) => {
    expect(hasFlag(argv, flag)).toBe(expected);
  });

  it.each([
    {
      name: "value in next token",
      argv: ["node", "FirstNexus", "status", "--timeout", "5000"],
      expected: "5000",
    },
    {
      name: "value in equals form",
      argv: ["node", "FirstNexus", "status", "--timeout=2500"],
      expected: "2500",
    },
    {
      name: "missing value",
      argv: ["node", "FirstNexus", "status", "--timeout"],
      expected: null,
    },
    {
      name: "next token is another flag",
      argv: ["node", "FirstNexus", "status", "--timeout", "--json"],
      expected: null,
    },
    {
      name: "flag appears after terminator",
      argv: ["node", "FirstNexus", "--", "--timeout=99"],
      expected: undefined,
    },
  ])("extracts flag values: $name", ({ argv, expected }) => {
    expect(getFlagValue(argv, "--timeout")).toBe(expected);
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "FirstNexus", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "FirstNexus", "status", "--debug"])).toBe(false);
    expect(
      getVerboseFlag(["node", "FirstNexus", "status", "--debug"], { includeDebug: true }),
    ).toBe(true);
  });

  it.each([
    {
      name: "missing flag",
      argv: ["node", "FirstNexus", "status"],
      expected: undefined,
    },
    {
      name: "missing value",
      argv: ["node", "FirstNexus", "status", "--timeout"],
      expected: null,
    },
    {
      name: "valid positive integer",
      argv: ["node", "FirstNexus", "status", "--timeout", "5000"],
      expected: 5000,
    },
    {
      name: "invalid integer",
      argv: ["node", "FirstNexus", "status", "--timeout", "nope"],
      expected: undefined,
    },
  ])("parses positive integer flag values: $name", ({ argv, expected }) => {
    expect(getPositiveIntFlagValue(argv, "--timeout")).toBe(expected);
  });

  it.each([
    {
      name: "keeps plain node argv",
      rawArgs: ["node", "FirstNexus", "status"],
      expected: ["node", "FirstNexus", "status"],
    },
    {
      name: "keeps version-suffixed node binary",
      rawArgs: ["node-22", "FirstNexus", "status"],
      expected: ["node-22", "FirstNexus", "status"],
    },
    {
      name: "keeps windows versioned node exe",
      rawArgs: ["node-22.2.0.exe", "FirstNexus", "status"],
      expected: ["node-22.2.0.exe", "FirstNexus", "status"],
    },
    {
      name: "keeps dotted node binary",
      rawArgs: ["node-22.2", "FirstNexus", "status"],
      expected: ["node-22.2", "FirstNexus", "status"],
    },
    {
      name: "keeps dotted node exe",
      rawArgs: ["node-22.2.exe", "FirstNexus", "status"],
      expected: ["node-22.2.exe", "FirstNexus", "status"],
    },
    {
      name: "keeps absolute versioned node path",
      rawArgs: ["/usr/bin/node-22.2.0", "FirstNexus", "status"],
      expected: ["/usr/bin/node-22.2.0", "FirstNexus", "status"],
    },
    {
      name: "keeps node24 shorthand",
      rawArgs: ["node24", "FirstNexus", "status"],
      expected: ["node24", "FirstNexus", "status"],
    },
    {
      name: "keeps absolute node24 shorthand",
      rawArgs: ["/usr/bin/node24", "FirstNexus", "status"],
      expected: ["/usr/bin/node24", "FirstNexus", "status"],
    },
    {
      name: "keeps windows node24 exe",
      rawArgs: ["node24.exe", "FirstNexus", "status"],
      expected: ["node24.exe", "FirstNexus", "status"],
    },
    {
      name: "keeps nodejs binary",
      rawArgs: ["nodejs", "FirstNexus", "status"],
      expected: ["nodejs", "FirstNexus", "status"],
    },
    {
      name: "prefixes fallback when first arg is not a node launcher",
      rawArgs: ["node-dev", "FirstNexus", "status"],
      expected: ["node", "FirstNexus", "node-dev", "FirstNexus", "status"],
    },
    {
      name: "prefixes fallback when raw args start at program name",
      rawArgs: ["FirstNexus", "status"],
      expected: ["node", "FirstNexus", "status"],
    },
    {
      name: "keeps bun execution argv",
      rawArgs: ["bun", "src/entry.ts", "status"],
      expected: ["bun", "src/entry.ts", "status"],
    },
  ] as const)("builds parse argv from raw args: $name", ({ rawArgs, expected }) => {
    const parsed = buildParseArgv({
      programName: "FirstNexus",
      rawArgs: [...rawArgs],
    });
    expect(parsed).toEqual([...expected]);
  });

  it("builds parse argv from fallback args", () => {
    const fallbackArgv = buildParseArgv({
      programName: "FirstNexus",
      fallbackArgv: ["status"],
    });
    expect(fallbackArgv).toEqual(["node", "FirstNexus", "status"]);
  });

  it.each([
    { argv: ["node", "FirstNexus", "status"], expected: false },
    { argv: ["node", "FirstNexus", "health"], expected: false },
    { argv: ["node", "FirstNexus", "sessions"], expected: false },
    { argv: ["node", "FirstNexus", "config", "get", "update"], expected: false },
    { argv: ["node", "FirstNexus", "config", "unset", "update"], expected: false },
    { argv: ["node", "FirstNexus", "models", "list"], expected: false },
    { argv: ["node", "FirstNexus", "models", "status"], expected: false },
    { argv: ["node", "FirstNexus", "update", "status", "--json"], expected: false },
    { argv: ["node", "FirstNexus", "agent", "--message", "hi"], expected: false },
    { argv: ["node", "FirstNexus", "agents", "list"], expected: true },
    { argv: ["node", "FirstNexus", "message", "send"], expected: true },
  ] as const)("decides when to migrate state: $argv", ({ argv, expected }) => {
    expect(shouldMigrateState([...argv])).toBe(expected);
  });

  it.each([
    { path: ["status"], expected: false },
    { path: ["update", "status"], expected: false },
    { path: ["config", "get"], expected: false },
    { path: ["models", "status"], expected: false },
    { path: ["agents", "list"], expected: true },
  ])("reuses command path for migrate state decisions: $path", ({ path, expected }) => {
    expect(shouldMigrateStateFromPath(path)).toBe(expected);
  });
});
