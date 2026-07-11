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
      { sourcePath: "/vault/chapter-one.md", targetTitle: "Aria", targetPath: "/vault/aria.md" },
    ]);
  });

  it("creates a ghost node for a link to a file that doesn't exist yet", () => {
    const index = new VaultIndex();
    index.setFile(file("/vault/chapter-one.md", "Chapter One"), ["Riverbend"]);

    const graph = index.getGraph();
    const ghost = graph.nodes.find((n) => n.label === "Riverbend");
    expect(ghost).toBeDefined();
    expect(ghost?.path).toBeNull();
    expect(graph.edges).toEqual([{ source: "/vault/chapter-one.md", target: ghost?.id }]);
  });

  it("upgrades a ghost link to a real edge once the target file is added", () => {
    const index = new VaultIndex();
    index.setFile(file("/vault/chapter-one.md", "Chapter One"), ["Riverbend"]);
    expect(index.getGraph().nodes.some((n) => n.path === "/vault/riverbend.md")).toBe(false);

    index.setFile(file("/vault/riverbend.md", "Riverbend"), []);

    const backlinks = index.getBacklinks("/vault/riverbend.md");
    expect(backlinks).toEqual([
      { sourcePath: "/vault/chapter-one.md", targetTitle: "Riverbend", targetPath: "/vault/riverbend.md" },
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
});
