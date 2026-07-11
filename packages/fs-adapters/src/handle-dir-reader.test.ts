import { describe, expect, it } from "vitest";
import { walkMarkdownFiles } from "@manyouscript/data-layer";
import { HandleDirReader } from "./handle-dir-reader";

interface FakeEntry {
  kind: "file" | "directory";
  name: string;
  children?: FakeEntry[];
}

function makeFakeDirHandle(entries: FakeEntry[]): FileSystemDirectoryHandle {
  return {
    kind: "directory",
    async *entries() {
      for (const entry of entries) {
        if (entry.kind === "directory") {
          yield [entry.name, makeFakeDirHandle(entry.children ?? [])];
        } else {
          yield [entry.name, { kind: "file", name: entry.name } as unknown as FileSystemFileHandle];
        }
      }
    },
  } as unknown as FileSystemDirectoryHandle;
}

describe("HandleDirReader", () => {
  it("walks a nested handle tree via the shared walkMarkdownFiles logic", async () => {
    const root = makeFakeDirHandle([
      { kind: "file", name: "intro.md" },
      { kind: "file", name: "cover.png" },
      {
        kind: "directory",
        name: "chapters",
        children: [
          { kind: "file", name: "one.md" },
          { kind: "directory", name: ".git", children: [{ kind: "file", name: "config" }] },
        ],
      },
    ]);

    const reader = new HandleDirReader(root);
    const files = await walkMarkdownFiles(reader, "");

    expect(files.map((f) => f.relativePath)).toEqual(["chapters/one.md", "intro.md"]);
    expect(files.map((f) => f.path)).toEqual(["chapters/one.md", "intro.md"]);
  });

  it("exposes file handles for reading/writing after a directory has been listed", async () => {
    const root = makeFakeDirHandle([{ kind: "file", name: "intro.md" }]);
    const reader = new HandleDirReader(root);
    await walkMarkdownFiles(reader, "");

    const handle = reader.getFileHandle("intro.md");
    expect(handle).toBeDefined();
    expect(handle?.name).toBe("intro.md");
  });

  it("returns undefined for a file handle that was never discovered", async () => {
    const reader = new HandleDirReader(makeFakeDirHandle([]));
    await walkMarkdownFiles(reader, "");
    expect(reader.getFileHandle("nonexistent.md")).toBeUndefined();
  });
});
