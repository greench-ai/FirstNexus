import { formatTrimmedAllowFromEntries } from "FirstNexus/plugin-sdk/channel-config-helpers";
import { PAIRING_APPROVED_MESSAGE } from "FirstNexus/plugin-sdk/channel-status";
import {
  DEFAULT_ACCOUNT_ID,
  getChatChannelMeta,
  type ChannelPlugin,
} from "FirstNexus/plugin-sdk/core";
import { resolveChannelMediaMaxBytes } from "FirstNexus/plugin-sdk/media-runtime";
import { collectStatusIssuesFromLastError } from "FirstNexus/plugin-sdk/status-helpers";
import { normalizeIMessageMessagingTarget } from "./normalize.js";
export { chunkTextForOutbound } from "FirstNexus/plugin-sdk/text-chunking";

export {
  collectStatusIssuesFromLastError,
  DEFAULT_ACCOUNT_ID,
  formatTrimmedAllowFromEntries,
  getChatChannelMeta,
  normalizeIMessageMessagingTarget,
  PAIRING_APPROVED_MESSAGE,
  resolveChannelMediaMaxBytes,
};

export type { ChannelPlugin };
