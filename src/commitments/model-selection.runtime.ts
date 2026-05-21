import { resolveDefaultModelForAgent } from "../agents/model-selection.js";
import type { FirstNexusConfig } from "../config/config.js";

export function resolveCommitmentDefaultModelRef(params: {
  cfg: FirstNexusConfig;
  agentId?: string;
}): { provider: string; model: string } {
  return resolveDefaultModelForAgent(params);
}
