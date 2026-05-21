import type {
  ProviderDefaultThinkingPolicyContext,
  ProviderThinkingProfile,
} from "FirstNexus/plugin-sdk/core";
import { buildProviderReplayFamilyHooks } from "FirstNexus/plugin-sdk/provider-model-shared";
import { buildProviderToolCompatFamilyHooks } from "FirstNexus/plugin-sdk/provider-tools";
import { createGoogleThinkingStreamWrapper, isGoogleGemini3ProModel } from "./thinking-api.js";

export const GOOGLE_GEMINI_PROVIDER_HOOKS = {
  ...buildProviderReplayFamilyHooks({
    family: "google-gemini",
  }),
  ...buildProviderToolCompatFamilyHooks("gemini"),
  resolveThinkingProfile: ({ modelId }: ProviderDefaultThinkingPolicyContext) =>
    ({
      levels: isGoogleGemini3ProModel(modelId)
        ? [{ id: "off" }, { id: "low" }, { id: "adaptive" }, { id: "high" }]
        : [
            { id: "off" },
            { id: "minimal" },
            { id: "low" },
            { id: "medium" },
            { id: "adaptive" },
            { id: "high" },
          ],
    }) satisfies ProviderThinkingProfile,
  wrapStreamFn: createGoogleThinkingStreamWrapper,
};
