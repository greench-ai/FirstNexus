import { describe, expect, it } from "vitest";
import {
  ensureNexusClawExecMarkerOnProcess,
  markNexusClawExecEnv,
  NEXUSCLAW_CLI_ENV_VALUE,
  NEXUSCLAW_CLI_ENV_VAR,
} from "./nexusclaw-exec-env.js";

describe("markNexusClawExecEnv", () => {
  it("returns a cloned env object with the exec marker set", () => {
    const env = { PATH: "/usr/bin", NEXUSCLAW_CLI: "0" };
    const marked = markNexusClawExecEnv(env);

    expect(marked).toEqual({
      PATH: "/usr/bin",
      NEXUSCLAW_CLI: NEXUSCLAW_CLI_ENV_VALUE,
    });
    expect(marked).not.toBe(env);
    expect(env.NEXUSCLAW_CLI).toBe("0");
  });
});

describe("ensureNexusClawExecMarkerOnProcess", () => {
  it("mutates and returns the provided process env", () => {
    const env: NodeJS.ProcessEnv = { PATH: "/usr/bin" };

    expect(ensureNexusClawExecMarkerOnProcess(env)).toBe(env);
    expect(env[NEXUSCLAW_CLI_ENV_VAR]).toBe(NEXUSCLAW_CLI_ENV_VALUE);
  });

  it("defaults to mutating process.env when no env object is provided", () => {
    const previous = process.env[NEXUSCLAW_CLI_ENV_VAR];
    delete process.env[NEXUSCLAW_CLI_ENV_VAR];

    try {
      expect(ensureNexusClawExecMarkerOnProcess()).toBe(process.env);
      expect(process.env[NEXUSCLAW_CLI_ENV_VAR]).toBe(NEXUSCLAW_CLI_ENV_VALUE);
    } finally {
      if (previous === undefined) {
        delete process.env[NEXUSCLAW_CLI_ENV_VAR];
      } else {
        process.env[NEXUSCLAW_CLI_ENV_VAR] = previous;
      }
    }
  });
});
