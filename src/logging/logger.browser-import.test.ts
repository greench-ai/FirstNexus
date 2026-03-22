import { afterEach, describe, expect, it, vi } from "vitest";

type LoggerModule = typeof import("./logger.js");

const originalGetBuiltinModule = (
  process as NodeJS.Process & { getBuiltinModule?: (id: string) => unknown }
).getBuiltinModule;

async function importBrowserSafeLogger(params?: {
  resolvePreferredNexusClawTmpDir?: ReturnType<typeof vi.fn>;
}): Promise<{
  module: LoggerModule;
  resolvePreferredNexusClawTmpDir: ReturnType<typeof vi.fn>;
}> {
  vi.resetModules();
  const resolvePreferredNexusClawTmpDir =
    params?.resolvePreferredNexusClawTmpDir ??
    vi.fn(() => {
      throw new Error("resolvePreferredNexusClawTmpDir should not run during browser-safe import");
    });

  vi.doMock("../infra/tmp-nexusclaw-dir.js", async () => {
    const actual = await vi.importActual<typeof import("../infra/tmp-nexusclaw-dir.js")>(
      "../infra/tmp-nexusclaw-dir.js",
    );
    return {
      ...actual,
      resolvePreferredNexusClawTmpDir,
    };
  });

  Object.defineProperty(process, "getBuiltinModule", {
    configurable: true,
    value: undefined,
  });

  const module = await import("./logger.js");
  return { module, resolvePreferredNexusClawTmpDir };
}

describe("logging/logger browser-safe import", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("../infra/tmp-nexusclaw-dir.js");
    Object.defineProperty(process, "getBuiltinModule", {
      configurable: true,
      value: originalGetBuiltinModule,
    });
  });

  it("does not resolve the preferred temp dir at import time when node fs is unavailable", async () => {
    const { module, resolvePreferredNexusClawTmpDir } = await importBrowserSafeLogger();

    expect(resolvePreferredNexusClawTmpDir).not.toHaveBeenCalled();
    expect(module.DEFAULT_LOG_DIR).toBe("/tmp/nexusclaw");
    expect(module.DEFAULT_LOG_FILE).toBe("/tmp/nexusclaw/nexusclaw.log");
  });

  it("disables file logging when imported in a browser-like environment", async () => {
    const { module, resolvePreferredNexusClawTmpDir } = await importBrowserSafeLogger();

    expect(module.getResolvedLoggerSettings()).toMatchObject({
      level: "silent",
      file: "/tmp/nexusclaw/nexusclaw.log",
    });
    expect(module.isFileLogLevelEnabled("info")).toBe(false);
    expect(() => module.getLogger().info("browser-safe")).not.toThrow();
    expect(resolvePreferredNexusClawTmpDir).not.toHaveBeenCalled();
  });
});
