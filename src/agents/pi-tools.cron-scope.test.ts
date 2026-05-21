import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AnyAgentTool } from "./tools/common.js";

const mocks = vi.hoisted(() => {
  const stubTool = (name: string, ownerOnly = false) =>
    ({
      name,
      label: name,
      displaySummary: name,
      description: name,
      ownerOnly,
      parameters: { type: "object", properties: {} },
      execute: vi.fn(),
    }) satisfies AnyAgentTool;

  return {
    createFirstNexusToolsOptions: vi.fn(),
    stubTool,
  };
});

vi.mock("./FirstNexus-tools.js", () => ({
  createFirstNexusTools: (options: unknown) => {
    mocks.createFirstNexusToolsOptions(options);
    return [mocks.stubTool("cron", true)];
  },
}));

import "./test-helpers/fast-bash-tools.js";
import "./test-helpers/fast-coding-tools.js";
import { createFirstNexusCodingTools } from "./pi-tools.js";

describe("createFirstNexusCodingTools cron scope", () => {
  beforeEach(() => {
    mocks.createFirstNexusToolsOptions.mockClear();
  });

  it("scopes the cron owner-only runtime grant to self-removal", () => {
    const tools = createFirstNexusCodingTools({
      trigger: "cron",
      jobId: "job-current",
      senderIsOwner: false,
      ownerOnlyToolAllowlist: ["cron"],
    });

    expect(tools.map((tool) => tool.name)).toContain("cron");
    const [options] = mocks.createFirstNexusToolsOptions.mock.calls.at(0) ?? [];
    expect(options?.cronSelfRemoveOnlyJobId).toBe("job-current");
  });

  it("does not scope ordinary owner cron sessions", () => {
    createFirstNexusCodingTools({
      trigger: "cron",
      jobId: "job-current",
      senderIsOwner: true,
    });

    const [options] = mocks.createFirstNexusToolsOptions.mock.calls.at(0) ?? [];
    expect(options?.cronSelfRemoveOnlyJobId).toBeUndefined();
  });
});
