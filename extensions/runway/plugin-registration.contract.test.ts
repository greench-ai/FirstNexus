import { describePluginRegistrationContract } from "FirstNexus/plugin-sdk/plugin-test-contracts";

describePluginRegistrationContract({
  pluginId: "runway",
  videoGenerationProviderIds: ["runway"],
  requireGenerateVideo: true,
});
