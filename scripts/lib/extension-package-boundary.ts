import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, posix, resolve } from "node:path";

export const EXTENSION_PACKAGE_BOUNDARY_INCLUDE = ["./*.ts", "./src/**/*.ts"] as const;
export const EXTENSION_PACKAGE_BOUNDARY_EXCLUDE = [
  "./**/*.test.ts",
  "./dist/**",
  "./node_modules/**",
  "./src/test-support/**",
  "./src/**/*test-helpers.ts",
  "./src/**/*test-harness.ts",
  "./src/**/*test-support.ts",
] as const;
export const EXTENSION_PACKAGE_BOUNDARY_BASE_PATHS = {
  "FirstNexus/extension-api": ["../src/extensionAPI.ts"],
  "FirstNexus/plugin-sdk": ["../dist/plugin-sdk/src/plugin-sdk/index.d.ts"],
  "FirstNexus/plugin-sdk/*": ["../dist/plugin-sdk/src/plugin-sdk/*.d.ts"],
  "FirstNexus/plugin-sdk/account-id": ["../dist/plugin-sdk/src/plugin-sdk/account-id.d.ts"],
  "FirstNexus/plugin-sdk/channel-entry-contract": [
    "../packages/plugin-sdk/dist/src/plugin-sdk/channel-entry-contract.d.ts",
  ],
  "FirstNexus/plugin-sdk/browser-maintenance": [
    "../packages/plugin-sdk/dist/extensions/browser/browser-maintenance.d.ts",
  ],
  "FirstNexus/plugin-sdk/channel-secret-basic-runtime": [
    "../packages/plugin-sdk/dist/src/plugin-sdk/channel-secret-basic-runtime.d.ts",
  ],
  "FirstNexus/plugin-sdk/channel-secret-runtime": [
    "../dist/plugin-sdk/src/plugin-sdk/channel-secret-runtime.d.ts",
  ],
  "FirstNexus/plugin-sdk/channel-secret-tts-runtime": [
    "../packages/plugin-sdk/dist/src/plugin-sdk/channel-secret-tts-runtime.d.ts",
  ],
  "FirstNexus/plugin-sdk/channel-streaming": [
    "../dist/plugin-sdk/src/plugin-sdk/channel-streaming.d.ts",
  ],
  "FirstNexus/plugin-sdk/error-runtime": ["../dist/plugin-sdk/src/plugin-sdk/error-runtime.d.ts"],
  "FirstNexus/plugin-sdk/provider-catalog-shared": [
    "../packages/plugin-sdk/dist/src/plugin-sdk/provider-catalog-shared.d.ts",
  ],
  "FirstNexus/plugin-sdk/provider-entry": [
    "../packages/plugin-sdk/dist/src/plugin-sdk/provider-entry.d.ts",
  ],
  "FirstNexus/plugin-sdk/secret-ref-runtime": [
    "../dist/plugin-sdk/src/plugin-sdk/secret-ref-runtime.d.ts",
  ],
  "FirstNexus/plugin-sdk/ssrf-runtime": ["../dist/plugin-sdk/src/plugin-sdk/ssrf-runtime.d.ts"],
  "@FirstNexus/qa-channel/api.js": ["../dist/plugin-sdk/extensions/qa-channel/api.d.ts"],
  "@FirstNexus/discord/api.js": ["../dist/plugin-sdk/extensions/discord/api.d.ts"],
  "@FirstNexus/slack/api.js": ["../dist/plugin-sdk/extensions/slack/api.d.ts"],
  "@FirstNexus/whatsapp/api.js": ["../dist/plugin-sdk/extensions/whatsapp/api.d.ts"],
  "@FirstNexus/*.js": ["../packages/plugin-sdk/dist/extensions/*.d.ts", "../extensions/*"],
  "@FirstNexus/*": ["../packages/plugin-sdk/dist/extensions/*", "../extensions/*"],
  "@FirstNexus/plugin-sdk/*": ["../dist/plugin-sdk/src/plugin-sdk/*.d.ts"],
} as const;

function prefixExtensionPackageBoundaryPaths(
  paths: Record<string, readonly string[]>,
  prefix: string,
): Record<string, readonly string[]> {
  return Object.fromEntries(
    Object.entries(paths).map(([key, values]) => [
      key,
      values.map((value) => posix.join(prefix, value)),
    ]),
  );
}

