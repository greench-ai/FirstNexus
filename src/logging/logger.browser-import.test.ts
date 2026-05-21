import { importFreshModule } from "FirstNexus/plugin-sdk/test-fixtures";
import { afterEach, describe, expect, it, vi } from "vitest";

type LoggerModule = typeof import("./logger.js");

const originalGetBuiltinModule = (
  process as NodeJS.Process & { getBuiltinModule?: (id: string) => unknown }
).getBuiltinModule;

async function importBrowserSafeLogger(params?: {
  resolvePreferredFirstNexusTmpDir?: ReturnType<typeof vi.fn>;
}): Promise<{
  module: LoggerModule;
  resolvePreferredFirstNexusTmpDir: ReturnType<typeof vi.fn>;
}> {
  const resolvePreferredFirstNexusTmpDir =
    params?.resolvePreferredFirstNexusTmpDir ??
    vi.fn(() => {
      throw new Error("resolvePreferredFirstNexusTmpDir should not run during browser-safe import");
    });

  vi.doMock("../infra/tmp-FirstNexus-dir.js", async () => {
    const actual = await vi.importActual<typeof import("../infra/tmp-FirstNexus-dir.js")>(
      "../infra/tmp-FirstNexus-dir.js",
    );
    return {
      ...actual,
      resolvePreferredFirstNexusTmpDir,
    };
  });

  Object.defineProperty(process, "getBuiltinModule", {
    configurable: true,
    value: undefined,
  });

  const module = await importFreshModule<LoggerModule>(
    import.meta.url,
    "./logger.js?scope=browser-safe",
  );
  return { module, resolvePreferredFirstNexusTmpDir };
}

describe("logging/logger browser-safe import", () => {
  afterEach(() => {
    vi.doUnmock("../infra/tmp-FirstNexus-dir.js");
    Object.defineProperty(process, "getBuiltinModule", {
      configurable: true,
      value: originalGetBuiltinModule,
    });
  });

  it("does not resolve the preferred temp dir at import time when node fs is unavailable", async () => {
    const { module, resolvePreferredFirstNexusTmpDir } = await importBrowserSafeLogger();

    expect(resolvePreferredFirstNexusTmpDir).not.toHaveBeenCalled();
    expect(module.DEFAULT_LOG_DIR).toBe("/tmp/FirstNexus");
    expect(module.DEFAULT_LOG_FILE).toBe("/tmp/FirstNexus/FirstNexus.log");
  });

  it("disables file logging when imported in a browser-like environment", async () => {
    const { module, resolvePreferredFirstNexusTmpDir } = await importBrowserSafeLogger();

    expect(module.getResolvedLoggerSettings()).toStrictEqual({
      level: "silent",
      file: "/tmp/FirstNexus/FirstNexus.log",
      maxFileBytes: 100 * 1024 * 1024,
    });
    expect(module.isFileLogLevelEnabled("info")).toBe(false);
    expect(module.getLogger().info("browser-safe")).toBeUndefined();
    expect(resolvePreferredFirstNexusTmpDir).not.toHaveBeenCalled();
  });
});
