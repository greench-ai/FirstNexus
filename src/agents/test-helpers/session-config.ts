import type { FirstNexusConfig } from "../../config/types.FirstNexus.js";

export function createPerSenderSessionConfig(
  overrides: Partial<NonNullable<FirstNexusConfig["session"]>> = {},
): NonNullable<FirstNexusConfig["session"]> {
  return {
    mainKey: "main",
    scope: "per-sender",
    ...overrides,
  };
}
