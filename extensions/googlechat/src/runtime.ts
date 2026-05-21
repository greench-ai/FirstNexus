import { createPluginRuntimeStore } from "FirstNexus/plugin-sdk/runtime-store";
import type { PluginRuntime } from "FirstNexus/plugin-sdk/runtime-store";

const { setRuntime: setGoogleChatRuntime, getRuntime: getGoogleChatRuntime } =
  createPluginRuntimeStore<PluginRuntime>({
    pluginId: "googlechat",
    errorMessage: "Google Chat runtime not initialized",
  });
export { getGoogleChatRuntime, setGoogleChatRuntime };
