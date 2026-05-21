import type { FirstNexusConfig } from "../../config/types.js";

export type DirectoryConfigParams = {
  cfg: FirstNexusConfig;
  accountId?: string | null;
  query?: string | null;
  limit?: number | null;
};
