import type { FileRecord } from "@manyouscript/index-db";

export interface ReorderStep {
  path: string;
  newOrder: unknown;
}

/**
 * Given a chapter list and the index of the chapter being moved, returns
 * the two {path, newOrder} writes needed to swap it with its neighbor in
 * `direction`, or null if the move would go out of bounds.
 */
export function computeReorderSwap(
  chapters: FileRecord[],
  index: number,
  direction: -1 | 1,
): [ReorderStep, ReorderStep] | null {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= chapters.length) {
    return null;
  }
  const a = chapters[index]!;
  const b = chapters[targetIndex]!;
  return [
    { path: a.path, newOrder: b.frontmatter.order },
    { path: b.path, newOrder: a.frontmatter.order },
  ];
}
