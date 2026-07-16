import { describe, expect, it } from "vitest";
import { buildFileTree, type FileTreeNode } from "./file-tree";
import type { VaultFileInfo } from "@manyouscript/data-layer";

function file(relativePath: string): VaultFileInfo {
  const name = relativePath.split("/").pop()!;
  return { path: `/vault/${relativePath}`, name, relativePath };
}

function shape(nodes: FileTreeNode[]): unknown {
  return nodes.map((node) =>
    node.type === "folder" ? { folder: node.name, children: shape(node.children) } : { file: node.name },
  );
}

describe("buildFileTree", () => {
  it("keeps root-level files flat", () => {
    const tree = buildFileTree([file("note-a.md"), file("note-b.md")]);
    expect(shape(tree)).toEqual([{ file: "note-a.md" }, { file: "note-b.md" }]);
  });

  it("groups nested files under folder nodes", () => {
    const tree = buildFileTree([file("characters/aria.md"), file("characters/bram.md"), file("intro.md")]);
    expect(shape(tree)).toEqual([
      { folder: "characters", children: [{ file: "aria.md" }, { file: "bram.md" }] },
      { file: "intro.md" },
    ]);
  });

  it("builds multi-level nesting and reuses folder nodes across files", () => {
    const tree = buildFileTree([
      file("campaign/sessions/session-1.md"),
      file("campaign/sessions/session-2.md"),
      file("campaign/npcs/mara.md"),
    ]);
    expect(shape(tree)).toEqual([
      {
        folder: "campaign",
        children: [
          { folder: "npcs", children: [{ file: "mara.md" }] },
          { folder: "sessions", children: [{ file: "session-1.md" }, { file: "session-2.md" }] },
        ],
      },
    ]);
  });

  it("sorts folders before files, alphabetically within each group", () => {
    const tree = buildFileTree([file("zzz.md"), file("aaa/nested.md"), file("aaa.md")]);
    expect(shape(tree)).toEqual([
      { folder: "aaa", children: [{ file: "nested.md" }] },
      { file: "aaa.md" },
      { file: "zzz.md" },
    ]);
  });

  it("attaches the original VaultFileInfo to file nodes", () => {
    const info = file("notes/a.md");
    const tree = buildFileTree([info]);
    const folder = tree[0];
    if (folder?.type !== "folder") throw new Error("expected a folder node");
    const leaf = folder.children[0];
    if (leaf?.type !== "file") throw new Error("expected a file node");
    expect(leaf.file).toEqual(info);
  });

  it("returns an empty tree for no files", () => {
    expect(buildFileTree([])).toEqual([]);
  });
});
