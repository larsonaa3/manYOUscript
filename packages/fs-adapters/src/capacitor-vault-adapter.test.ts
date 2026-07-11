import { describe, expect, it, vi, beforeEach } from "vitest";

const { readdirMock, readFileMock, writeFileMock, mkdirMock } = vi.hoisted(() => ({
  readdirMock: vi.fn(),
  readFileMock: vi.fn(),
  writeFileMock: vi.fn(),
  mkdirMock: vi.fn(),
}));

vi.mock("@capacitor/filesystem", () => ({
  Directory: { Documents: "DOCUMENTS" },
  Encoding: { UTF8: "utf8" },
  Filesystem: {
    readdir: readdirMock,
    readFile: readFileMock,
    writeFile: writeFileMock,
    mkdir: mkdirMock,
  },
}));

const { CapacitorVaultAdapter } = await import("./capacitor-vault-adapter");

describe("CapacitorVaultAdapter", () => {
  beforeEach(() => {
    readdirMock.mockReset();
    readFileMock.mockReset();
    writeFileMock.mockReset();
    mkdirMock.mockReset();
  });

  it("pickVaultRoot ensures the fixed vault directory exists and returns its name", async () => {
    mkdirMock.mockResolvedValue(undefined);
    const adapter = new CapacitorVaultAdapter();
    const root = await adapter.pickVaultRoot();
    expect(root).toBe("manyouscript-vault");
    expect(mkdirMock).toHaveBeenCalledWith({
      path: "manyouscript-vault",
      directory: "DOCUMENTS",
      recursive: true,
    });
  });

  it("pickVaultRoot still succeeds if mkdir rejects because the folder already exists", async () => {
    mkdirMock.mockRejectedValue(new Error("Directory exists"));
    const adapter = new CapacitorVaultAdapter();
    await expect(adapter.pickVaultRoot()).resolves.toBe("manyouscript-vault");
  });

  it("listMarkdownFiles walks the vault directory via the Filesystem plugin", async () => {
    readdirMock.mockImplementation(async ({ path }: { path: string }) => {
      if (path === "manyouscript-vault") {
        return {
          files: [
            { name: "intro.md", type: "file" },
            { name: "chapters", type: "directory" },
          ],
        };
      }
      if (path === "manyouscript-vault/chapters") {
        return { files: [{ name: "one.md", type: "file" }] };
      }
      return { files: [] };
    });

    const adapter = new CapacitorVaultAdapter();
    const files = await adapter.listMarkdownFiles("manyouscript-vault");
    expect(files.map((f) => f.relativePath)).toEqual(["chapters/one.md", "intro.md"]);
  });

  it("readFile returns the file's string contents", async () => {
    readFileMock.mockResolvedValue({ data: "# Hello" });
    const adapter = new CapacitorVaultAdapter();
    const content = await adapter.readFile("manyouscript-vault/intro.md");
    expect(content).toBe("# Hello");
    expect(readFileMock).toHaveBeenCalledWith({
      path: "manyouscript-vault/intro.md",
      directory: "DOCUMENTS",
      encoding: "utf8",
    });
  });

  it("readFile reads Blob-shaped results (web fallback) via text()", async () => {
    readFileMock.mockResolvedValue({ data: new Blob(["blob content"]) });
    const adapter = new CapacitorVaultAdapter();
    const content = await adapter.readFile("manyouscript-vault/intro.md");
    expect(content).toBe("blob content");
  });

  it("writeFile writes UTF8 contents with recursive parent creation", async () => {
    writeFileMock.mockResolvedValue({ uri: "file:///whatever" });
    const adapter = new CapacitorVaultAdapter();
    await adapter.writeFile("manyouscript-vault/intro.md", "# Updated");
    expect(writeFileMock).toHaveBeenCalledWith({
      path: "manyouscript-vault/intro.md",
      directory: "DOCUMENTS",
      data: "# Updated",
      encoding: "utf8",
      recursive: true,
    });
  });
});
