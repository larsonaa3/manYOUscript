import type { VaultFileInfo } from "./vault-adapter";

export interface DirEntry {
  name: string;
  isDirectory: boolean;
}

export interface DirReader {
  readDir(path: string): Promise<DirEntry[]>;
  join(...parts: string[]): string;
}

const IGNORED_DIR_NAMES = new Set([".git", "node_modules", ".obsidian"]);

export function isMarkdownFile(name: string): boolean {
  return name.toLowerCase().endsWith(".md") && !name.startsWith(".");
}

export async function walkMarkdownFiles(
  reader: DirReader,
  rootPath: string,
): Promise<VaultFileInfo[]> {
  const results: VaultFileInfo[] = [];

  async function walk(currentPath: string, relativeParts: string[]): Promise<void> {
    const entries = await reader.readDir(currentPath);
    for (const entry of entries) {
      if (entry.name.startsWith(".") || IGNORED_DIR_NAMES.has(entry.name)) {
        continue;
      }
      const entryPath = reader.join(currentPath, entry.name);
      const entryRelativeParts = [...relativeParts, entry.name];
      if (entry.isDirectory) {
        await walk(entryPath, entryRelativeParts);
      } else if (isMarkdownFile(entry.name)) {
        results.push({
          path: entryPath,
          name: entry.name,
          relativePath: entryRelativeParts.join("/"),
        });
      }
    }
  }

  await walk(rootPath, []);
  results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return results;
}
