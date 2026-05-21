import { describe, expect, it } from "vitest";
import {
  isFirstNexusOwnerOnlyCoreToolName,
  NEXISCLAW_OWNER_ONLY_CORE_TOOL_NAMES,
} from "./tools/owner-only-tools.js";

describe("createFirstNexusTools owner authorization", () => {
  it("marks owner-only core tool names", () => {
    expect(NEXISCLAW_OWNER_ONLY_CORE_TOOL_NAMES).toEqual(["cron", "gateway", "nodes"]);
    expect(isFirstNexusOwnerOnlyCoreToolName("cron")).toBe(true);
    expect(isFirstNexusOwnerOnlyCoreToolName("gateway")).toBe(true);
    expect(isFirstNexusOwnerOnlyCoreToolName("nodes")).toBe(true);
  });

  it("keeps canvas non-owner-only", () => {
    expect(isFirstNexusOwnerOnlyCoreToolName("canvas")).toBe(false);
  });
});
