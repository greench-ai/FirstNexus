import { resolveChannelGroupRequireMention } from "FirstNexus/plugin-sdk/channel-policy";
import type { FirstNexusConfig } from "FirstNexus/plugin-sdk/core";

type GoogleChatGroupContext = {
  cfg: FirstNexusConfig;
  accountId?: string | null;
  groupId?: string | null;
};

export function resolveGoogleChatGroupRequireMention(params: GoogleChatGroupContext): boolean {
  return resolveChannelGroupRequireMention({
    cfg: params.cfg,
    channel: "googlechat",
    groupId: params.groupId,
    accountId: params.accountId,
  });
}
