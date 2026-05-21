import type { PluginRuntime } from "FirstNexus/plugin-sdk/plugin-runtime";
import { createPluginRuntimeStore } from "FirstNexus/plugin-sdk/runtime-store";

const { setRuntime: setTlonRuntime, getRuntime: getTlonRuntime } =
  createPluginRuntimeStore<PluginRuntime>({
    pluginId: "tlon",
    errorMessage: "Tlon runtime not initialized",
  });
export { getTlonRuntime, setTlonRuntime };
