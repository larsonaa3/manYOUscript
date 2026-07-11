import { describe, expect, it } from "vitest";
import { countWords } from "./word-count";

describe("countWords", () => {
  it("returns 0 for empty or whitespace-only text", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   \n\t  ")).toBe(0);
  });

  it("counts words separated by whitespace", () => {
    expect(countWords("The quick brown fox")).toBe(4);
  });

  it("collapses repeated whitespace and newlines", () => {
    expect(countWords("  Hello   world\n\nagain  ")).toBe(3);
  });
});
