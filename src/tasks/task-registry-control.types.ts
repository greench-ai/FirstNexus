import type { FirstNexusConfig } from "../config/types.FirstNexus.js";

export type CancelAcpSessionAdmin = (params: {
  cfg: FirstNexusConfig;
  sessionKey: string;
  reason: string;
}) => Promise<void>;

export type KillSubagentRunAdminResult = {
  found: boolean;
  killed: boolean;
  runId?: string;
  sessionKey?: string;
  cascadeKilled?: number;
  cascadeLabels?: string[];
};

export type KillSubagentRunAdmin = (params: {
  cfg: FirstNexusConfig;
  sessionKey: string;
}) => Promise<KillSubagentRunAdminResult>;

export type TaskRegistryControlRuntime = {
  getAcpSessionManager: () => {
    cancelSession: CancelAcpSessionAdmin;
  };
  killSubagentRunAdmin: KillSubagentRunAdmin;
};
