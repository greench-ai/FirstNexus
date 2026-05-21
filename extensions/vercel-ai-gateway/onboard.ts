import {
  applyAgentDefaultModelPrimary,
  type FirstNexusConfig,
} from "FirstNexus/plugin-sdk/provider-onboard";

export const VERCEL_AI_GATEWAY_DEFAULT_MODEL_REF = "vercel-ai-gateway/anthropic/claude-opus-4.6";

function applyVercelAiGatewayProviderConfig(cfg: FirstNexusConfig): FirstNexusConfig {
  const models = { ...cfg.agents?.defaults?.models };
  models[VERCEL_AI_GATEWAY_DEFAULT_MODEL_REF] = {
    ...models[VERCEL_AI_GATEWAY_DEFAULT_MODEL_REF],
    alias: models[VERCEL_AI_GATEWAY_DEFAULT_MODEL_REF]?.alias ?? "Vercel AI Gateway",
  };

  return {
    ...cfg,
    agents: {
      ...cfg.agents,
      defaults: {
        ...cfg.agents?.defaults,
        models,
      },
    },
  };
}

export function applyVercelAiGatewayConfig(cfg: FirstNexusConfig): FirstNexusConfig {
  return applyAgentDefaultModelPrimary(
    applyVercelAiGatewayProviderConfig(cfg),
    VERCEL_AI_GATEWAY_DEFAULT_MODEL_REF,
  );
}
