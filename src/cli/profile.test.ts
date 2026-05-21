import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "FirstNexus",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "FirstNexus", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("leaves gateway --dev for subcommands after leading root options", () => {
    const res = parseCliProfileArgs([
      "node",
      "FirstNexus",
      "--no-color",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual([
      "node",
      "FirstNexus",
      "--no-color",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "FirstNexus", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "FirstNexus", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "FirstNexus", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "FirstNexus", "status"]);
  });

  it("parses interleaved --profile after the command token", () => {
    const res = parseCliProfileArgs([
      "node",
      "FirstNexus",
      "status",
      "--profile",
      "work",
      "--deep",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "FirstNexus", "status", "--deep"]);
  });

  it("preserves Matrix QA --profile for the command parser", () => {
    const res = parseCliProfileArgs([
      "node",
      "FirstNexus",
      "qa",
      "matrix",
      "--profile",
      "fast",
      "--fail-fast",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual([
      "node",
      "FirstNexus",
      "qa",
      "matrix",
      "--profile",
      "fast",
      "--fail-fast",
    ]);
  });

  it("preserves Matrix QA --profile after leading root options", () => {
    const res = parseCliProfileArgs([
      "node",
      "FirstNexus",
      "--no-color",
      "qa",
      "matrix",
      "--profile=fast",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual([
      "node",
      "FirstNexus",
      "--no-color",
      "qa",
      "matrix",
      "--profile=fast",
    ]);
  });

  it("still parses root --profile before Matrix QA", () => {
    const res = parseCliProfileArgs([
      "node",
      "FirstNexus",
      "--profile",
      "work",
      "qa",
      "matrix",
      "--fail-fast",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "FirstNexus", "qa", "matrix", "--fail-fast"]);
  });

  it("parses interleaved --dev after the command token", () => {
    const res = parseCliProfileArgs(["node", "FirstNexus", "status", "--dev"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "FirstNexus", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "FirstNexus", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it.each([
    ["--dev first", ["node", "FirstNexus", "--dev", "--profile", "work", "status"]],
    ["--profile first", ["node", "FirstNexus", "--profile", "work", "--dev", "status"]],
    ["interleaved after command", ["node", "FirstNexus", "status", "--profile", "work", "--dev"]],
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
    const expectedStateDir = path.join(path.resolve("/home/peter"), ".FirstNexus-dev");
    expect(env.NEXISCLAW_PROFILE).toBe("dev");
    expect(env.NEXISCLAW_STATE_DIR).toBe(expectedStateDir);
    expect(env.NEXISCLAW_CONFIG_PATH).toBe(path.join(expectedStateDir, "FirstNexus.json"));
    expect(env.NEXISCLAW_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      NEXISCLAW_STATE_DIR: "/custom",
      NEXISCLAW_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.NEXISCLAW_STATE_DIR).toBe("/custom");
    expect(env.NEXISCLAW_GATEWAY_PORT).toBe("19099");
    expect(env.NEXISCLAW_CONFIG_PATH).toBe(path.join("/custom", "FirstNexus.json"));
  });

  it("uses NEXISCLAW_HOME when deriving profile state dir", () => {
    const env: Record<string, string | undefined> = {
      NEXISCLAW_HOME: "/srv/FirstNexus-home",
      HOME: "/home/other",
    };
    applyCliProfileEnv({
      profile: "work",
      env,
      homedir: () => "/home/fallback",
    });

    const resolvedHome = path.resolve("/srv/FirstNexus-home");
    expect(env.NEXISCLAW_STATE_DIR).toBe(path.join(resolvedHome, ".FirstNexus-work"));
    expect(env.NEXISCLAW_CONFIG_PATH).toBe(
      path.join(resolvedHome, ".FirstNexus-work", "FirstNexus.json"),
    );
  });
});

describe("formatCliCommand", () => {
  it.each([
    {
      name: "no profile is set",
      cmd: "FirstNexus doctor --fix",
      env: {},
      expected: "FirstNexus doctor --fix",
    },
    {
      name: "profile is default",
      cmd: "FirstNexus doctor --fix",
      env: { NEXISCLAW_PROFILE: "default" },
      expected: "FirstNexus doctor --fix",
    },
    {
      name: "profile is Default (case-insensitive)",
      cmd: "FirstNexus doctor --fix",
      env: { NEXISCLAW_PROFILE: "Default" },
      expected: "FirstNexus doctor --fix",
    },
    {
      name: "profile is invalid",
      cmd: "FirstNexus doctor --fix",
      env: { NEXISCLAW_PROFILE: "bad profile" },
      expected: "FirstNexus doctor --fix",
    },
    {
      name: "--profile is already present",
      cmd: "FirstNexus --profile work doctor --fix",
      env: { NEXISCLAW_PROFILE: "work" },
      expected: "FirstNexus --profile work doctor --fix",
    },
    {
      name: "--dev is already present",
      cmd: "FirstNexus --dev doctor",
      env: { NEXISCLAW_PROFILE: "dev" },
      expected: "FirstNexus --dev doctor",
    },
  ])("returns command unchanged when $name", ({ cmd, env, expected }) => {
    expect(formatCliCommand(cmd, env)).toBe(expected);
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("FirstNexus doctor --fix", { NEXISCLAW_PROFILE: "work" })).toBe(
      "FirstNexus --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(
      formatCliCommand("FirstNexus doctor --fix", { NEXISCLAW_PROFILE: "  jbFirstNexus  " }),
    ).toBe("FirstNexus --profile jbFirstNexus doctor --fix");
  });

  it("handles command with no args after FirstNexus", () => {
    expect(formatCliCommand("FirstNexus", { NEXISCLAW_PROFILE: "test" })).toBe(
      "FirstNexus --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm FirstNexus doctor", { NEXISCLAW_PROFILE: "work" })).toBe(
      "pnpm FirstNexus --profile work doctor",
    );
  });

  it("inserts --container when a container hint is set", () => {
    expect(
      formatCliCommand("FirstNexus gateway status --deep", { NEXISCLAW_CONTAINER_HINT: "demo" }),
    ).toBe("FirstNexus --container demo gateway status --deep");
  });

  it("ignores unsafe container hints", () => {
    expect(
      formatCliCommand("FirstNexus gateway status --deep", {
        NEXISCLAW_CONTAINER_HINT: "demo; rm -rf /",
      }),
    ).toBe("FirstNexus gateway status --deep");
  });

  it("preserves both --container and --profile hints", () => {
    expect(
      formatCliCommand("FirstNexus doctor", {
        NEXISCLAW_CONTAINER_HINT: "demo",
        NEXISCLAW_PROFILE: "work",
      }),
    ).toBe("FirstNexus --container demo doctor");
  });

  it("does not prepend --container for update commands", () => {
    expect(formatCliCommand("FirstNexus update", { NEXISCLAW_CONTAINER_HINT: "demo" })).toBe(
      "FirstNexus update",
    );
    expect(
      formatCliCommand("pnpm FirstNexus update --channel beta", {
        NEXISCLAW_CONTAINER_HINT: "demo",
      }),
    ).toBe("pnpm FirstNexus update --channel beta");
  });
});
