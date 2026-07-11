export interface QuickSwitcherEntry {
  path: string;
  relativePath: string;
}

export function filterFilesByQuery<T extends QuickSwitcherEntry>(files: T[], query: string): T[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return files;
  }
  return files.filter((file) => file.relativePath.toLowerCase().includes(trimmed));
}
