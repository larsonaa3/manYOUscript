import { describe, expect, it } from "vitest";
import { parseNote, stringifyNote, deriveTitle } from "./parse-note";

describe("parseNote", () => {
  it("splits frontmatter, body, and wikilink targets", () => {
    const raw = "---\ntitle: Chapter One\n---\nOur hero meets [[Aria]] in [[Riverbend]].\n";
    const result = parseNote(raw);
    expect(result.frontmatter).toEqual({ title: "Chapter One" });
    expect(result.body).toBe("Our hero meets [[Aria]] in [[Riverbend]].\n");
    expect(result.wikilinkTargets).toEqual(["Aria", "Riverbend"]);
  });
});

describe("stringifyNote", () => {
  it("round-trips through parseNote", () => {
    const frontmatter = { title: "Chapter One" };
    const body = "Our hero meets [[Aria]].\n";
    const raw = stringifyNote(frontmatter, body);
    expect(parseNote(raw)).toEqual({ frontmatter, body, wikilinkTargets: ["Aria"] });
  });
});

describe("deriveTitle", () => {
  it("prefers frontmatter title when present", () => {
    expect(deriveTitle("chapter-one.md", { title: "Chapter One" })).toBe("Chapter One");
  });

  it("falls back to the file name without extension", () => {
    expect(deriveTitle("Chapter One.md", {})).toBe("Chapter One");
  });
});
