import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createFirstNexusTestState, withFirstNexusTestState } from "./FirstNexus-test-state.js";

async function expectPathMissing(targetPath: string): Promise<void> {
  try {
    await fs.stat(targetPath);
  } catch (error) {
    expect((error as NodeJS.ErrnoException).code).toBe("ENOENT");
    return;
  }
  throw new Error(`expected missing path: ${targetPath}`);
}

describe("FirstNexus test state", () => {
  it("creates an isolated home layout with spawn env and restores process env", async () => {
    const previousHome = process.env.HOME;
    const previousFirstNexusHome = process.env.NEXISCLAW_HOME;
    const previousStateDir = process.env.NEXISCLAW_STATE_DIR;
    const previousConfigPath = process.env.NEXISCLAW_CONFIG_PATH;

    const state = await createFirstNexusTestState({
      label: "unit",
      scenario: "minimal",
    });

    try {
      expect(state.home).toBe(path.join(state.root, "home"));
      expect(state.stateDir).toBe(path.join(state.home, ".FirstNexus"));
      expect(state.configPath).toBe(path.join(state.stateDir, "FirstNexus.json"));
      expect(state.workspaceDir).toBe(path.join(state.home, "workspace"));
      expect(state.env.HOME).toBe(state.home);
      expect(state.env.NEXISCLAW_HOME).toBe(state.home);
      expect(state.env.NEXISCLAW_STATE_DIR).toBe(state.stateDir);
      expect(state.env.NEXISCLAW_CONFIG_PATH).toBe(state.configPath);
      expect(process.env.HOME).toBe(state.home);
      expect(process.env.NEXISCLAW_HOME).toBe(state.home);
      expect(JSON.parse(await fs.readFile(state.configPath, "utf8"))).toStrictEqual({});
    } finally {
      await state.cleanup();
    }

    expect(process.env.HOME).toBe(previousHome);
    expect(process.env.NEXISCLAW_HOME).toBe(previousFirstNexusHome);
    expect(process.env.NEXISCLAW_STATE_DIR).toBe(previousStateDir);
    expect(process.env.NEXISCLAW_CONFIG_PATH).toBe(previousConfigPath);
    await expectPathMissing(state.root);
  });

  it("supports state-only layout without overriding HOME", async () => {
    const previousHome = process.env.HOME;

    await withFirstNexusTestState(
      {
        layout: "state-only",
        scenario: "empty",
      },
      async (state) => {
        expect(process.env.HOME).toBe(previousHome);
        expect(process.env.NEXISCLAW_STATE_DIR).toBe(state.stateDir);
        expect(process.env.NEXISCLAW_CONFIG_PATH).toBe(state.configPath);
        expect(state.env.HOME).toBe(previousHome);
        await expectPathMissing(state.configPath);
      },
    );
  });

  it("clears inherited agent-dir overrides by default", async () => {
    const previousAgentDir = process.env.NEXISCLAW_AGENT_DIR;
    const previousPiAgentDir = process.env.PI_CODING_AGENT_DIR;
    process.env.NEXISCLAW_AGENT_DIR = "/tmp/outside-FirstNexus-agent";
    process.env.PI_CODING_AGENT_DIR = "/tmp/outside-pi-agent";

    try {
      const state = await createFirstNexusTestState({
        layout: "state-only",
      });

      try {
        expect(process.env.NEXISCLAW_AGENT_DIR).toBeUndefined();
        expect(process.env.PI_CODING_AGENT_DIR).toBeUndefined();
        expect(state.env.NEXISCLAW_AGENT_DIR).toBeUndefined();
        expect(state.env.PI_CODING_AGENT_DIR).toBeUndefined();
        expect(state.agentDir()).toBe(path.join(state.stateDir, "agents", "main", "agent"));
      } finally {
        await state.cleanup();
      }

      expect(process.env.NEXISCLAW_AGENT_DIR).toBe("/tmp/outside-FirstNexus-agent");
      expect(process.env.PI_CODING_AGENT_DIR).toBe("/tmp/outside-pi-agent");
    } finally {
      if (previousAgentDir === undefined) {
        delete process.env.NEXISCLAW_AGENT_DIR;
      } else {
        process.env.NEXISCLAW_AGENT_DIR = previousAgentDir;
      }
      if (previousPiAgentDir === undefined) {
        delete process.env.PI_CODING_AGENT_DIR;
      } else {
        process.env.PI_CODING_AGENT_DIR = previousPiAgentDir;
      }
    }
  });

  it("allows explicit agent-dir overrides when a test needs them", async () => {
    await withFirstNexusTestState(
      {
        env: {
          NEXISCLAW_AGENT_DIR: "/tmp/explicit-FirstNexus-agent",
          PI_CODING_AGENT_DIR: "/tmp/explicit-pi-agent",
        },
      },
      async (state) => {
        expect(process.env.NEXISCLAW_AGENT_DIR).toBe("/tmp/explicit-FirstNexus-agent");
        expect(process.env.PI_CODING_AGENT_DIR).toBe("/tmp/explicit-pi-agent");
        expect(state.env.NEXISCLAW_AGENT_DIR).toBe("/tmp/explicit-FirstNexus-agent");
        expect(state.env.PI_CODING_AGENT_DIR).toBe("/tmp/explicit-pi-agent");
      },
    );
  });

  it("can route agent-dir env vars to the isolated main agent store", async () => {
    await withFirstNexusTestState(
      {
        agentEnv: "main",
      },
      async (state) => {
        expect(process.env.NEXISCLAW_AGENT_DIR).toBe(state.agentDir());
        expect(process.env.PI_CODING_AGENT_DIR).toBe(state.agentDir());
        expect(state.env.NEXISCLAW_AGENT_DIR).toBe(state.agentDir());
        expect(state.env.PI_CODING_AGENT_DIR).toBe(state.agentDir());
      },
    );
  });

  it("writes scenario configs and auth profile stores", async () => {
    await withFirstNexusTestState(
      {
        scenario: "update-stable",
      },
      async (state) => {
        expect(JSON.parse(await fs.readFile(state.configPath, "utf8"))).toEqual({
          update: {
            channel: "stable",
          },
          plugins: {},
        });

        const profilePath = await state.writeAuthProfiles({
          version: 1,
          profiles: {
            "openai:test": {
              type: "api_key",
              provider: "openai",
              key: "sk-test",
            },
          },
        });

        expect(profilePath).toBe(path.join(state.agentDir(), "auth-profiles.json"));
        const profiles = JSON.parse(await fs.readFile(profilePath, "utf8")) as {
          version?: unknown;
          profiles?: Record<string, { provider?: unknown }>;
        };
        expect(profiles.version).toBe(1);
        expect(profiles.profiles?.["openai:test"]?.provider).toBe("openai");
      },
    );
  });

  it("creates upgrade survivor fixture state", async () => {
    await withFirstNexusTestState(
      {
        scenario: "upgrade-survivor",
      },
      async (state) => {
        const config = JSON.parse(await fs.readFile(state.configPath, "utf8"));
        expect(config.update?.channel).toBe("stable");
        expect(config.plugins?.enabled).toBe(true);
        expect(config.plugins?.allow).toStrictEqual(["discord", "telegram", "whatsapp", "memory"]);
      },
    );
  });

  it("keeps external-service env scoped to the fixture", async () => {
    const previousPolicy = process.env.NEXISCLAW_SERVICE_REPAIR_POLICY;

    await withFirstNexusTestState(
      {
        scenario: "external-service",
      },
      async (state) => {
        expect(process.env.NEXISCLAW_SERVICE_REPAIR_POLICY).toBe("external");
        expect(state.env.NEXISCLAW_SERVICE_REPAIR_POLICY).toBe("external");
      },
    );

    expect(process.env.NEXISCLAW_SERVICE_REPAIR_POLICY).toBe(previousPolicy);
  });
});
