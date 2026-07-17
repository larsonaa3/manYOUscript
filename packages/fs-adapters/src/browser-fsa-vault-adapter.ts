import {
  walkMarkdownFiles,
  type VaultAdapter,
  type VaultFileInfo,
  type VaultRootRestoreResult,
} from "@manyouscript/data-layer";
import { HandleDirReader } from "./handle-dir-reader";
import { saveVaultRootHandle, loadVaultRootHandle, clearVaultRootHandle } from "./handle-store";

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

export class BrowserFsaVaultAdapter implements VaultAdapter {
  private rootHandle: FileSystemDirectoryHandle | null = null;
  private pendingHandle: FileSystemDirectoryHandle | null = null;
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
      this.pendingHandle = null;
      // Best-effort: a saved handle only powers the same-browser "reconnect
      // on reload" convenience, so a storage failure shouldn't block the
      // user from opening their vault.
      await saveVaultRootHandle(handle).catch(() => {});
      return handle.name;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return null;
      }
      throw error;
    }
  }

  async tryRestoreVaultRoot(): Promise<VaultRootRestoreResult> {
    const handle = await loadVaultRootHandle().catch(() => null);
    if (!handle) {
      return { status: "none" };
    }
    const permission = await handle.queryPermission({ mode: "readwrite" });
    if (permission === "granted") {
      this.rootHandle = handle;
      return { status: "restored", root: handle.name };
    }
    this.pendingHandle = handle;
    return { status: "needs-permission", name: handle.name };
  }

  async reconnectVaultRoot(): Promise<string | null> {
    if (!this.pendingHandle) {
      return null;
    }
    const permission = await this.pendingHandle.requestPermission({ mode: "readwrite" });
    if (permission === "denied") {
      // An explicit decline (as opposed to the prompt just being dismissed)
      // means they don't want to be asked again - stop offering it.
      this.pendingHandle = null;
      await clearVaultRootHandle().catch(() => {});
      return null;
    }
    if (permission !== "granted") {
      return null;
    }
    this.rootHandle = this.pendingHandle;
    const name = this.pendingHandle.name;
    this.pendingHandle = null;
    return name;
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
