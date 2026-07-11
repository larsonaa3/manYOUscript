import { walkMarkdownFiles, type VaultAdapter, type VaultFileInfo } from "@manyouscript/data-layer";
import { HandleDirReader } from "./handle-dir-reader";

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

export class BrowserFsaVaultAdapter implements VaultAdapter {
  private rootHandle: FileSystemDirectoryHandle | null = null;
  private reader: HandleDirReader | null = null;

  async pickVaultRoot(): Promise<string | null> {
    if (!isFileSystemAccessSupported()) {
      throw new Error(
        "This browser doesn't support the File System Access API. Try Chrome or Edge, or use the desktop app.",
      );
    }
    try {
      const handle = await window.showDirectoryPicker({ mode: "readwrite" });
      this.rootHandle = handle;
      return handle.name;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return null;
      }
      throw error;
    }
  }

  async listMarkdownFiles(_rootPath: string): Promise<VaultFileInfo[]> {
    if (!this.rootHandle) {
      throw new Error("No vault folder selected.");
    }
    this.reader = new HandleDirReader(this.rootHandle);
    return walkMarkdownFiles(this.reader, "");
  }

  async readFile(path: string): Promise<string> {
    const handle = this.reader?.getFileHandle(path);
    if (!handle) {
      throw new Error(`Unknown file: "${path}"`);
    }
    const file = await handle.getFile();
    return file.text();
  }

  async writeFile(path: string, contents: string): Promise<void> {
    const handle = this.reader?.getFileHandle(path);
    if (!handle) {
      throw new Error(`Unknown file: "${path}"`);
    }
    const writable = await handle.createWritable();
    await writable.write(contents);
    await writable.close();
  }
}
