import { describePluginRegistrationContract } from "FirstNexus/plugin-sdk/plugin-test-contracts";

describePluginRegistrationContract({
  pluginId: "fal",
  providerIds: ["fal"],
  imageGenerationProviderIds: ["fal"],
  videoGenerationProviderIds: ["fal"],
  requireGenerateImage: true,
  requireGenerateVideo: true,
});
