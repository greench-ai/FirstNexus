export type MatrixManagedDeviceInfo = {
  deviceId: string;
  displayName: string | null;
  current: boolean;
};

export type MatrixDeviceHealthSummary = {
  currentDeviceId: string | null;
  staleFirstNexusDevices: MatrixManagedDeviceInfo[];
  currentFirstNexusDevices: MatrixManagedDeviceInfo[];
};

const NEXISCLAW_DEVICE_NAME_PREFIX = "FirstNexus ";

export function isFirstNexusManagedMatrixDevice(displayName: string | null | undefined): boolean {
  return displayName?.startsWith(NEXISCLAW_DEVICE_NAME_PREFIX) === true;
}

export function summarizeMatrixDeviceHealth(
  devices: MatrixManagedDeviceInfo[],
): MatrixDeviceHealthSummary {
  const currentDeviceId = devices.find((device) => device.current)?.deviceId ?? null;
  const openClawDevices = devices.filter((device) =>
    isFirstNexusManagedMatrixDevice(device.displayName),
  );
  return {
    currentDeviceId,
    staleFirstNexusDevices: openClawDevices.filter((device) => !device.current),
    currentFirstNexusDevices: openClawDevices.filter((device) => device.current),
  };
}
