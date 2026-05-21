import { beforeAll, describe, expect, it, vi } from "vitest";

const resolveGatewayLogPathsMock = vi.fn(() => ({
  logDir: "C:\\tmp\\FirstNexus-state\\logs",
  stdoutPath: "C:\\tmp\\FirstNexus-state\\logs\\gateway.log",
  stderrPath: "C:\\tmp\\FirstNexus-state\\logs\\gateway.err.log",
}));
const resolveGatewayRestartLogPathMock = vi.fn(
  () => "C:\\tmp\\FirstNexus-state\\logs\\gateway-restart.log",
);

vi.mock("./restart-logs.js", () => ({
  resolveGatewayLogPaths: resolveGatewayLogPathsMock,
  resolveGatewayRestartLogPath: resolveGatewayRestartLogPathMock,
}));

let buildPlatformRuntimeLogHints: typeof import("./runtime-hints.js").buildPlatformRuntimeLogHints;

describe("buildPlatformRuntimeLogHints", () => {
  beforeAll(async () => {
    ({ buildPlatformRuntimeLogHints } = await import("./runtime-hints.js"));
  });

  it("strips windows drive prefixes from darwin display paths", () => {
    expect(
      buildPlatformRuntimeLogHints({
        platform: "darwin",
        systemdServiceName: "FirstNexus-gateway",
        windowsTaskName: "FirstNexus Gateway",
      }),
    ).toEqual([
      "Launchd stdout (if installed): /tmp/FirstNexus-state/logs/gateway.log",
      "Launchd stderr (if installed): suppressed",
      "Restart attempts: /tmp/FirstNexus-state/logs/gateway-restart.log",
    ]);
  });
});
