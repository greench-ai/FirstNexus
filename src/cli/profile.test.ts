import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "nexusclaw",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "nexusclaw", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "nexusclaw", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "nexusclaw", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "nexusclaw", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "nexusclaw", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "nexusclaw", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it.each([
    ["--dev first", ["node", "nexusclaw", "--dev", "--profile", "work", "status"]],
    ["--profile first", ["node", "nexusclaw", "--profile", "work", "--dev", "status"]],
  ])("rejects combining --dev with --profile (%s)", (_name, argv) => {
    const res = parseCliProfileArgs(argv);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join(path.resolve("/home/peter"), ".nexusclaw-dev");
    expect(env.NEXUSCLAW_PROFILE).toBe("dev");
    expect(env.NEXUSCLAW_STATE_DIR).toBe(expectedStateDir);
    expect(env.NEXUSCLAW_CONFIG_PATH).toBe(path.join(expectedStateDir, "nexusclaw.json"));
    expect(env.NEXUSCLAW_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      NEXUSCLAW_STATE_DIR: "/custom",
      NEXUSCLAW_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.NEXUSCLAW_STATE_DIR).toBe("/custom");
    expect(env.NEXUSCLAW_GATEWAY_PORT).toBe("19099");
    expect(env.NEXUSCLAW_CONFIG_PATH).toBe(path.join("/custom", "nexusclaw.json"));
  });

  it("uses NEXUSCLAW_HOME when deriving profile state dir", () => {
    const env: Record<string, string | undefined> = {
      NEXUSCLAW_HOME: "/srv/nexusclaw-home",
      HOME: "/home/other",
    };
    applyCliProfileEnv({
      profile: "work",
      env,
      homedir: () => "/home/fallback",
    });

    const resolvedHome = path.resolve("/srv/nexusclaw-home");
    expect(env.NEXUSCLAW_STATE_DIR).toBe(path.join(resolvedHome, ".nexusclaw-work"));
    expect(env.NEXUSCLAW_CONFIG_PATH).toBe(
      path.join(resolvedHome, ".nexusclaw-work", "nexusclaw.json"),
    );
  });
});

describe("formatCliCommand", () => {
  it.each([
    {
      name: "no profile is set",
      cmd: "nexusclaw doctor --fix",
      env: {},
      expected: "nexusclaw doctor --fix",
    },
    {
      name: "profile is default",
      cmd: "nexusclaw doctor --fix",
      env: { NEXUSCLAW_PROFILE: "default" },
      expected: "nexusclaw doctor --fix",
    },
    {
      name: "profile is Default (case-insensitive)",
      cmd: "nexusclaw doctor --fix",
      env: { NEXUSCLAW_PROFILE: "Default" },
      expected: "nexusclaw doctor --fix",
    },
    {
      name: "profile is invalid",
      cmd: "nexusclaw doctor --fix",
      env: { NEXUSCLAW_PROFILE: "bad profile" },
      expected: "nexusclaw doctor --fix",
    },
    {
      name: "--profile is already present",
      cmd: "nexusclaw --profile work doctor --fix",
      env: { NEXUSCLAW_PROFILE: "work" },
      expected: "nexusclaw --profile work doctor --fix",
    },
    {
      name: "--dev is already present",
      cmd: "nexusclaw --dev doctor",
      env: { NEXUSCLAW_PROFILE: "dev" },
      expected: "nexusclaw --dev doctor",
    },
  ])("returns command unchanged when $name", ({ cmd, env, expected }) => {
    expect(formatCliCommand(cmd, env)).toBe(expected);
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("nexusclaw doctor --fix", { NEXUSCLAW_PROFILE: "work" })).toBe(
      "nexusclaw --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(formatCliCommand("nexusclaw doctor --fix", { NEXUSCLAW_PROFILE: "  jbnexusclaw  " })).toBe(
      "nexusclaw --profile jbnexusclaw doctor --fix",
    );
  });

  it("handles command with no args after nexusclaw", () => {
    expect(formatCliCommand("nexusclaw", { NEXUSCLAW_PROFILE: "test" })).toBe(
      "nexusclaw --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm nexusclaw doctor", { NEXUSCLAW_PROFILE: "work" })).toBe(
      "pnpm nexusclaw --profile work doctor",
    );
  });
});
