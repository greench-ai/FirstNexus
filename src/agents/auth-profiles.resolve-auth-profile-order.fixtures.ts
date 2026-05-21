import type { FirstNexusConfig } from "../config/types.FirstNexus.js";
import type { AuthProfileStore } from "./auth-profiles.js";

export const ANTHROPIC_STORE: AuthProfileStore = {
  version: 1,
  profiles: {
    "anthropic:default": {
      type: "api_key",
      provider: "anthropic",
      key: "sk-default",
    },
    "anthropic:work": {
      type: "api_key",
      provider: "anthropic",
      key: "sk-work",
    },
  },
};

export const ANTHROPIC_CFG: FirstNexusConfig = {
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
    },
  },
};
