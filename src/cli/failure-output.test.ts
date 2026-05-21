import { describe, expect, it } from "vitest";
import { formatCliFailureLines } from "./failure-output.js";

describe("formatCliFailureLines", () => {
  it("shows a concise reason and recovery commands by default", () => {
    const lines = formatCliFailureLines({
      title: "Could not start the CLI.",
      error: new Error("config file is invalid"),
      argv: ["node", "FirstNexus", "status"],
      env: {},
    });

    expect(lines).toContain("[FirstNexus] Could not start the CLI.");
    expect(lines).toContain("[FirstNexus] Reason: config file is invalid");
    expect(lines).toContain(
      "[FirstNexus] Debug: set NEXISCLAW_DEBUG=1 to include the stack trace.",
    );
    expect(lines).toContain("[FirstNexus] Try: FirstNexus doctor");
    expect(lines).toContain("[FirstNexus] Help: FirstNexus --help");
  });

  it("prints stack details when debug output is requested", () => {
    const lines = formatCliFailureLines({
      title: "The CLI command failed.",
      error: new Error("boom"),
      env: { NEXISCLAW_DEBUG: "1" },
    });

    expect(lines).toContain("[FirstNexus] Stack:");
    expect(lines.some((line) => line.includes("Error: boom"))).toBe(true);
  });
});
