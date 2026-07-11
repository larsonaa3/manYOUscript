import { describe, expect, it } from "vitest";
import { filterFilesByQuery } from "./quick-switcher-filter";

const files = [
  { path: "/vault/aria.md", relativePath: "aria.md" },
  { path: "/vault/chapters/one.md", relativePath: "chapters/one.md" },
  { path: "/vault/session-1.md", relativePath: "session-1.md" },
];

describe("filterFilesByQuery", () => {
  it("returns everything for an empty query", () => {
    expect(filterFilesByQuery(files, "")).toEqual(files);
    expect(filterFilesByQuery(files, "   ")).toEqual(files);
  });

  it("matches a substring of the relative path, case-insensitively", () => {
    expect(filterFilesByQuery(files, "ARIA").map((f) => f.relativePath)).toEqual(["aria.md"]);
  });

  it("matches nested paths by folder name", () => {
    expect(filterFilesByQuery(files, "chapters").map((f) => f.relativePath)).toEqual(["chapters/one.md"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterFilesByQuery(files, "nonexistent")).toEqual([]);
  });
});
