import { isMarkdownFile } from "@manyouscript/data-layer";

export interface FileLike {
  name: string;
  webkitRelativePath: string;
  text(): Promise<string>;
}

export interface FileMapResult {
  rootName: string;
  files: Map<string, string>;
}

/**
 * Groups a flat FileList-like collection (as produced by an
 * <input webkitdirectory> picker) into vault-relative markdown file
 * paths, stripping the top-level folder name that webkitRelativePath
 * includes for every entry.
 */
export async function buildFileMap(inputFiles: readonly FileLike[]): Promise<FileMapResult> {
  const files = new Map<string, string>();
  let rootName = "vault";

  for (const file of inputFiles) {
    const relativePath = file.webkitRelativePath || file.name;
    const parts = relativePath.split("/");
    if (parts.length > 1) {
      rootName = parts[0]!;
    }
    const innerPath = parts.length > 1 ? parts.slice(1).join("/") : parts[0]!;
    if (!isMarkdownFile(file.name)) {
      continue;
    }
    files.set(innerPath, await file.text());
  }

  return { rootName, files };
}
