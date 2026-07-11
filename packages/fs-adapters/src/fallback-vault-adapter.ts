import type { VaultAdapter, VaultFileInfo } from "@manyouscript/data-layer";
import { buildFileMap } from "./build-file-map";

/**
 * Fallback for browsers without the File System Access API (Safari,
 * Firefox): reads a folder's files once via a plain <input type="file"
 * webkitdirectory> picker (broadly supported, read-only) into memory,
 * and "writes" by triggering a browser download of the changed file so
 * the user can manually save it back over the original - there is no
 * live disk sync in this mode, by design (see architecture notes on
 * File System Access API browser support gaps).
 */
export class FallbackVaultAdapter implements VaultAdapter {
  private files = new Map<string, string>();

  async pickVaultRoot(): Promise<string | null> {
    const fileList = await promptForDirectoryFiles();
    if (!fileList || fileList.length === 0) {
      return null;
    }
    const { rootName, files } = await buildFileMap(Array.from(fileList));
    this.files = files;
    return rootName;
  }

  async listMarkdownFiles(_rootPath: string): Promise<VaultFileInfo[]> {
    return [...this.files.keys()]
      .map((path) => ({
        path,
        name: path.split("/").pop() ?? path,
        relativePath: path,
      }))
      .sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }

  async readFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (content === undefined) {
      throw new Error(`Unknown file: "${path}"`);
    }
    return content;
  }

  async writeFile(path: string, contents: string): Promise<void> {
    this.files.set(path, contents);
    downloadFile(path.split("/").pop() ?? path, contents);
  }
}

function promptForDirectoryFiles(): Promise<FileList | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.setAttribute("webkitdirectory", "");
    input.multiple = true;
    input.style.display = "none";

    let settled = false;
    const cleanup = () => {
      input.remove();
    };
    input.addEventListener("change", () => {
      settled = true;
      resolve(input.files);
      cleanup();
    });
    input.addEventListener("cancel", () => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
      cleanup();
    });

    document.body.appendChild(input);
    input.click();
  });
}

function downloadFile(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
