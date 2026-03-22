import { describe, expect, it } from "vitest";
import { buildPlatformRuntimeLogHints, buildPlatformServiceStartHints } from "./runtime-hints.js";

describe("buildPlatformRuntimeLogHints", () => {
  it("renders launchd log hints on darwin", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "darwin",
        env: {
          NEXUSCLAW_STATE_DIR: "/tmp/nexusclaw-state",
          NEXUSCLAW_LOG_PREFIX: "gateway",
        },
        systemdServiceName: "nexusclaw-gateway",
        windowsTaskName: "NexusClaw Gateway",
      }),
    ).toEqual([
      "Launchd stdout (if installed): /tmp/nexusclaw-state/logs/gateway.log",
      "Launchd stderr (if installed): /tmp/nexusclaw-state/logs/gateway.err.log",
    ]);
  });

  it("renders systemd and windows hints by platform", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "linux",
        systemdServiceName: "nexusclaw-gateway",
        windowsTaskName: "NexusClaw Gateway",
      }),
    ).toEqual(["Logs: journalctl --user -u nexusclaw-gateway.service -n 200 --no-pager"]);
    expect(
      buildPlatformRuntimeLogHints({
        platform: "win32",
        systemdServiceName: "nexusclaw-gateway",
        windowsTaskName: "NexusClaw Gateway",
      }),
    ).toEqual(['Logs: schtasks /Query /TN "NexusClaw Gateway" /V /FO LIST']);
  });
});

describe("buildPlatformServiceStartHints", () => {
  it("builds platform-specific service start hints", () => {
    expect(
      buildPlatformServiceStartHints({
        platform: "darwin",
        installCommand: "nexusclaw gateway install",
        startCommand: "nexusclaw gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.nexusclaw.gateway.plist",
        systemdServiceName: "nexusclaw-gateway",
        windowsTaskName: "NexusClaw Gateway",
      }),
    ).toEqual([
      "nexusclaw gateway install",
      "nexusclaw gateway",
      "launchctl bootstrap gui/$UID ~/Library/LaunchAgents/com.nexusclaw.gateway.plist",
    ]);
    expect(
      buildPlatformServiceStartHints({
        platform: "linux",
        installCommand: "nexusclaw gateway install",
        startCommand: "nexusclaw gateway",
        launchAgentPlistPath: "~/Library/LaunchAgents/com.nexusclaw.gateway.plist",
        systemdServiceName: "nexusclaw-gateway",
        windowsTaskName: "NexusClaw Gateway",
      }),
    ).toEqual([
      "nexusclaw gateway install",
      "nexusclaw gateway",
      "systemctl --user start nexusclaw-gateway.service",
    ]);
  });
});
