import type { VaultAdapter } from "@manyouscript/data-layer";
import { BrowserFsaVaultAdapter, isFileSystemAccessSupported } from "./browser-fsa-vault-adapter";
import { FallbackVaultAdapter } from "./fallback-vault-adapter";

export function createWebVaultAdapter(
  hasFileSystemAccess: boolean = isFileSystemAccessSupported(),
): VaultAdapter {
  return hasFileSystemAccess ? new BrowserFsaVaultAdapter() : new FallbackVaultAdapter();
}
