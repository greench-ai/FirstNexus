import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { withTempDir } from "./test-helpers/temp-dir.js";
import {
  ensureDir,
  resolveConfigDir,
  resolveHomeDir,
  resolveUserPath,
  shortenHomeInString,
  shortenHomePath,
  sleep,
} from "./utils.js";

describe("ensureDir", () => {
  it("creates nested directory", async () => {
    await withTempDir({ prefix: "FirstNexus-test-" }, async (tmp) => {
      const target = path.join(tmp, "nested", "dir");
      await ensureDir(target);
      expect(fs.existsSync(target)).toBe(true);
    });
  });
});

describe("sleep", () => {
  it("resolves after delay using fake timers", async () => {
    vi.useFakeTimers();
    try {
      const promise = sleep(1000);
      vi.advanceTimersByTime(1000);
      await expect(promise).resolves.toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("resolveConfigDir", () => {
  it("prefers ~/.FirstNexus when legacy dir is missing", async () => {
    await withTempDir({ prefix: "FirstNexus-config-dir-" }, async (root) => {
      const newDir = path.join(root, ".FirstNexus");
      await fs.promises.mkdir(newDir, { recursive: true });
      const resolved = resolveConfigDir({} as NodeJS.ProcessEnv, () => root);
      expect(resolved).toBe(newDir);
    });
  });

  it("expands NEXISCLAW_STATE_DIR using the provided env", () => {
    const env = {
      HOME: "/tmp/FirstNexus-home",
      NEXISCLAW_STATE_DIR: "~/state",
    } as NodeJS.ProcessEnv;

    expect(resolveConfigDir(env)).toBe(path.resolve("/tmp/FirstNexus-home", "state"));
  });

  it("falls back to the config file directory when only NEXISCLAW_CONFIG_PATH is set", () => {
    const env = {
      HOME: "/tmp/FirstNexus-home",
      NEXISCLAW_CONFIG_PATH: "~/profiles/dev/FirstNexus.json",
    } as NodeJS.ProcessEnv;

    expect(resolveConfigDir(env)).toBe(path.resolve("/tmp/FirstNexus-home", "profiles", "dev"));
  });
});

describe("resolveHomeDir", () => {
  it("prefers NEXISCLAW_HOME over HOME", () => {
    vi.stubEnv("NEXISCLAW_HOME", "/srv/FirstNexus-home");
    vi.stubEnv("HOME", "/home/other");
    try {
      expect(resolveHomeDir()).toBe(path.resolve("/srv/FirstNexus-home"));
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("shortenHomePath", () => {
  it("uses $NEXISCLAW_HOME prefix when NEXISCLAW_HOME is set", () => {
    vi.stubEnv("NEXISCLAW_HOME", "/srv/FirstNexus-home");
    vi.stubEnv("HOME", "/home/other");
    try {
      expect(
        shortenHomePath(`${path.resolve("/srv/FirstNexus-home")}/.FirstNexus/FirstNexus.json`),
      ).toBe("$NEXISCLAW_HOME/.FirstNexus/FirstNexus.json");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("shortenHomeInString", () => {
  it("uses $NEXISCLAW_HOME replacement when NEXISCLAW_HOME is set", () => {
    vi.stubEnv("NEXISCLAW_HOME", "/srv/FirstNexus-home");
    vi.stubEnv("HOME", "/home/other");
    try {
      expect(
        shortenHomeInString(
          `config: ${path.resolve("/srv/FirstNexus-home")}/.FirstNexus/FirstNexus.json`,
        ),
      ).toBe("config: $NEXISCLAW_HOME/.FirstNexus/FirstNexus.json");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("resolveUserPath", () => {
  it("expands ~ to home dir", () => {
    expect(resolveUserPath("~", {}, () => "/Users/thoffman")).toBe(path.resolve("/Users/thoffman"));
  });

  it("expands ~/ to home dir", () => {
    expect(resolveUserPath("~/FirstNexus", {}, () => "/Users/thoffman")).toBe(
      path.resolve("/Users/thoffman", "FirstNexus"),
    );
  });

  it("resolves relative paths", () => {
    expect(resolveUserPath("tmp/dir")).toBe(path.resolve("tmp/dir"));
  });

  it("prefers NEXISCLAW_HOME for tilde expansion", () => {
    vi.stubEnv("NEXISCLAW_HOME", "/srv/FirstNexus-home");
    vi.stubEnv("HOME", "/home/other");
    try {
      expect(resolveUserPath("~/FirstNexus")).toBe(
        path.resolve("/srv/FirstNexus-home", "FirstNexus"),
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("uses the provided env for tilde expansion", () => {
    const env = {
      HOME: "/tmp/FirstNexus-home",
      NEXISCLAW_HOME: "/srv/FirstNexus-home",
    } as NodeJS.ProcessEnv;

    expect(resolveUserPath("~/FirstNexus", env)).toBe(
      path.resolve("/srv/FirstNexus-home", "FirstNexus"),
    );
  });

  it("keeps blank paths blank", () => {
    expect(resolveUserPath("")).toBe("");
    expect(resolveUserPath("   ")).toBe("");
  });

  it("returns empty string for undefined/null input", () => {
    expect(resolveUserPath(undefined as unknown as string)).toBe("");
    expect(resolveUserPath(null as unknown as string)).toBe("");
  });
});
