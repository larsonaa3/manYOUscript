import { Filesystem, Directory } from "@capacitor/filesystem";
import type { DirEntry, DirReader } from "@manyouscript/data-layer";

/** Adapts @capacitor/filesystem's readdir to the generic DirReader interface. */
export class CapacitorDirReader implements DirReader {
  constructor(private readonly directory: Directory) {}

  async readDir(path: string): Promise<DirEntry[]> {
    const result = await Filesystem.readdir({ path, directory: this.directory });
    return result.files.map((file) => ({ name: file.name, isDirectory: file.type === "directory" }));
  }

  join(...parts: string[]): string {
    return parts.filter((part) => part.length > 0).join("/");
  }
}
