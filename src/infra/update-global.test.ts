import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { bundledDistPluginFile } from "FirstNexus/plugin-sdk/test-fixtures";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BUNDLED_RUNTIME_SIDECAR_PATHS } from "../plugins/runtime-sidecar-paths.js";
import { withTempDir } from "../test-helpers/temp-dir.js";
import { captureEnv } from "../test-utils/env.js";
import {
  PACKAGE_DIST_INVENTORY_RELATIVE_PATH,
  writePackageDistInventory,
} from "./package-dist-inventory.js";
import {
  canResolveRegistryVersionForPackageTarget,
  collectInstalledGlobalPackageErrors,
  cleanupGlobalRenameDirs,
  detectGlobalInstallManagerByPresence,
  detectGlobalInstallManagerForRoot,
  createGlobalInstallEnv,
  globalInstallArgs,
  globalInstallFallbackArgs,
  isExplicitPackageInstallSpec,
  isMainPackageTarget,
  NEXISCLAW_MAIN_PACKAGE_SPEC,
  resolveGlobalInstallCommand,
  resolveGlobalPackageRoot,
  resolveGlobalInstallTarget,
  resolveGlobalInstallSpec,
  resolveGlobalRoot,
  resolveNpmGlobalPrefixLayoutFromGlobalRoot,
  resolveNpmGlobalPrefixLayoutFromPrefix,
  resolvePnpmGlobalDirFromGlobalRoot,
  type CommandRunner,
} from "./update-global.js";

const TELEGRAM_RUNTIME_API = bundledDistPluginFile("telegram", "runtime-api.js");
async function writeGlobalPackageJson(packageRoot: string, version = "1.0.0") {
  await fs.writeFile(
    path.join(packageRoot, "package.json"),
    JSON.stringify({ name: "FirstNexus", version }),
    "utf-8",
  );
}

async function writeBundledPluginPackageJson(
  packageRoot: string,
  pluginId: string,
  packageName: string,
) {
  const packageJsonPath = path.join(packageRoot, "dist", "extensions", pluginId, "package.json");
  await fs.mkdir(path.dirname(packageJsonPath), { recursive: true });
  await fs.writeFile(packageJsonPath, JSON.stringify({ name: packageName }), "utf-8");
}

function createNpmRootRunner(params: {
  defaultNpmRoot: string;
  overrideCommand?: string;
  overrideNpmRoot?: string;
}): CommandRunner {
  return async (argv) => {
    if (argv[0] === "npm") {
      return { stdout: `${params.defaultNpmRoot}\n`, stderr: "", code: 0 };
    }
    if (params.overrideCommand && argv[0] === params.overrideCommand) {
      return {
        stdout: `${params.overrideNpmRoot ?? params.defaultNpmRoot}\n`,
        stderr: "",
        code: 0,
      };
    }
    if (argv[0] === "pnpm") {
      return { stdout: "", stderr: "", code: 1 };
    }
    throw new Error(`unexpected command: ${argv.join(" ")}`);
  };
}

