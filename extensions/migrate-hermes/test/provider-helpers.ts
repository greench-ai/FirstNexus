import fs from "node:fs/promises";
import path from "node:path";
import type { MigrationProviderContext } from "FirstNexus/plugin-sdk/plugin-entry";
import type { FirstNexusConfig } from "FirstNexus/plugin-sdk/provider-auth";
import { resolvePreferredFirstNexusTmpDir } from "FirstNexus/plugin-sdk/temp-path";

const tempRoots = new Set<string>();

const logger = {
  info() {},
  warn() {},
  error() {},
  debug() {},
};

export async function makeTempRoot() {
  const root = await fs.mkdtemp(
    path.join(resolvePreferredFirstNexusTmpDir(), "FirstNexus-migrate-hermes-"),
  );
  tempRoots.add(root);
  return root;
}

export async function cleanupTempRoots() {
  for (const root of tempRoots) {
    await fs.rm(root, { force: true, recursive: true });
  }
  tempRoots.clear();
}

export async function writeFile(filePath: string, content: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

export function makeConfigRuntime(
  config: FirstNexusConfig,
  onWrite?: (next: FirstNexusConfig) => void,
): NonNullable<MigrationProviderContext["runtime"]> {
  const commitConfig = (next: FirstNexusConfig) => {
    for (const key of Object.keys(config) as Array<keyof FirstNexusConfig>) {
      delete config[key];
    }
    Object.assign(config, next);
    onWrite?.(next);
  };

  return {
    config: {
      current: () => config,
      mutateConfigFile: async ({
        afterWrite,
        mutate,
      }: {
        afterWrite?: unknown;
        mutate: (draft: FirstNexusConfig, context: unknown) => Promise<unknown> | void;
      }) => {
        const next = structuredClone(config);
        const result = await mutate(next, {
          previousHash: null,
          snapshot: { config, raw: "", hash: null },
        });
        commitConfig(next);
        return {
          afterWrite,
          followUp: { mode: "auto", requiresRestart: false },
          nextConfig: next,
          result,
        };
      },
      replaceConfigFile: async ({
        afterWrite,
        nextConfig,
      }: {
        afterWrite?: unknown;
        nextConfig: FirstNexusConfig;
      }) => {
        commitConfig(nextConfig);
        return { afterWrite, followUp: { mode: "auto", requiresRestart: false }, nextConfig };
      },
    },
  } as NonNullable<MigrationProviderContext["runtime"]>;
}

export function makeContext(params: {
  source: string;
  stateDir: string;
  workspaceDir: string;
  config?: FirstNexusConfig;
  includeSecrets?: boolean;
  overwrite?: boolean;
  model?: NonNullable<NonNullable<FirstNexusConfig["agents"]>["defaults"]>["model"];
  reportDir?: string;
  runtime?: MigrationProviderContext["runtime"];
}): MigrationProviderContext {
  const config =
    params.config ??
    ({
      agents: {
        defaults: {
          workspace: params.workspaceDir,
          ...(params.model !== undefined ? { model: params.model } : {}),
        },
      },
    } as FirstNexusConfig);
  return {
    config,
    stateDir: params.stateDir,
    source: params.source,
    includeSecrets: params.includeSecrets,
    overwrite: params.overwrite,
    reportDir: params.reportDir,
    runtime: params.runtime,
    logger,
  };
}
