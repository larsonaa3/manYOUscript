import { describe, expect, it } from "vitest";
import { splitFrontmatter, joinFrontmatter } from "./frontmatter";

describe("splitFrontmatter", () => {
  it("returns empty frontmatter and the full body when there is no frontmatter block", () => {
    const result = splitFrontmatter("# Just a heading\n\nSome text.\n");
    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe("# Just a heading\n\nSome text.\n");
  });

  it("parses a YAML frontmatter block and strips it from the body", () => {
    const raw = "---\ntitle: Chapter One\ntags:\n  - draft\n---\n# Chapter One\n\nBody text.\n";
    const result = splitFrontmatter(raw);
    expect(result.frontmatter).toEqual({ title: "Chapter One", tags: ["draft"] });
    expect(result.body).toBe("# Chapter One\n\nBody text.\n");
  });
});

describe("joinFrontmatter", () => {
  it("returns the body unchanged when frontmatter is empty", () => {
    expect(joinFrontmatter({}, "Body only.\n")).toBe("Body only.\n");
  });

  it("is the inverse of splitFrontmatter for a round trip", () => {
    const raw = "---\ntitle: Chapter One\ntags:\n  - draft\n---\n# Chapter One\n\nBody text.\n";
    const { frontmatter, body } = splitFrontmatter(raw);
    const rejoined = joinFrontmatter(frontmatter, body);
    expect(splitFrontmatter(rejoined)).toEqual({ frontmatter, body });
  });
});
