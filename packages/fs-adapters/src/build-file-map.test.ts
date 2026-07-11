import { describe, expect, it } from "vitest";
import { buildFileMap, type FileLike } from "./build-file-map";

function fakeFile(webkitRelativePath: string, content: string): FileLike {
  const name = webkitRelativePath.split("/").pop()!;
  return { name, webkitRelativePath, text: async () => content };
}

describe("buildFileMap", () => {
  it("strips the top-level folder name and keeps only markdown files", async () => {
    const { rootName, files } = await buildFileMap([
      fakeFile("MyVault/intro.md", "# Intro"),
      fakeFile("MyVault/cover.png", "binary"),
      fakeFile("MyVault/chapters/one.md", "# Chapter One"),
    ]);

    expect(rootName).toBe("MyVault");
    expect([...files.keys()].sort()).toEqual(["chapters/one.md", "intro.md"]);
    expect(files.get("intro.md")).toBe("# Intro");
    expect(files.get("chapters/one.md")).toBe("# Chapter One");
  });

  it("returns an empty map for an empty file list", async () => {
    const { files } = await buildFileMap([]);
    expect(files.size).toBe(0);
  });

  it("falls back to the file name as root when webkitRelativePath is empty", async () => {
    const { rootName, files } = await buildFileMap([{ name: "solo.md", webkitRelativePath: "", text: async () => "content" }]);
    expect(rootName).toBe("vault");
    expect([...files.keys()]).toEqual(["solo.md"]);
  });
});
