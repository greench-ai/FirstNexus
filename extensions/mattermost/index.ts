import {
  defineBundledChannelEntry,
  loadBundledEntryExportSync,
} from "FirstNexus/plugin-sdk/channel-entry-contract";
import type { FirstNexusPluginApi } from "FirstNexus/plugin-sdk/channel-entry-contract";

function registerSlashCommandRoute(api: FirstNexusPluginApi): void {
  const register = loadBundledEntryExportSync<(api: FirstNexusPluginApi) => void>(import.meta.url, {
    specifier: "./slash-route-api.js",
    exportName: "registerSlashCommandRoute",
  });
  register(api);
}

export default defineBundledChannelEntry({
  id: "mattermost",
  name: "Mattermost",
  description: "Mattermost channel plugin",
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "mattermostPlugin",
  },
  secrets: {
    specifier: "./secret-contract-api.js",
    exportName: "channelSecrets",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMattermostRuntime",
  },
  registerFull(api) {
    // Actual slash-command registration happens after the monitor connects and
    // knows the team id; the route itself can be wired here.
    registerSlashCommandRoute(api);
  },
});