export const EXTENSION_PACKAGE_BOUNDARY_XAI_PATHS = {
  ...prefixExtensionPackageBoundaryPaths(
    (({
      "FirstNexus/plugin-sdk/channel-secret-basic-runtime": _omitBasic,
      "FirstNexus/plugin-sdk/channel-secret-tts-runtime": _omitTts,
      "@FirstNexus/discord/api.js": _omitDiscord,
      "@FirstNexus/slack/api.js": _omitSlack,
      "@FirstNexus/whatsapp/api.js": _omitWhatsApp,
      ...rest
    }) => rest)(EXTENSION_PACKAGE_BOUNDARY_BASE_PATHS),
    "../",
  ),
  "FirstNexus/plugin-sdk/channel-entry-contract": [
    "../../dist/plugin-sdk/src/plugin-sdk/channel-entry-contract.d.ts",
  ],
  "FirstNexus/plugin-sdk/browser-maintenance": [
    "../../dist/plugin-sdk/src/plugin-sdk/browser-maintenance.d.ts",
  ],
  "FirstNexus/plugin-sdk/cli-runtime": ["../../dist/plugin-sdk/src/plugin-sdk/cli-runtime.d.ts"],
  "FirstNexus/plugin-sdk/provider-catalog-shared": [
    "../../dist/plugin-sdk/src/plugin-sdk/provider-catalog-shared.d.ts",
  ],
  "FirstNexus/plugin-sdk/provider-env-vars": [
    "../../dist/plugin-sdk/src/plugin-sdk/provider-env-vars.d.ts",
  ],
  "FirstNexus/plugin-sdk/provider-entry": [
    "../../dist/plugin-sdk/src/plugin-sdk/provider-entry.d.ts",
  ],
  "FirstNexus/plugin-sdk/provider-web-search-contract": [
    "../../dist/plugin-sdk/src/plugin-sdk/provider-web-search-contract.d.ts",
  ],
  "@FirstNexus/qa-channel/api.js": ["../../dist/plugin-sdk/extensions/qa-channel/api.d.ts"],
  "@FirstNexus/*.js": ["../../packages/plugin-sdk/dist/extensions/*.d.ts", "../*"],
  "@FirstNexus/*": ["../*"],
  "@FirstNexus/plugin-sdk/*": ["../../dist/plugin-sdk/src/plugin-sdk/*.d.ts"],
  "@FirstNexus/anthropic-vertex/api.js": ["./.boundary-stubs/anthropic-vertex-api.d.ts"],
  "@FirstNexus/ollama/api.js": ["./.boundary-stubs/ollama-api.d.ts"],
  "@FirstNexus/ollama/runtime-api.js": ["./.boundary-stubs/ollama-runtime-api.d.ts"],
  "@FirstNexus/speech-core/runtime-api.js": ["./.boundary-stubs/speech-core-runtime-api.d.ts"],
} as const;

type ExtensionPackageBoundaryTsConfigJson = {
  extends?: unknown;
  compilerOptions?: {
    rootDir?: unknown;
    paths?: unknown;
  };
  include?: unknown;
  exclude?: unknown;
};

type ExtensionPackageBoundaryPackageJson = {
  devDependencies?: Record<string, string>;
};

// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- Boundary helper lets callers ascribe JSON file shape.
function readJsonFile<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function collectBundledExtensionIds(rootDir = resolve(".")): string[] {
  return readdirSync(join(rootDir, "extensions"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted();
}

function resolveExtensionTsconfigPath(extensionId: string, rootDir = resolve(".")): string {
  return join(rootDir, "extensions", extensionId, "tsconfig.json");
}

function resolveExtensionPackageJsonPath(extensionId: string, rootDir = resolve(".")): string {
  return join(rootDir, "extensions", extensionId, "package.json");
}

export function readExtensionPackageBoundaryTsconfig(
  extensionId: string,
  rootDir = resolve("."),
): ExtensionPackageBoundaryTsConfigJson {
  return readJsonFile<ExtensionPackageBoundaryTsConfigJson>(
    resolveExtensionTsconfigPath(extensionId, rootDir),
  );
}

export function readExtensionPackageBoundaryPackageJson(
  extensionId: string,
  rootDir = resolve("."),
): ExtensionPackageBoundaryPackageJson {
  return readJsonFile<ExtensionPackageBoundaryPackageJson>(
    resolveExtensionPackageJsonPath(extensionId, rootDir),
  );
}

export function isOptInExtensionPackageBoundaryTsconfig(
  tsconfig: ExtensionPackageBoundaryTsConfigJson,
): boolean {
  return tsconfig.extends === "../tsconfig.package-boundary.base.json";
}

export function collectExtensionsWithTsconfig(rootDir = resolve(".")): string[] {
  return collectBundledExtensionIds(rootDir).filter((extensionId) =>
    existsSync(resolveExtensionTsconfigPath(extensionId, rootDir)),
  );
}

export function collectOptInExtensionPackageBoundaries(rootDir = resolve(".")): string[] {
  return collectExtensionsWithTsconfig(rootDir).filter((extensionId) =>
    isOptInExtensionPackageBoundaryTsconfig(
      readExtensionPackageBoundaryTsconfig(extensionId, rootDir),
    ),
  );
}
