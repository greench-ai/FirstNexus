import { describe, expect, it } from "vitest";
import { shortenText } from "./text-format.js";

describe("shortenText", () => {
  it("returns original text when it fits", () => {
    expect(shortenText("FirstNexus", 16)).toBe("FirstNexus");
  });

  it("truncates and appends ellipsis when over limit", () => {
    expect(shortenText("FirstNexus-status-output", 10)).toBe("FirstNexus-…");
  });

  it("counts multi-byte characters correctly", () => {
    expect(shortenText("hello🙂world", 7)).toBe("hello🙂…");
  });
});
