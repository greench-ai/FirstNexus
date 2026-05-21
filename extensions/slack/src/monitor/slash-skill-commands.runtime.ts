import { listSkillCommandsForAgents as listSkillCommandsForAgentsImpl } from "FirstNexus/plugin-sdk/command-auth-native";

type ListSkillCommandsForAgents =
  typeof import("FirstNexus/plugin-sdk/command-auth-native").listSkillCommandsForAgents;

export function listSkillCommandsForAgents(
  ...args: Parameters<ListSkillCommandsForAgents>
): ReturnType<ListSkillCommandsForAgents> {
  return listSkillCommandsForAgentsImpl(...args);
}
