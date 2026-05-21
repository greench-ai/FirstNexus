import { describe, expect, it } from "vitest";
import { isFirstNexusManagedMatrixDevice, summarizeMatrixDeviceHealth } from "./device-health.js";

describe("matrix device health", () => {
  it("detects FirstNexus-managed device names", () => {
    expect(isFirstNexusManagedMatrixDevice("FirstNexus Gateway")).toBe(true);
    expect(isFirstNexusManagedMatrixDevice("FirstNexus Debug")).toBe(true);
    expect(isFirstNexusManagedMatrixDevice("Element iPhone")).toBe(false);
    expect(isFirstNexusManagedMatrixDevice(null)).toBe(false);
  });

  it("summarizes stale FirstNexus-managed devices separately from the current device", () => {
    const summary = summarizeMatrixDeviceHealth([
      {
        deviceId: "du314Zpw3A",
        displayName: "FirstNexus Gateway",
        current: true,
      },
      {
        deviceId: "BritdXC6iL",
        displayName: "FirstNexus Gateway",
        current: false,
      },
      {
        deviceId: "G6NJU9cTgs",
        displayName: "FirstNexus Debug",
        current: false,
      },
      {
        deviceId: "phone123",
        displayName: "Element iPhone",
        current: false,
      },
    ]);

    expect(summary).toEqual({
      currentDeviceId: "du314Zpw3A",
      currentFirstNexusDevices: [
        {
          deviceId: "du314Zpw3A",
          displayName: "FirstNexus Gateway",
          current: true,
        },
      ],
      staleFirstNexusDevices: [
        {
          deviceId: "BritdXC6iL",
          displayName: "FirstNexus Gateway",
          current: false,
        },
        {
          deviceId: "G6NJU9cTgs",
          displayName: "FirstNexus Debug",
          current: false,
        },
      ],
    });
  });
});
