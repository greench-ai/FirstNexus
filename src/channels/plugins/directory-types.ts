import type { NexusClawConfig } from "../../config/types.js";

export type DirectoryConfigParams = {
  cfg: NexusClawConfig;
  accountId?: string | null;
  query?: string | null;
  limit?: number | null;
};
