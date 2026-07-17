export interface VaultFileInfo {
  /** Absolute path on disk. */
  path: string;
  /** File name including extension. */
  name: string;
  /** Path relative to the vault root, using forward slashes. */
  relativePath: string;
}

export type VaultRootRestoreResult =
  | { status: "restored"; root: string }
  | { status: "needs-permission"; name: string }
  | { status: "none" };

export interface VaultAdapter {
  pickVaultRoot(): Promise<string | null>;
  listMarkdownFiles(rootPath: string): Promise<VaultFileInfo[]>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, contents: string): Promise<void>;
  /**
   * Optional: silently try to reopen a previously-picked vault with no
   * user gesture. Only meaningful for adapters (the browser File System
   * Access API) whose granted access can outlive a page reload but still
   * needs re-verifying; "needs-permission" means a handle was found but
   * the browser requires an explicit click (via reconnectVaultRoot)
   * before it will hand back access.
   */
  tryRestoreVaultRoot?(): Promise<VaultRootRestoreResult>;
  /**
   * Optional: re-request permission for the handle tryRestoreVaultRoot
   * last reported as "needs-permission". Must be invoked directly from a
   * user gesture (e.g. a button's onClick) - browsers require an active
   * user-activation window for this prompt to succeed.
   */
  reconnectVaultRoot?(): Promise<string | null>;
}
