import { describe, expect, it } from "vitest";
import {
  GATEWAY_RESTART_LOG_FILENAME,
  renderCmdRestartLogSetup,
  renderPosixRestartLogSetup,
  resolveGatewayLogPaths,
  resolveGatewayRestartLogPath,
} from "./restart-logs.js";

describe("restart log conventions", () => {
  it("resolves profile-aware gateway logs and restart attempts together", () => {
    const env = {
      HOME: "/Users/test",
      NEXISCLAW_PROFILE: "work",
    };

    expect(resolveGatewayLogPaths(env)).toEqual({
      logDir: "/Users/test/.FirstNexus-work/logs",
      stdoutPath: "/Users/test/.FirstNexus-work/logs/gateway.log",
      stderrPath: "/Users/test/.FirstNexus-work/logs/gateway.err.log",
    });
    expect(resolveGatewayRestartLogPath(env)).toBe(
      `/Users/test/.FirstNexus-work/logs/${GATEWAY_RESTART_LOG_FILENAME}`,
    );
  });

  it("honors NEXISCLAW_STATE_DIR for restart attempts", () => {
    const env = {
      HOME: "/Users/test",
      NEXISCLAW_STATE_DIR: "/tmp/FirstNexus-state",
    };

    expect(resolveGatewayRestartLogPath(env)).toBe(
      `/tmp/FirstNexus-state/logs/${GATEWAY_RESTART_LOG_FILENAME}`,
    );
  });

  it("renders best-effort POSIX log setup with escaped paths", () => {
    const setup = renderPosixRestartLogSetup({
      HOME: "/Users/test's",
    });

    expect(setup).toContain(
      "if mkdir -p '/Users/test'\\''s/.FirstNexus/logs' 2>/dev/null && : >>'/Users/test'\\''s/.FirstNexus/logs/gateway-restart.log' 2>/dev/null; then",
    );
    expect(setup).toContain("exec >>'/Users/test'\\''s/.FirstNexus/logs/gateway-restart.log' 2>&1");
  });

  it("renders CMD log setup with quoted paths", () => {
    const setup = renderCmdRestartLogSetup({
      USERPROFILE: "C:\\Users\\Test User",
    });

    expect(setup.quotedLogPath).toBe('"C:\\Users\\Test User/.FirstNexus/logs/gateway-restart.log"');
    expect(setup.lines).toContain(
      'if not exist "C:\\Users\\Test User/.FirstNexus/logs" mkdir "C:\\Users\\Test User/.FirstNexus/logs" >nul 2>&1',
    );
  });
});
