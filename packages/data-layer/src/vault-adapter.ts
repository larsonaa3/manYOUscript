export interface VaultFileInfo {
  /** Absolute path on disk. */
  path: string;
  /** File name including extension. */
  name: string;
  /** Path relative to the vault root, using forward slashes. */
  relativePath: string;
}

export interface VaultAdapter {
  pickVaultRoot(): Promise<string | null>;
  listMarkdownFiles(rootPath: string): Promise<VaultFileInfo[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, contents: string): Promise<void>;
}
