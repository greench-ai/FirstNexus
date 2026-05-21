import { describe, expect, it } from "vitest";
import { buildPlatformRuntimeLogHints, buildPlatformServiceStartHints } from "./runtime-hints.js";

describe("buildPlatformRuntimeLogHints", () => {
  it("renders launchd log hints on darwin", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "darwin",
        env: {
          NEXISCLAW_STATE_DIR: "/tmp/FirstNexus-state",
          NEXISCLAW_LOG_PREFIX: "gateway",
        },
        systemdServiceName: "FirstNexus-gateway",
        windowsTaskName: "FirstNexus Gateway",
      }),
    ).toEqual([
      "Launchd stdout (if installed): /tmp/FirstNexus-state/logs/gateway.log",
      "Launchd stderr (if installed): suppressed",
      "Restart attempts: /tmp/FirstNexus-state/logs/gateway-restart.log",
    ]);
  });

  it("renders systemd and windows hints by platform", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "linux",
        env: {
          NEXISCLAW_STATE_DIR: "/tmp/FirstNexus-state",
        },
        systemdServiceName: "FirstNexus-gateway",
        windowsTaskName: "FirstNexus Gateway",
      }),
    ).toEqual([
      "Logs: journalctl --user -u FirstNexus-gateway.service -n 200 --no-pager",
      "Restart attempts: /tmp/FirstNexus-state/logs/gateway-restart.log",
    ]);
    expect(
      buildPlatformRuntimeLogHints({
        platform: "win32",
        env: {
          NEXISCLAW_STATE_DIR: "/tmp/FirstNexus-state",
        },
        systemdServiceName: "FirstNexus-gateway",
        windowsTaskName: "FirstNexus Gateway",
      }),
    ).toEqual([
      'Logs: schtasks /Query /TN "FirstNexus Gateway" /V /FO LIST',
      "Restart attempts: /tmp/FirstNexus-state/logs/gateway-restart.log",
    ]);
  });
});

describe("buildPlatformServiceStartHints", () => {
  it("builds platform-specific service start hints", () => {
    expect(
      buildPlatformServiceStartHints({
        platform: "darwin",
        installCommand: "FirstNexus gateway install",
        startCommand: "FirstNexus gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.FirstNexus.gateway.plist",
        systemdServiceName: "FirstNexus-gateway",
        windowsTaskName: "FirstNexus Gateway",
      }),
    ).toEqual([
      "FirstNexus gateway install",
      "FirstNexus gateway",
      "launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.FirstNexus.gateway.plist",
    ]);
    expect(
      buildPlatformServiceStartHints({
        platform: "linux",
        installCommand: "FirstNexus gateway install",
        startCommand: "FirstNexus gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.FirstNexus.gateway.plist",
        systemdServiceName: "FirstNexus-gateway",
        windowsTaskName: "FirstNexus Gateway",
      }),
    ).toEqual([
      "FirstNexus gateway install",
      "FirstNexus gateway",
      "systemctl --user start FirstNexus-gateway.service",
    ]);
  });
});
