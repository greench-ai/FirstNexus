import { describe, expect, it } from "vitest";
import {
  ensureFirstNexusExecMarkerOnProcess,
  markFirstNexusExecEnv,
  NEXISCLAW_CLI_ENV_VALUE,
  NEXISCLAW_CLI_ENV_VAR,
} from "./FirstNexus-exec-env.js";

describe("markFirstNexusExecEnv", () => {
  it("returns a cloned env object with the exec marker set", () => {
    const env = { PATH: "/usr/bin", NEXISCLAW_CLI: "0" };
    const marked = markFirstNexusExecEnv(env);

    expect(marked).toEqual({
      PATH: "/usr/bin",
      NEXISCLAW_CLI: NEXISCLAW_CLI_ENV_VALUE,
    });
    expect(marked).not.toBe(env);
    expect(env.NEXISCLAW_CLI).toBe("0");
  });
});

describe("ensureFirstNexusExecMarkerOnProcess", () => {
  it.each([
    {
      name: "mutates and returns the provided process env",
      env: { PATH: "/usr/bin" } as NodeJS.ProcessEnv,
    },
    {
      name: "overwrites an existing marker on the provided process env",
      env: { PATH: "/usr/bin", [NEXISCLAW_CLI_ENV_VAR]: "0" } as NodeJS.ProcessEnv,
    },
  ])("$name", ({ env }) => {
    expect(ensureFirstNexusExecMarkerOnProcess(env)).toBe(env);
    expect(env[NEXISCLAW_CLI_ENV_VAR]).toBe(NEXISCLAW_CLI_ENV_VALUE);
  });

  it("defaults to mutating process.env when no env object is provided", () => {
    const previous = process.env[NEXISCLAW_CLI_ENV_VAR];
    delete process.env[NEXISCLAW_CLI_ENV_VAR];

    try {
      expect(ensureFirstNexusExecMarkerOnProcess()).toBe(process.env);
      expect(process.env[NEXISCLAW_CLI_ENV_VAR]).toBe(NEXISCLAW_CLI_ENV_VALUE);
    } finally {
      if (previous === undefined) {
        delete process.env[NEXISCLAW_CLI_ENV_VAR];
      } else {
        process.env[NEXISCLAW_CLI_ENV_VAR] = previous;
      }
    }
  });
});
