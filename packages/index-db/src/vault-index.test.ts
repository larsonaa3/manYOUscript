import { describe, expect, it } from "vitest";
import { VaultIndex } from "./vault-index";

function file(path: string, title: string) {
  return { path, relativePath: path, title, frontmatter: {} };
}

describe("VaultIndex", () => {
  it("resolves links between two known files and reports backlinks", () => {
    const index = new VaultIndex();
    index.setFile(file("/vault/aria.md", "Aria"), []);
    index.setFile(file("/vault/chapter-one.md", "Chapter One"), ["Aria"]);

    const backlinks = index.getBacklinks("/vault/aria.md");
    expect(backlinks).toEqual([
      {
        sourcePath: "/vault/chapter-one.md",
        targetTitle: "Aria",
        targetPath: "/vault/aria.md",
        kind: "wikilink",
      },
    ]);
  });

  it("creates a ghost node for a link to a file that doesn't exist yet", () => {
    const index = new VaultIndex();
    index.setFile(file("/vault/chapter-one.md", "Chapter One"), ["Riverbend"]);

    const graph = index.getGraph();
    const ghost = graph.nodes.find((n) => n.label === "Riverbend");
    expect(ghost).toBeDefined();
    expect(ghost?.path).toBeNull();
    expect(graph.edges).toEqual([
      { source: "/vault/chapter-one.md", target: ghost?.id, kind: "wikilink" },
    ]);
  });

  it("upgrades a ghost link to a real edge once the target file is added", () => {
    const index = new VaultIndex();
    index.setFile(file("/vault/chapter-one.md", "Chapter One"), ["Riverbend"]);
    expect(index.getGraph().nodes.some((n) => n.path === "/vault/riverbend.md")).toBe(false);

    index.setFile(file("/vault/riverbend.md", "Riverbend"), []);

    const backlinks = index.getBacklinks("/vault/riverbend.md");
    expect(backlinks).toEqual([
      {
        sourcePath: "/vault/chapter-one.md",
        targetTitle: "Riverbend",
        targetPath: "/vault/riverbend.md",
        kind: "wikilink",
      },
    ]);
    const graph = index.getGraph();
    expect(graph.nodes.some((n) => n.label === "Riverbend" && n.path === null)).toBe(false);
  });

  it("removes a file's links when the file is removed", () => {
    const index = new VaultIndex();
    index.setFile(file("/vault/aria.md", "Aria"), []);
    index.setFile(file("/vault/chapter-one.md", "Chapter One"), ["Aria"]);

    index.removeFile("/vault/chapter-one.md");

    expect(index.getBacklinks("/vault/aria.md")).toEqual([]);
    expect(index.getFile("/vault/chapter-one.md")).toBeUndefined();
  });

  it("getAllFiles returns every indexed file", () => {
    const index = new VaultIndex();
    index.setFile(file("/vault/aria.md", "Aria"), []);
    index.setFile(file("/vault/chapter-one.md", "Chapter One"), []);
    expect(index.getAllFiles().map((f) => f.title).sort()).toEqual(["Aria", "Chapter One"]);
  });

  it("title lookup is case-insensitive", () => {
    const index = new VaultIndex();
    index.setFile(file("/vault/aria.md", "Aria"), []);
    expect(index.findPathByTitle("aria")).toBe("/vault/aria.md");
    expect(index.findPathByTitle("ARIA")).toBe("/vault/aria.md");
  });

  it("tracks typed relationship edges alongside plain wikilinks", () => {
    const index = new VaultIndex();
    index.setFile(file("/vault/aria.md", "Aria"), []);
    index.setFile(file("/vault/chapter-one.md", "Chapter One"), [
      "Aria",
      { targetTitle: "Aria", kind: "ally" },
    ]);

    const backlinks = index.getBacklinks("/vault/aria.md");
    expect(backlinks.map((l) => l.kind).sort()).toEqual(["ally", "wikilink"]);

    const graph = index.getGraph();
    const kinds = graph.edges
      .filter((e) => e.source === "/vault/chapter-one.md" && e.target === "/vault/aria.md")
      .map((e) => e.kind)
      .sort();
    expect(kinds).toEqual(["ally", "wikilink"]);
  });

  it("getEntities returns only files with a recognized stat block schema", () => {
    const index = new VaultIndex();
    index.setFile(file("/vault/aria.md", "Aria"), []);
    index.setFile(
      { path: "/vault/goblin.md", relativePath: "goblin.md", title: "Goblin Scout", frontmatter: {}, entitySchemaId: "dnd5e-v1" },
      [],
    );

    const entities = index.getEntities();
    expect(entities.map((e) => e.title)).toEqual(["Goblin Scout"]);
  });

  it("getManuscripts groups chapters by frontmatter.manuscript, sorted by order, with aggregate word counts", () => {
    const index = new VaultIndex();
    index.setFile(
      {
        path: "/vault/ch2.md",
        relativePath: "ch2.md",
        title: "Chapter Two",
        frontmatter: { manuscript: "My Novel", order: 2 },
        wordCount: 500,
      },
      [],
    );
    index.setFile(
      {
        path: "/vault/ch1.md",
        relativePath: "ch1.md",
        title: "Chapter One",
        frontmatter: { manuscript: "My Novel", order: 1 },
        wordCount: 300,
      },
      [],
    );
    index.setFile(file("/vault/unrelated.md", "Unrelated Note"), []);

    const manuscripts = index.getManuscripts();
    expect(manuscripts).toHaveLength(1);
    expect(manuscripts[0]!.name).toBe("My Novel");
    expect(manuscripts[0]!.chapters.map((c) => c.title)).toEqual(["Chapter One", "Chapter Two"]);
    expect(manuscripts[0]!.totalWordCount).toBe(800);
  });

  it("getManuscripts falls back to relativePath ordering when order is missing", () => {
    const index = new VaultIndex();
    index.setFile(
      { path: "/vault/b.md", relativePath: "b.md", title: "B", frontmatter: { manuscript: "Untitled" } },
      [],
    );
    index.setFile(
      { path: "/vault/a.md", relativePath: "a.md", title: "A", frontmatter: { manuscript: "Untitled" } },
      [],
    );

    const [manuscript] = index.getManuscripts();
    expect(manuscript!.chapters.map((c) => c.relativePath)).toEqual(["a.md", "b.md"]);
  });
});
