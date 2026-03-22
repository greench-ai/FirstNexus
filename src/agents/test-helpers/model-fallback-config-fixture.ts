import type { NexusClawConfig } from "../../config/config.js";

export function makeModelFallbackCfg(overrides: Partial<NexusClawConfig> = {}): NexusClawConfig {
  return {
    agents: {
      defaults: {
        model: {
          primary: "openai/gpt-4.1-mini",
          fallbacks: ["anthropic/claude-haiku-3-5"],
        },
      },
    },
    ...overrides,
  } as NexusClawConfig;
}
