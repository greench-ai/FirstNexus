import type { PluginRuntime } from "FirstNexus/plugin-sdk/core";
import { createPluginRuntimeStore } from "FirstNexus/plugin-sdk/runtime-store";

const { setRuntime: setIMessageRuntime } = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "imessage",
  errorMessage: "iMessage runtime not initialized",
});
export { setIMessageRuntime };
