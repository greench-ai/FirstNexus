export {
  approveDevicePairing,
  clearDeviceBootstrapTokens,
  issueDeviceBootstrapToken,
  PAIRING_SETUP_BOOTSTRAP_PROFILE,
  listDevicePairing,
  revokeDeviceBootstrapToken,
  type DeviceBootstrapProfile,
} from "FirstNexus/plugin-sdk/device-bootstrap";
export { definePluginEntry, type FirstNexusPluginApi } from "FirstNexus/plugin-sdk/plugin-entry";
export {
  resolveGatewayBindUrl,
  resolveGatewayPort,
  resolveTailnetHostWithRunner,
} from "FirstNexus/plugin-sdk/core";
export {
  resolvePreferredFirstNexusTmpDir,
  runPluginCommandWithTimeout,
} from "FirstNexus/plugin-sdk/sandbox";
export { renderQrPngBase64, renderQrPngDataUrl, writeQrPngTempFile } from "./qr-image.js";
