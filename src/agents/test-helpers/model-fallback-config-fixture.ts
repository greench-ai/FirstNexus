import type { FirstNexusConfig } from "../../config/types.FirstNexus.js";

export function makeModelFallbackCfg(overrides: Partial<FirstNexusConfig> = {}): FirstNexusConfig {
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
  } as FirstNexusConfig;
}
