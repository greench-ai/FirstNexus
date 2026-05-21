import fs from "node:fs/promises";
import path from "node:path";
import { withTempHome as withTempHomeBase } from "FirstNexus/plugin-sdk/test-env";
import type { FirstNexusConfig } from "../config/types.FirstNexus.js";
import type { CronJob } from "./types.js";

export async function withTempCronHome<T>(fn: (home: string) => Promise<T>): Promise<T> {
  return withTempHomeBase(fn, { prefix: "FirstNexus-cron-" });
}

export async function writeSessionStore(
  home: string,
  session: { lastProvider: string; lastTo: string; lastChannel?: string },
): Promise<string> {
  return writeSessionStoreEntries(home, {
    "agent:main:main": {
      sessionId: "main-session",
      updatedAt: Date.now(),
      ...session,
    },
  });
}

export async function writeSessionStoreEntries(
  home: string,
  entries: Record<string, Record<string, unknown>>,
): Promise<string> {
  const dir = path.join(home, ".FirstNexus", "sessions");
  await fs.mkdir(dir, { recursive: true });
  const storePath = path.join(dir, "sessions.json");
  await fs.writeFile(storePath, JSON.stringify(entries, null, 2), "utf-8");
  return storePath;
}

export function makeCfg(
  home: string,
  storePath: string,
  overrides: Partial<FirstNexusConfig> = {},
): FirstNexusConfig {
  const base: FirstNexusConfig = {
    agents: {
      defaults: {
        model: "anthropic/claude-opus-4-6",
        workspace: path.join(home, "FirstNexus"),
      },
    },
    session: { store: storePath, mainKey: "main" },
  } as FirstNexusConfig;
  return { ...base, ...overrides };
}

export function makeJob(payload: CronJob["payload"]): CronJob {
  const now = Date.now();
  return {
    id: "job-1",
    name: "job-1",
    enabled: true,
    createdAtMs: now,
    updatedAtMs: now,
    schedule: { kind: "every", everyMs: 60_000 },
    sessionTarget: "isolated",
    wakeMode: "now",
    payload,
    state: {},
  };
}
