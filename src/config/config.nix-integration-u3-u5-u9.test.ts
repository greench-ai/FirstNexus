import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_GATEWAY_PORT,
  resolveConfigPathCandidate,
  resolveGatewayPort,
  resolveIsNixMode,
  resolveStateDir,
} from "./config.js";
import { withTempHome } from "./test-helpers.js";

vi.unmock("../version.js");

function envWith(overrides: Record<string, string | undefined>): NodeJS.ProcessEnv {
  // Hermetic env: don't inherit process.env because other tests may mutate it.
  return { ...overrides };
}

describe("Nix integration (U3, U5, U9)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("U3: isNixMode env var detection", () => {
    it("isNixMode is false when NEXISCLAW_NIX_MODE is not set", () => {
      expect(resolveIsNixMode(envWith({ NEXISCLAW_NIX_MODE: undefined }))).toBe(false);
    });

    it("isNixMode is false when NEXISCLAW_NIX_MODE is empty", () => {
      expect(resolveIsNixMode(envWith({ NEXISCLAW_NIX_MODE: "" }))).toBe(false);
    });

    it("isNixMode is false when NEXISCLAW_NIX_MODE is not '1'", () => {
      expect(resolveIsNixMode(envWith({ NEXISCLAW_NIX_MODE: "true" }))).toBe(false);
    });

    it("isNixMode is true when NEXISCLAW_NIX_MODE=1", () => {
      expect(resolveIsNixMode(envWith({ NEXISCLAW_NIX_MODE: "1" }))).toBe(true);
    });
  });

  describe("U5: CONFIG_PATH and STATE_DIR env var overrides", () => {
    it("STATE_DIR defaults to ~/.FirstNexus when env not set", () => {
      expect(resolveStateDir(envWith({ NEXISCLAW_STATE_DIR: undefined }))).toMatch(/\.FirstNexus$/);
    });

    it("STATE_DIR respects NEXISCLAW_STATE_DIR override", () => {
      expect(resolveStateDir(envWith({ NEXISCLAW_STATE_DIR: "/custom/state/dir" }))).toBe(
        path.resolve("/custom/state/dir"),
      );
    });

    it("STATE_DIR respects NEXISCLAW_HOME when state override is unset", () => {
      const customHome = path.join(path.sep, "custom", "home");
      expect(
        resolveStateDir(envWith({ NEXISCLAW_HOME: customHome, NEXISCLAW_STATE_DIR: undefined })),
      ).toBe(path.join(path.resolve(customHome), ".FirstNexus"));
    });

    it("CONFIG_PATH defaults to NEXISCLAW_HOME/.FirstNexus/FirstNexus.json", () => {
      const customHome = path.join(path.sep, "custom", "home");
      expect(
        resolveConfigPathCandidate(
          envWith({
            NEXISCLAW_HOME: customHome,
            NEXISCLAW_CONFIG_PATH: undefined,
            NEXISCLAW_STATE_DIR: undefined,
          }),
        ),
      ).toBe(path.join(path.resolve(customHome), ".FirstNexus", "FirstNexus.json"));
    });

    it("CONFIG_PATH defaults to ~/.FirstNexus/FirstNexus.json when env not set", () => {
      expect(
        resolveConfigPathCandidate(
          envWith({ NEXISCLAW_CONFIG_PATH: undefined, NEXISCLAW_STATE_DIR: undefined }),
        ),
      ).toMatch(/\.FirstNexus[\\/]FirstNexus\.json$/);
    });

    it("CONFIG_PATH respects NEXISCLAW_CONFIG_PATH override", () => {
      expect(
        resolveConfigPathCandidate(
          envWith({ NEXISCLAW_CONFIG_PATH: "/nix/store/abc/FirstNexus.json" }),
        ),
      ).toBe(path.resolve("/nix/store/abc/FirstNexus.json"));
    });

    it("CONFIG_PATH expands ~ in NEXISCLAW_CONFIG_PATH override", async () => {
      await withTempHome(async (home) => {
        expect(
          resolveConfigPathCandidate(
            envWith({ NEXISCLAW_HOME: home, NEXISCLAW_CONFIG_PATH: "~/.FirstNexus/custom.json" }),
            () => home,
          ),
        ).toBe(path.join(home, ".FirstNexus", "custom.json"));
      });
    });

    it("CONFIG_PATH uses STATE_DIR when only state dir is overridden", () => {
      expect(
        resolveConfigPathCandidate(
          envWith({ NEXISCLAW_STATE_DIR: "/custom/state", NEXISCLAW_TEST_FAST: "1" }),
          () => path.join(path.sep, "tmp", "FirstNexus-config-home"),
        ),
      ).toBe(path.join(path.resolve("/custom/state"), "FirstNexus.json"));
    });
  });

  describe("U6: gateway port resolution", () => {
    it("uses default when env and config are unset", () => {
      expect(resolveGatewayPort({}, envWith({ NEXISCLAW_GATEWAY_PORT: undefined }))).toBe(
        DEFAULT_GATEWAY_PORT,
      );
    });

    it("prefers NEXISCLAW_GATEWAY_PORT over config", () => {
      expect(
        resolveGatewayPort(
          { gateway: { port: 19002 } },
          envWith({ NEXISCLAW_GATEWAY_PORT: "19001" }),
        ),
      ).toBe(19001);
    });

    it("falls back to config when env is invalid", () => {
      expect(
        resolveGatewayPort(
          { gateway: { port: 19003 } },
          envWith({ NEXISCLAW_GATEWAY_PORT: "nope" }),
        ),
      ).toBe(19003);
    });
  });
});
