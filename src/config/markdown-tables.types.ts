import type { MarkdownTableMode } from "./types.base.js";
import type { FirstNexusConfig } from "./types.FirstNexus.js";

export type ResolveMarkdownTableModeParams = {
  cfg?: Partial<FirstNexusConfig>;
  channel?: string | null;
  accountId?: string | null;
};

export type ResolveMarkdownTableMode = (
  params: ResolveMarkdownTableModeParams,
) => MarkdownTableMode;
