import { open } from "@tauri-apps/plugin-dialog";
import { readDir, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { walkMarkdownFiles, type DirEntry, type VaultAdapter, type VaultFileInfo } from "@manyouscript/data-layer";

function joinPath(...parts: string[]): string {
  return parts
    .map((part) => part.replace(/\/+$/, ""))
    .filter((part) => part.length > 0)
    .join("/");
}

export class TauriVaultAdapter implements VaultAdapter {
  async pickVaultRoot(): Promise<string | null> {
    const selection = await open({ directory: true, multiple: false });
    if (Array.isArray(selection)) {
      return selection[0] ?? null;
    }
    return selection;
  }

  async listMarkdownFiles(rootPath: string): Promise<VaultFileInfo[]> {
    return walkMarkdownFiles(
      {
        async readDir(path: string): Promise<DirEntry[]> {
          const entries = await readDir(path);
          return entries.map((entry) => ({
            name: entry.name ?? "",
            isDirectory: entry.isDirectory,
          }));
        },
        join: joinPath,
      },
      rootPath,
    );
  }

  async readFile(path: string): Promise<string> {
    return readTextFile(path);
  }

  async writeFile(path: string, contents: string): Promise<void> {
    await writeTextFile(path, contents);
  }
}
