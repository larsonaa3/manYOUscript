import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { walkMarkdownFiles, isMarkdownFile, type DirReader } from "./walk-markdown-files";

const nodeDirReader: DirReader = {
  async readDir(path: string) {
    const entries = await readdir(path, { withFileTypes: true });
    return entries.map((entry) => ({ name: entry.name, isDirectory: entry.isDirectory() }));
  },
  join: (...parts: string[]) => join(...parts),
};

describe("isMarkdownFile", () => {
  it("accepts .md files and rejects others", () => {
    expect(isMarkdownFile("chapter-one.md")).toBe(true);
    expect(isMarkdownFile("Notes.MD")).toBe(true);
    expect(isMarkdownFile("image.png")).toBe(false);
    expect(isMarkdownFile(".hidden.md")).toBe(false);
  });
});

describe("walkMarkdownFiles", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "manyouscript-vault-"));
    await writeFile(join(root, "intro.md"), "# Intro");
    await mkdir(join(root, "chapters"));
    await writeFile(join(root, "chapters", "one.md"), "# Chapter One");
    await mkdir(join(root, ".git"));
    await writeFile(join(root, ".git", "config"), "should be ignored");
    await writeFile(join(root, "cover.png"), "not markdown");
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("recursively finds markdown files, ignoring non-markdown and dotfiles/dirs", async () => {
    const files = await walkMarkdownFiles(nodeDirReader, root);
    expect(files.map((f) => f.relativePath)).toEqual(["chapters/one.md", "intro.md"]);
  });

  it("computes absolute path and file name for each entry", async () => {
    const files = await walkMarkdownFiles(nodeDirReader, root);
    const intro = files.find((f) => f.relativePath === "intro.md");
    expect(intro).toBeDefined();
    expect(intro?.name).toBe("intro.md");
    expect(intro?.path).toBe(join(root, "intro.md"));
  });
});
