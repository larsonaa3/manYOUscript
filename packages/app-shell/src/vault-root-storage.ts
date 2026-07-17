export const VAULT_ROOT_STORAGE_KEY = "manyouscript-last-vault-root";

export function readStoredVaultRoot(storage: Pick<Storage, "getItem">): string | null {
  return storage.getItem(VAULT_ROOT_STORAGE_KEY);
}

export function writeStoredVaultRoot(storage: Pick<Storage, "setItem">, root: string): void {
  storage.setItem(VAULT_ROOT_STORAGE_KEY, root);
}

export function clearStoredVaultRoot(storage: Pick<Storage, "removeItem">): void {
  storage.removeItem(VAULT_ROOT_STORAGE_KEY);
}
