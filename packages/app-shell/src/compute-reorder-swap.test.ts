import { describe, expect, it } from "vitest";
import type { FileRecord } from "@manyouscript/index-db";
import { computeReorderSwap } from "./compute-reorder-swap";

function chapter(path: string, order: number): FileRecord {
  return { path, relativePath: path, title: path, frontmatter: { manuscript: "Novel", order } };
}

describe("computeReorderSwap", () => {
  const chapters = [chapter("/vault/ch1.md", 1), chapter("/vault/ch2.md", 2), chapter("/vault/ch3.md", 3)];

  it("swaps a chapter's order with the next one when moving down", () => {
    const steps = computeReorderSwap(chapters, 0, 1);
    expect(steps).toEqual([
      { path: "/vault/ch1.md", newOrder: 2 },
      { path: "/vault/ch2.md", newOrder: 1 },
    ]);
  });

  it("swaps a chapter's order with the previous one when moving up", () => {
    const steps = computeReorderSwap(chapters, 2, -1);
    expect(steps).toEqual([
      { path: "/vault/ch3.md", newOrder: 2 },
      { path: "/vault/ch2.md", newOrder: 3 },
    ]);
  });

  it("returns null when moving the first chapter up", () => {
    expect(computeReorderSwap(chapters, 0, -1)).toBeNull();
  });

  it("returns null when moving the last chapter down", () => {
    expect(computeReorderSwap(chapters, 2, 1)).toBeNull();
  });
});
