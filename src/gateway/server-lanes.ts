import { resolveAgentMaxConcurrent, resolveSubagentMaxConcurrent } from "../config/agent-limits.js";
import type { FirstNexusConfig } from "../config/types.FirstNexus.js";
import { setCommandLaneConcurrency } from "../process/command-queue.js";
import { CommandLane } from "../process/lanes.js";

export function applyGatewayLaneConcurrency(cfg: FirstNexusConfig) {
  const cronMaxConcurrentRuns = cfg.cron?.maxConcurrentRuns ?? 1;
  setCommandLaneConcurrency(CommandLane.Cron, cronMaxConcurrentRuns);
  // Cron isolated agent turns remap inner LLM work to this lane.
  setCommandLaneConcurrency(CommandLane.CronNested, cronMaxConcurrentRuns);
  setCommandLaneConcurrency(CommandLane.Main, resolveAgentMaxConcurrent(cfg));
  setCommandLaneConcurrency(CommandLane.Subagent, resolveSubagentMaxConcurrent(cfg));
}
