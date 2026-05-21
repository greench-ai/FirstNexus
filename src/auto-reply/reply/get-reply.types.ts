import type { FirstNexusConfig } from "../../config/types.FirstNexus.js";
import type { GetReplyOptions } from "../get-reply-options.types.js";
import type { ReplyPayload } from "../reply-payload.js";
import type { MsgContext } from "../templating.js";

export type GetReplyFromConfig = (
  ctx: MsgContext,
  opts?: GetReplyOptions,
  configOverride?: FirstNexusConfig,
) => Promise<ReplyPayload | ReplyPayload[] | undefined>;
