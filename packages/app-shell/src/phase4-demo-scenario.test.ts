import { describe, expect, it } from "vitest";
import { VaultIndex, type FileRecord } from "@manyouscript/index-db";
import { deriveTitle, parseNote, stringifyNote } from "@manyouscript/markdown-io";
import { countWords } from "@manyouscript/data-layer";
import { deriveIndexInputs } from "./derive-index-inputs";
import { computeReorderSwap } from "./compute-reorder-swap";

function indexNote(raw: string, path: string, vaultIndex: VaultIndex): FileRecord {
  const parsed = parseNote(raw);
  const { entitySchemaId, links } = deriveIndexInputs(parsed);
  const relativePath = path.replace("/vault/", "");
  const record: FileRecord = {
    path,
    relativePath,
    title: deriveTitle(relativePath, parsed.frontmatter),
    frontmatter: parsed.frontmatter,
    wordCount: countWords(parsed.body),
    ...(entitySchemaId ? { entitySchemaId } : {}),
  };
  vaultIndex.setFile(record, links);
  return record;
}

/**
 * Simulates the Phase 4 demo criterion: organize a multi-chapter
 * manuscript, reorder chapters, and see aggregate word counts update -
 * exercised at the data layer the same way app-shell's indexFile()/
 * handleReorderChapter drive it, without needing a live vault or GUI.
 */
describe("Phase 4 demo scenario: manuscript organization and reordering", () => {
  it("groups chapters by manuscript, sorts by order, and reorders on demand", () => {
    const vaultIndex = new VaultIndex();

    indexNote(
      "---\nmanuscript: The Iron Coast\norder: 1\n---\nOnce upon a time, a storm rolled in.\n",
      "/vault/ch1.md",
      vaultIndex,
    );
    indexNote(
      "---\nmanuscript: The Iron Coast\norder: 2\n---\nThe crew found the wreck at dawn.\n",
      "/vault/ch2.md",
      vaultIndex,
    );

    let manuscripts = vaultIndex.getManuscripts();
    expect(manuscripts).toHaveLength(1);
    expect(manuscripts[0]!.chapters.map((c) => c.relativePath)).toEqual(["ch1.md", "ch2.md"]);
    expect(manuscripts[0]!.totalWordCount).toBeGreaterThan(0);

    // Move chapter 1 down, swapping it with chapter 2.
    const steps = computeReorderSwap(manuscripts[0]!.chapters, 0, 1);
    expect(steps).not.toBeNull();
    for (const { path, newOrder } of steps!) {
      const current = vaultIndex.getFile(path)!;
      const raw = stringifyNote(
        { ...current.frontmatter, order: newOrder },
        path === "/vault/ch1.md"
          ? "Once upon a time, a storm rolled in.\n"
          : "The crew found the wreck at dawn.\n",
      );
      indexNote(raw, path, vaultIndex);
    }

    manuscripts = vaultIndex.getManuscripts();
    expect(manuscripts[0]!.chapters.map((c) => c.relativePath)).toEqual(["ch2.md", "ch1.md"]);
  });
});
