import { describe, expect, it } from "vitest";
import { shortenText } from "./text-format.js";

describe("shortenText", () => {
  it("returns original text when it fits", () => {
    expect(shortenText("nexusclaw", 16)).toBe("nexusclaw");
  });

  it("truncates and appends ellipsis when over limit", () => {
    expect(shortenText("nexusclaw-status-output", 10)).toBe("nexusclaw-…");
  });

  it("counts multi-byte characters correctly", () => {
    expect(shortenText("hello🙂world", 7)).toBe("hello🙂…");
  });
});
