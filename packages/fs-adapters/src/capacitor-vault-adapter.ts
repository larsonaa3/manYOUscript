import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { walkMarkdownFiles, type VaultAdapter, type VaultFileInfo } from "@manyouscript/data-layer";
import { CapacitorDirReader } from "./capacitor-dir-reader";

const VAULT_DIRECTORY = Directory.Documents;
const VAULT_SUBDIR = "manyouscript-vault";

/**
 * Mobile has no general filesystem access and no built-in equivalent of
 * the desktop/web "pick any folder" flow without adding a third-party
 * native document-picker plugin, so this adapter works within a single,
 * fixed app-sandboxed directory rather than a user-chosen one.
 *
 * For the vault to actually follow the user across devices, that fixed
 * directory needs to itself live inside an OS-level synced folder
 * (iCloud Drive on iOS, or a synced Android app via Storage Access
 * Framework) - there is no in-app sync in this adapter, matching how
 * Obsidian Mobile relies on the OS's own file sync rather than
 * implementing one itself.
 */
export class CapacitorVaultAdapter implements VaultAdapter {
  private reader = new CapacitorDirReader(VAULT_DIRECTORY);

  async pickVaultRoot(): Promise<string | null> {
    await Filesystem.mkdir({ path: VAULT_SUBDIR, directory: VAULT_DIRECTORY, recursive: true }).catch(() => {
      // Already exists - fine.
    });
    return VAULT_SUBDIR;
  }

  async listMarkdownFiles(rootPath: string): Promise<VaultFileInfo[]> {
    return walkMarkdownFiles(this.reader, rootPath);
  }

  async readFile(path: string): Promise<string> {
    const result = await Filesystem.readFile({ path, directory: VAULT_DIRECTORY, encoding: Encoding.UTF8 });
    if (typeof result.data === "string") {
      return result.data;
    }
    return result.data.text();
  }

  async writeFile(path: string, contents: string): Promise<void> {
    await Filesystem.writeFile({
      path,
      directory: VAULT_DIRECTORY,
      data: contents,
      encoding: Encoding.UTF8,
      recursive: true,
    });
  }
}
