import { definePluginEntry } from "FirstNexus/plugin-sdk/plugin-entry";
import { registerOcPathCli } from "./cli-registration.js";

export default definePluginEntry({
  id: "oc-path",
  name: "OC Path",
  description: "Adds the FirstNexus path CLI for oc:// workspace file addressing.",
  register(api) {
    registerOcPathCli(api);
  },
});