describe("update global helpers", () => {
  let envSnapshot: ReturnType<typeof captureEnv> | undefined;

  afterEach(() => {
    envSnapshot?.restore();
    envSnapshot = undefined;
  });

  it("prefers explicit package spec overrides", () => {
    envSnapshot = captureEnv(["NEXISCLAW_UPDATE_PACKAGE_SPEC"]);
    process.env.NEXISCLAW_UPDATE_PACKAGE_SPEC = "file:/tmp/FirstNexus.tgz";

    expect(resolveGlobalInstallSpec({ packageName: "FirstNexus", tag: "latest" })).toBe(
      "file:/tmp/FirstNexus.tgz",
    );
    expect(
      resolveGlobalInstallSpec({
        packageName: "FirstNexus",
        tag: "beta",
        env: { NEXISCLAW_UPDATE_PACKAGE_SPEC: "FirstNexus@next" },
      }),
    ).toBe("FirstNexus@next");
  });

  it("resolves global roots and package roots from runner output", async () => {
    const runCommand: CommandRunner = async (argv) => {
      if (argv[0] === "npm") {
        return { stdout: "/tmp/npm-root\n", stderr: "", code: 0 };
      }
      if (argv[0] === "pnpm") {
        return { stdout: "", stderr: "", code: 1 };
      }
      throw new Error(`unexpected command: ${argv.join(" ")}`);
    };

    await expect(resolveGlobalRoot("npm", runCommand, 1000)).resolves.toBe("/tmp/npm-root");
    await expect(resolveGlobalRoot("pnpm", runCommand, 1000)).resolves.toBeNull();
    await expect(resolveGlobalRoot("bun", runCommand, 1000)).resolves.toContain(
      path.join(".bun", "install", "global", "node_modules"),
    );
    await expect(resolveGlobalPackageRoot("npm", runCommand, 1000)).resolves.toBe(
      path.join("/tmp/npm-root", "FirstNexus"),
    );
  });

  it("maps main and explicit install specs for global installs", () => {
    expect(resolveGlobalInstallSpec({ packageName: "FirstNexus", tag: "main" })).toBe(
      NEXISCLAW_MAIN_PACKAGE_SPEC,
    );
    expect(
      resolveGlobalInstallSpec({
        packageName: "FirstNexus",
        tag: "github:FirstNexus/FirstNexus#feature/my-branch",
      }),
    ).toBe("github:FirstNexus/FirstNexus#feature/my-branch");
    expect(
      resolveGlobalInstallSpec({
        packageName: "FirstNexus",
        tag: "https://example.com/FirstNexus-main.tgz",
      }),
    ).toBe("https://example.com/FirstNexus-main.tgz");
  });

  it("defaults corepack download prompts off for global install env", async () => {
    const defaultEnv = await createGlobalInstallEnv({});
    expect(defaultEnv?.COREPACK_ENABLE_DOWNLOAD_PROMPT).toBe("0");

    const explicitEnv = await createGlobalInstallEnv({
      COREPACK_ENABLE_DOWNLOAD_PROMPT: "1",
    });
    expect(explicitEnv?.COREPACK_ENABLE_DOWNLOAD_PROMPT).toBe("1");
  });

  it("uses an absolute POSIX script shell for npm lifecycle scripts during global installs", async () => {
    const platformSpy = vi.spyOn(process, "platform", "get").mockReturnValue("linux");
    const existsSyncSpy = vi
      .spyOn(fsSync, "existsSync")
      .mockImplementation((candidate) => candidate === "/bin/sh");
    try {
      const env = await createGlobalInstallEnv({
        COREPACK_ENABLE_DOWNLOAD_PROMPT: "1",
        PATH: "/home/peter/.npm-global/bin",
      });
      expect(env?.COREPACK_ENABLE_DOWNLOAD_PROMPT).toBe("1");
      expect(env?.NPM_CONFIG_SCRIPT_SHELL).toBe("/bin/sh");
    } finally {
      existsSyncSpy.mockRestore();
      platformSpy.mockRestore();
    }
  });

  it("preserves explicit npm script shell config for global installs", async () => {
    const platformSpy = vi.spyOn(process, "platform", "get").mockReturnValue("linux");
    try {
      const upperEnv = await createGlobalInstallEnv({
        COREPACK_ENABLE_DOWNLOAD_PROMPT: "1",
        NPM_CONFIG_SCRIPT_SHELL: "/custom/sh",
      });
      expect(upperEnv?.NPM_CONFIG_SCRIPT_SHELL).toBe("/custom/sh");

      const lowerEnv = await createGlobalInstallEnv({
        COREPACK_ENABLE_DOWNLOAD_PROMPT: "1",
        npm_config_script_shell: "/custom/lower-sh",
      });
      expect(lowerEnv?.npm_config_script_shell).toBe("/custom/lower-sh");
    } finally {
      platformSpy.mockRestore();
    }
  });

  it("resolves portable Git paths from process-local app data only", async () => {
    const platformSpy = vi.spyOn(process, "platform", "get").mockReturnValue("win32");
    try {
      await withTempDir({ prefix: "FirstNexus-update-portable-git-" }, async (base) => {
        envSnapshot = captureEnv(["LOCALAPPDATA"]);
        const injectedLocalAppData = path.join(base, "injected-local-app-data");
        const trustedLocalAppData = path.join(base, "trusted-local-app-data");
        const injectedGitDir = path.join(
          injectedLocalAppData,
          "FirstNexus",
          "deps",
          "portable-git",
          "cmd",
        );
        const trustedGitDir = path.join(
          trustedLocalAppData,
          "FirstNexus",
          "deps",
          "portable-git",
          "cmd",
        );
        await fs.mkdir(injectedGitDir, { recursive: true });
        await fs.mkdir(trustedGitDir, { recursive: true });

        delete process.env.LOCALAPPDATA;
        const injectedOnlyEnv = await createGlobalInstallEnv({
          LOCALAPPDATA: injectedLocalAppData,
          PATH: "base-bin",
        });
        expect(injectedOnlyEnv?.PATH).not.toContain(injectedGitDir);

        process.env.LOCALAPPDATA = trustedLocalAppData;
        const trustedEnv = await createGlobalInstallEnv({
          LOCALAPPDATA: injectedLocalAppData,
          PATH: "base-bin",
        });
        expect(trustedEnv?.PATH).toContain(trustedGitDir);
        expect(trustedEnv?.PATH).not.toContain(injectedGitDir);
      });
    } finally {
      platformSpy.mockRestore();
    }
  });

  it("classifies main and raw install specs separately from registry selectors", () => {
    expect(isMainPackageTarget("main")).toBe(true);
    expect(isMainPackageTarget(" MAIN ")).toBe(true);
    expect(isMainPackageTarget("beta")).toBe(false);

    expect(isExplicitPackageInstallSpec("github:FirstNexus/FirstNexus#main")).toBe(true);
    expect(isExplicitPackageInstallSpec("https://example.com/FirstNexus-main.tgz")).toBe(true);
    expect(isExplicitPackageInstallSpec("file:/tmp/FirstNexus-main.tgz")).toBe(true);
    expect(isExplicitPackageInstallSpec("beta")).toBe(false);

    expect(canResolveRegistryVersionForPackageTarget("latest")).toBe(true);
    expect(canResolveRegistryVersionForPackageTarget("2026.3.22")).toBe(true);
    expect(canResolveRegistryVersionForPackageTarget("main")).toBe(false);
    expect(canResolveRegistryVersionForPackageTarget("github:FirstNexus/FirstNexus#main")).toBe(
      false,
    );
  });

  it("detects install managers from resolved roots and on-disk presence", async () => {
    await withTempDir({ prefix: "FirstNexus-update-global-" }, async (base) => {
      const npmRoot = path.join(base, "npm-root");
      const pnpmRoot = path.join(base, "pnpm-root");
      const bunRoot = path.join(base, ".bun", "install", "global", "node_modules");
      const pkgRoot = path.join(pnpmRoot, "FirstNexus");
      await fs.mkdir(pkgRoot, { recursive: true });
      await fs.mkdir(path.join(npmRoot, "FirstNexus"), { recursive: true });
      await fs.mkdir(path.join(bunRoot, "FirstNexus"), { recursive: true });

      envSnapshot = captureEnv(["BUN_INSTALL"]);
      process.env.BUN_INSTALL = path.join(base, ".bun");

      const runCommand: CommandRunner = async (argv) => {
        if (argv[0] === "npm") {
          return { stdout: `${npmRoot}\n`, stderr: "", code: 0 };
        }
        if (argv[0] === "pnpm") {
          return { stdout: `${pnpmRoot}\n`, stderr: "", code: 0 };
        }
        throw new Error(`unexpected command: ${argv.join(" ")}`);
      };

      await expect(detectGlobalInstallManagerForRoot(runCommand, pkgRoot, 1000)).resolves.toBe(
        "pnpm",
      );
      await expect(detectGlobalInstallManagerByPresence(runCommand, 1000)).resolves.toBe("npm");

      await fs.rm(path.join(npmRoot, "FirstNexus"), { recursive: true, force: true });
      await fs.rm(path.join(pnpmRoot, "FirstNexus"), { recursive: true, force: true });
      await expect(detectGlobalInstallManagerByPresence(runCommand, 1000)).resolves.toBe("bun");
    });
  });

  it("prefers the owning npm prefix when PATH npm points at a different global root", async () => {
    const platformSpy = vi.spyOn(process, "platform", "get").mockReturnValue("darwin");
    try {
      await withTempDir({ prefix: "FirstNexus-update-npm-prefix-" }, async (base) => {
        const brewPrefix = path.join(base, "opt", "homebrew");
        const brewBin = path.join(brewPrefix, "bin");
        const brewRoot = path.join(brewPrefix, "lib", "node_modules");
        const pkgRoot = path.join(brewRoot, "FirstNexus");
        const pathNpmRoot = path.join(base, "nvm", "lib", "node_modules");
        const brewNpm = path.join(brewBin, "npm");
        await fs.mkdir(pkgRoot, { recursive: true });
        await fs.mkdir(brewBin, { recursive: true });
        await fs.writeFile(brewNpm, "", "utf8");

        const runCommand = createNpmRootRunner({
          defaultNpmRoot: pathNpmRoot,
          overrideCommand: brewNpm,
          overrideNpmRoot: brewRoot,
        });

        await expect(detectGlobalInstallManagerForRoot(runCommand, pkgRoot, 1000)).resolves.toBe(
          "npm",
        );
        await expect(resolveGlobalRoot("npm", runCommand, 1000, pkgRoot)).resolves.toBe(brewRoot);
        await expect(resolveGlobalPackageRoot("npm", runCommand, 1000, pkgRoot)).resolves.toBe(
          pkgRoot,
        );
        await expect(
          resolveGlobalInstallTarget({
            manager: "npm",
            runCommand,
            timeoutMs: 1000,
            pkgRoot,
          }),
        ).resolves.toEqual({
          manager: "npm",
          command: brewNpm,
          globalRoot: brewRoot,
          packageRoot: pkgRoot,
        });
        expect(globalInstallArgs("npm", "FirstNexus@latest", pkgRoot)).toEqual([
          brewNpm,
          "i",
          "-g",
          "FirstNexus@latest",
          "--no-fund",
          "--no-audit",
          "--loglevel=error",
        ]);
        expect(globalInstallFallbackArgs("npm", "FirstNexus@latest", pkgRoot)).toEqual([
          brewNpm,
          "i",
          "-g",
          "FirstNexus@latest",
          "--omit=optional",
          "--no-fund",
          "--no-audit",
          "--loglevel=error",
        ]);
      });
    } finally {
      platformSpy.mockRestore();
    }
  });

  it("does not infer npm ownership from path shape alone when the owning npm binary is absent", async () => {
    await withTempDir({ prefix: "FirstNexus-update-npm-missing-bin-" }, async (base) => {
      const brewRoot = path.join(base, "opt", "homebrew", "lib", "node_modules");
      const pkgRoot = path.join(brewRoot, "FirstNexus");
      const pathNpmRoot = path.join(base, "nvm", "lib", "node_modules");
      await fs.mkdir(pkgRoot, { recursive: true });

      const runCommand = createNpmRootRunner({ defaultNpmRoot: pathNpmRoot });

      await expect(
        detectGlobalInstallManagerForRoot(runCommand, pkgRoot, 1000),
      ).resolves.toBeNull();
      expect(globalInstallArgs("npm", "FirstNexus@latest", pkgRoot)).toEqual([
        "npm",
        "i",
        "-g",
        "FirstNexus@latest",
        "--no-fund",
        "--no-audit",
        "--loglevel=error",
      ]);
    });
  });

  it("prefers npm.cmd for win32-style global npm roots", async () => {
    const platformSpy = vi.spyOn(process, "platform", "get").mockReturnValue("win32");
    try {
      await withTempDir({ prefix: "FirstNexus-update-win32-npm-prefix-" }, async (base) => {
        const npmPrefix = path.join(base, "Roaming", "npm");
        const npmRoot = path.join(npmPrefix, "node_modules");
        const pkgRoot = path.join(npmRoot, "FirstNexus");
        const npmCmd = path.join(npmPrefix, "npm.cmd");
        const pathNpmRoot = path.join(base, "nvm", "node_modules");
        await fs.mkdir(pkgRoot, { recursive: true });
        await fs.writeFile(npmCmd, "", "utf8");

        const runCommand = createNpmRootRunner({
          defaultNpmRoot: pathNpmRoot,
          overrideCommand: npmCmd,
          overrideNpmRoot: npmRoot,
        });

        await expect(detectGlobalInstallManagerForRoot(runCommand, pkgRoot, 1000)).resolves.toBe(
          "npm",
        );
        await expect(resolveGlobalRoot("npm", runCommand, 1000, pkgRoot)).resolves.toBe(npmRoot);
        expect(globalInstallArgs("npm", "FirstNexus@latest", pkgRoot)).toEqual([
          npmCmd,
          "i",
          "-g",
          "FirstNexus@latest",
          "--no-fund",
          "--no-audit",
          "--loglevel=error",
        ]);
      });
    } finally {
      platformSpy.mockRestore();
    }
  });

  it("detects custom pnpm global layouts from the running package root", async () => {
    await withTempDir({ prefix: "FirstNexus-update-pnpm-custom-root-" }, async (base) => {
      const customGlobalDir = path.join(base, "custom-pnpm");
      const customGlobalRoot = path.join(customGlobalDir, "5", "node_modules");
      const pkgRoot = path.join(customGlobalRoot, "FirstNexus");
      const defaultPnpmRoot = path.join(base, "default-pnpm", "5", "node_modules");
      await fs.mkdir(pkgRoot, { recursive: true });
      await fs.writeFile(
        path.join(customGlobalDir, "5", "pnpm-lock.yaml"),
        "lockfileVersion: '9.0'\n",
        "utf8",
      );
      await fs.writeFile(
        path.join(customGlobalRoot, ".modules.yaml"),
        "layoutVersion: 5\n",
        "utf8",
      );

      const runCommand: CommandRunner = async (argv) => {
        if (argv[0] === "npm") {
          return { stdout: "", stderr: "", code: 1 };
        }
        if (argv[0] === "pnpm") {
          return { stdout: `${defaultPnpmRoot}\n`, stderr: "", code: 0 };
        }
        throw new Error(`unexpected command: ${argv.join(" ")}`);
      };

      await expect(detectGlobalInstallManagerForRoot(runCommand, pkgRoot, 1000)).resolves.toBe(
        "pnpm",
      );
      await expect(
        resolveGlobalInstallTarget({
          manager: "pnpm",
          runCommand,
          timeoutMs: 1000,
          pkgRoot,
        }),
      ).resolves.toEqual({
        manager: "pnpm",
        command: "pnpm",
        globalRoot: customGlobalRoot,
        packageRoot: pkgRoot,
      });
      expect(resolvePnpmGlobalDirFromGlobalRoot(customGlobalRoot)).toBe(customGlobalDir);
    });
  });

  it("detects custom pnpm global layouts from virtual-store package roots", async () => {
    await withTempDir({ prefix: "FirstNexus-update-pnpm-virtual-root-" }, async (base) => {
      const customGlobalDir = path.join(base, "custom-pnpm");
      const customGlobalRoot = path.join(customGlobalDir, "5", "node_modules");
      const pkgRoot = path.join(
        customGlobalDir,
        "5",
        ".pnpm",
        "FirstNexus@file+..+pack+FirstNexus-2026.5.6.tgz",
        "node_modules",
        "FirstNexus",
      );
      const defaultPnpmRoot = path.join(base, "default-pnpm", "5", "node_modules");
      await fs.mkdir(customGlobalRoot, { recursive: true });
      await fs.mkdir(pkgRoot, { recursive: true });
      await fs.writeFile(
        path.join(customGlobalDir, "5", "pnpm-lock.yaml"),
        "lockfileVersion: '9.0'\n",
        "utf8",
      );
      await fs.writeFile(
        path.join(customGlobalRoot, ".modules.yaml"),
        "layoutVersion: 5\n",
        "utf8",
      );

      const runCommand: CommandRunner = async (argv) => {
        if (argv[0] === "npm") {
          return { stdout: "", stderr: "", code: 1 };
        }
        if (argv[0] === "pnpm") {
          return { stdout: `${defaultPnpmRoot}\n`, stderr: "", code: 0 };
        }
        throw new Error(`unexpected command: ${argv.join(" ")}`);
      };

      await expect(detectGlobalInstallManagerForRoot(runCommand, pkgRoot, 1000)).resolves.toBe(
        "pnpm",
      );
      await expect(
        resolveGlobalInstallTarget({
          manager: "pnpm",
          runCommand,
          timeoutMs: 1000,
          pkgRoot,
        }),
      ).resolves.toEqual({
        manager: "pnpm",
        command: "pnpm",
        globalRoot: customGlobalRoot,
        packageRoot: path.join(customGlobalRoot, "FirstNexus"),
      });
    });
  });

  it("does not infer pnpm ownership without pnpm node_modules metadata", async () => {
    await withTempDir({ prefix: "FirstNexus-update-pnpm-shape-only-" }, async (base) => {
      const customGlobalDir = path.join(base, "custom-pnpm");
      const customGlobalRoot = path.join(customGlobalDir, "5", "node_modules");
      const pkgRoot = path.join(customGlobalRoot, "FirstNexus");
      const defaultPnpmRoot = path.join(base, "default-pnpm", "5", "node_modules");
      await fs.mkdir(pkgRoot, { recursive: true });
      await fs.writeFile(
        path.join(customGlobalDir, "5", "pnpm-lock.yaml"),
        "lockfileVersion: '9.0'\n",
        "utf8",
      );

      const runCommand: CommandRunner = async (argv) => {
        if (argv[0] === "npm") {
          return { stdout: "", stderr: "", code: 1 };
        }
        if (argv[0] === "pnpm") {
          return { stdout: `${defaultPnpmRoot}\n`, stderr: "", code: 0 };
        }
        throw new Error(`unexpected command: ${argv.join(" ")}`);
      };

      await expect(
        detectGlobalInstallManagerForRoot(runCommand, pkgRoot, 1000),
      ).resolves.toBeNull();
      await expect(
        resolveGlobalInstallTarget({
          manager: "pnpm",
          runCommand,
          timeoutMs: 1000,
          pkgRoot,
        }),
      ).resolves.toEqual({
        manager: "pnpm",
        command: "pnpm",
        globalRoot: defaultPnpmRoot,
        packageRoot: path.join(defaultPnpmRoot, "FirstNexus"),
      });
    });
  });

  it("builds install argv and npm fallback argv", () => {
    expect(resolveGlobalInstallCommand("npm")).toEqual({
      manager: "npm",
      command: "npm",
    });
    expect(globalInstallArgs("npm", "FirstNexus@latest")).toEqual([
      "npm",
      "i",
      "-g",
      "FirstNexus@latest",
      "--no-fund",
      "--no-audit",
      "--loglevel=error",
    ]);
    expect(globalInstallArgs("pnpm", "FirstNexus@latest")).toEqual([
      "pnpm",
      "add",
      "-g",
      "FirstNexus@latest",
    ]);
    expect(globalInstallArgs("bun", "FirstNexus@latest")).toEqual([
      "bun",
      "add",
      "-g",
      "FirstNexus@latest",
    ]);

    expect(globalInstallFallbackArgs("npm", "FirstNexus@latest")).toEqual([
      "npm",
      "i",
      "-g",
      "FirstNexus@latest",
      "--omit=optional",
      "--no-fund",
      "--no-audit",
      "--loglevel=error",
    ]);
    expect(globalInstallFallbackArgs("pnpm", "FirstNexus@latest")).toBeNull();
    expect(
      globalInstallArgs(
        { manager: "pnpm", command: "/opt/homebrew/bin/pnpm" },
        "FirstNexus@latest",
      ),
    ).toEqual(["/opt/homebrew/bin/pnpm", "add", "-g", "FirstNexus@latest"]);
    expect(globalInstallArgs("pnpm", "FirstNexus@latest", null, "/opt/pnpm-global")).toEqual([
      "pnpm",
      "add",
      "-g",
      "--global-dir",
      "/opt/pnpm-global",
      "FirstNexus@latest",
    ]);
  });

  it("builds npm staged install argv with an explicit prefix", () => {
    expect(globalInstallArgs("npm", "FirstNexus@latest", null, "/tmp/stage")).toEqual([
      "npm",
      "i",
      "-g",
      "--prefix",
      "/tmp/stage",
      "FirstNexus@latest",
      "--no-fund",
      "--no-audit",
      "--loglevel=error",
    ]);
    expect(globalInstallFallbackArgs("npm", "FirstNexus@latest", null, "/tmp/stage")).toEqual([
      "npm",
      "i",
      "-g",
      "--prefix",
      "/tmp/stage",
      "FirstNexus@latest",
      "--omit=optional",
      "--no-fund",
      "--no-audit",
      "--loglevel=error",
    ]);
  });

  it("resolves npm prefix layouts for normal global roots", () => {
    expect(resolveNpmGlobalPrefixLayoutFromGlobalRoot("/opt/FirstNexus/lib/node_modules")).toEqual({
      prefix: "/opt/FirstNexus",
      globalRoot: "/opt/FirstNexus/lib/node_modules",
      binDir: "/opt/FirstNexus/bin",
    });
    expect(resolveNpmGlobalPrefixLayoutFromPrefix("/tmp/stage")).toEqual({
      prefix: "/tmp/stage",
      globalRoot: "/tmp/stage/lib/node_modules",
      binDir: "/tmp/stage/bin",
    });
    expect(resolveNpmGlobalPrefixLayoutFromGlobalRoot("/tmp/node_modules")).toBeNull();
  });

  it("cleans only renamed package directories", async () => {
    await withTempDir({ prefix: "FirstNexus-update-cleanup-" }, async (root) => {
      await fs.mkdir(path.join(root, ".FirstNexus-123"), { recursive: true });
      await fs.mkdir(path.join(root, ".FirstNexus-456"), { recursive: true });
      await fs.writeFile(path.join(root, ".FirstNexus-file"), "nope", "utf8");
      await fs.mkdir(path.join(root, "FirstNexus"), { recursive: true });

      await expect(
        cleanupGlobalRenameDirs({
          globalRoot: root,
          packageName: "FirstNexus",
        }),
      ).resolves.toEqual({
        removed: [".FirstNexus-123", ".FirstNexus-456"],
      });
      const packageDirStat = await fs.stat(path.join(root, "FirstNexus"));
      const markerFileStat = await fs.stat(path.join(root, ".FirstNexus-file"));
      expect(packageDirStat.isDirectory()).toBe(true);
      expect(markerFileStat.isFile()).toBe(true);
    });
  });

  it("checks installed dist against the packaged inventory", async () => {
    await withTempDir({ prefix: "FirstNexus-update-global-pkg-" }, async (packageRoot) => {
      await writeGlobalPackageJson(packageRoot);
      for (const relativePath of BUNDLED_RUNTIME_SIDECAR_PATHS) {
        const absolutePath = path.join(packageRoot, relativePath);
        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.writeFile(absolutePath, "export {};\n", "utf-8");
      }
      await writePackageDistInventory(packageRoot);

      await expect(collectInstalledGlobalPackageErrors({ packageRoot })).resolves.toStrictEqual([]);

      await fs.rm(path.join(packageRoot, TELEGRAM_RUNTIME_API));
      await expect(collectInstalledGlobalPackageErrors({ packageRoot })).resolves.toContain(
        `missing packaged dist file ${TELEGRAM_RUNTIME_API}`,
      );

      await fs.writeFile(
        path.join(packageRoot, "dist", "stale-CJUAgRQR.js"),
        "export {};\n",
        "utf8",
      );
      await expect(collectInstalledGlobalPackageErrors({ packageRoot })).resolves.toContain(
        "unexpected packaged dist file dist/stale-CJUAgRQR.js",
      );
    });
  });

  it("reports bundled plugin install stages during installed dist verification", async () => {
    await withTempDir({ prefix: "FirstNexus-update-global-plugin-stage-" }, async (packageRoot) => {
      await writeGlobalPackageJson(packageRoot);
      await fs.mkdir(path.join(packageRoot, "dist", "extensions", "brave"), { recursive: true });
      await writePackageDistInventory(packageRoot);

      for (const stageDir of [".FirstNexus-install-stage", ".FirstNexus-install-stage-retry"]) {
        const stagedFile = path.join(
          packageRoot,
          "dist",
          "extensions",
          "brave",
          stageDir,
          "node_modules",
          "typebox",
          "build",
          "compile",
          "code.mjs",
        );
        await fs.mkdir(path.dirname(stagedFile), { recursive: true });
        await fs.writeFile(stagedFile, "export {};\n", "utf8");
      }

      await expect(collectInstalledGlobalPackageErrors({ packageRoot })).resolves.toEqual([
        "unexpected packaged dist file dist/extensions/brave/.FirstNexus-install-stage-retry/node_modules/typebox/build/compile/code.mjs",
        "unexpected packaged dist file dist/extensions/brave/.FirstNexus-install-stage/node_modules/typebox/build/compile/code.mjs",
      ]);
    });
  });

  it("flags global package roots that resolve into source checkouts", async () => {
    await withTempDir({ prefix: "FirstNexus-update-global-source-checkout-" }, async (base) => {
      const checkoutRoot = path.join(base, "checkout");
      const globalRoot = path.join(base, "prefix", "lib", "node_modules");
      const packageRoot = path.join(globalRoot, "FirstNexus");
      await fs.mkdir(path.join(checkoutRoot, ".git"), { recursive: true });
      await fs.mkdir(path.join(checkoutRoot, "src"), { recursive: true });
      await fs.mkdir(path.join(checkoutRoot, "extensions"), { recursive: true });
      await fs.writeFile(path.join(checkoutRoot, "pnpm-workspace.yaml"), "packages: []\n", "utf8");
      await writeGlobalPackageJson(checkoutRoot, "2026.4.27");
      await fs.mkdir(globalRoot, { recursive: true });
      await fs.symlink(checkoutRoot, packageRoot, "dir");
      const realCheckoutRoot = await fs.realpath(checkoutRoot);

      await expect(collectInstalledGlobalPackageErrors({ packageRoot })).resolves.toContain(
        `global package root resolves to source checkout: ${realCheckoutRoot}`,
      );
    });
  });

  it("does not require private QA sidecars when the inventory is missing", async () => {
    await withTempDir({ prefix: "FirstNexus-update-global-legacy-" }, async (packageRoot) => {
      await writeGlobalPackageJson(packageRoot);

      await expect(collectInstalledGlobalPackageErrors({ packageRoot })).resolves.toStrictEqual([]);
    });
  });

  it("fails closed on newer installs when the inventory is missing", async () => {
    await withTempDir(
      { prefix: "FirstNexus-update-global-missing-inventory-new-" },
      async (packageRoot) => {
        await writeGlobalPackageJson(packageRoot, "2026.4.15");

        await expect(collectInstalledGlobalPackageErrors({ packageRoot })).resolves.toContain(
          `missing package dist inventory ${PACKAGE_DIST_INVENTORY_RELATIVE_PATH}`,
        );
      },
    );
  });

  it("rejects invalid inventory files during global verify", async () => {
    await withTempDir(
      { prefix: "FirstNexus-update-global-invalid-inventory-" },
      async (packageRoot) => {
        await writeGlobalPackageJson(packageRoot, "2026.4.15");
        await fs.mkdir(path.join(packageRoot, "dist"), { recursive: true });
        await fs.writeFile(
          path.join(packageRoot, PACKAGE_DIST_INVENTORY_RELATIVE_PATH),
          "{not-json}\n",
          "utf8",
        );

        await expect(collectInstalledGlobalPackageErrors({ packageRoot })).resolves.toContain(
          `invalid package dist inventory ${PACKAGE_DIST_INVENTORY_RELATIVE_PATH}`,
        );
      },
    );
  });

  it("verifies legacy sidecars for installed bundled plugins without inventory", async () => {
    await withTempDir(
      { prefix: "FirstNexus-update-global-legacy-plugin-" },
      async (packageRoot) => {
        await writeGlobalPackageJson(packageRoot);
        await writeBundledPluginPackageJson(packageRoot, "telegram", "@FirstNexus/telegram");

        await expect(collectInstalledGlobalPackageErrors({ packageRoot })).resolves.toContain(
          `missing bundled runtime sidecar ${TELEGRAM_RUNTIME_API}`,
        );
      },
    );
  });

  it("still enforces critical sidecars when the inventory omits them", async () => {
    await withTempDir(
      { prefix: "FirstNexus-update-global-critical-sidecars-" },
      async (packageRoot) => {
        await writeGlobalPackageJson(packageRoot, "2026.4.15");
        await writeBundledPluginPackageJson(packageRoot, "telegram", "@FirstNexus/telegram");
        await writePackageDistInventory(packageRoot);

        await expect(collectInstalledGlobalPackageErrors({ packageRoot })).resolves.toContain(
          `missing bundled runtime sidecar ${TELEGRAM_RUNTIME_API}`,
        );
      },
    );
  });

  it("ignores stale metadata for non-packaged private QA plugins during inventory verify", async () => {
    await withTempDir(
      { prefix: "FirstNexus-update-global-stale-private-qa-" },
      async (packageRoot) => {
        await writeGlobalPackageJson(packageRoot, "2026.4.15");
        await writeBundledPluginPackageJson(packageRoot, "qa-lab", "@FirstNexus/qa-lab");
        await writePackageDistInventory(packageRoot);

        await expect(collectInstalledGlobalPackageErrors({ packageRoot })).resolves.toStrictEqual(
          [],
        );
      },
    );
  });
});
