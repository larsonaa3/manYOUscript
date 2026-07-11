import { describe, expect, it } from "vitest";
import { compileManuscript } from "./compile-manuscript";

describe("compileManuscript", () => {
  it("concatenates chapters under a title heading, in the given order", () => {
    const result = compileManuscript("The Iron Coast", [
      { title: "Chapter One", body: "The storm rolled in.\n" },
      { title: "Chapter Two", body: "By dawn, the crew counted their losses.\n" },
    ]);
    expect(result).toBe(
      "# The Iron Coast\n\n## Chapter One\n\nThe storm rolled in.\n\n\n## Chapter Two\n\nBy dawn, the crew counted their losses.\n",
    );
  });

  it("trims trailing/leading whitespace from each chapter body", () => {
    const result = compileManuscript("Solo", [{ title: "Only Chapter", body: "\n\n  Text.  \n\n" }]);
    expect(result).toBe("# Solo\n\n## Only Chapter\n\nText.\n");
  });

  it("produces just the title heading for an empty chapter list", () => {
    expect(compileManuscript("Empty", [])).toBe("# Empty\n\n");
  });
});
