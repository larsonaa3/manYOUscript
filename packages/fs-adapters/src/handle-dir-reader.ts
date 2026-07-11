import type { DirEntry, DirReader } from "@manyouscript/data-layer";

/**
 * Adapts a FileSystemDirectoryHandle tree to the generic DirReader
 * interface, so the existing (already-tested) walkMarkdownFiles logic
 * can be reused for the File System Access API instead of duplicating
 * a second traversal implementation.
 *
 * The File System Access API has no way to re-open a subdirectory from
 * a path string, only by walking down from a handle you already hold -
 * so this keeps a path -> handle map, populated incrementally as each
 * directory is listed, which is always populated in time because
 * walkMarkdownFiles only calls readDir(childPath) after first
 * discovering childPath via its parent's readDir call.
 */
export class HandleDirReader implements DirReader {
  private dirHandles = new Map<string, FileSystemDirectoryHandle>();
  private fileHandles = new Map<string, FileSystemFileHandle>();

  constructor(root: FileSystemDirectoryHandle) {
    this.dirHandles.set("", root);
  }

  async readDir(path: string): Promise<DirEntry[]> {
    const dirHandle = this.dirHandles.get(path);
    if (!dirHandle) {
      throw new Error(`Unknown directory: "${path}"`);
    }
    const entries: DirEntry[] = [];
    for await (const [name, handle] of dirHandle.entries()) {
      const childPath = this.join(path, name);
      if (handle.kind === "directory") {
        this.dirHandles.set(childPath, handle);
      } else {
        this.fileHandles.set(childPath, handle);
      }
      entries.push({ name, isDirectory: handle.kind === "directory" });
    }
    return entries;
  }

  join(...parts: string[]): string {
    return parts.filter((part) => part.length > 0).join("/");
  }

  getFileHandle(path: string): FileSystemFileHandle | undefined {
    return this.fileHandles.get(path);
  }
}
