import type { VaultFileInfo } from "@manyouscript/data-layer";

export interface FileTreeFolderNode {
  type: "folder";
  name: string;
  /** Folder path relative to the vault root, using forward slashes. */
  path: string;
  children: FileTreeNode[];
}

export interface FileTreeFileNode {
  type: "file";
  name: string;
  file: VaultFileInfo;
}

export type FileTreeNode = FileTreeFolderNode | FileTreeFileNode;

function sortNodes(nodes: FileTreeNode[]): FileTreeNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

function sortRecursive(node: FileTreeFolderNode): void {
  node.children = sortNodes(node.children);
  for (const child of node.children) {
    if (child.type === "folder") {
      sortRecursive(child);
    }
  }
}

/** Groups a flat vault file list into a nested folder tree, mirroring each file's relativePath. */
export function buildFileTree(files: VaultFileInfo[]): FileTreeNode[] {
  const root: FileTreeFolderNode = { type: "folder", name: "", path: "", children: [] };

  for (const file of files) {
    const segments = file.relativePath.split("/").filter(Boolean);
    let current = root;
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i]!;
      const folderPath = segments.slice(0, i + 1).join("/");
      let next = current.children.find(
        (child): child is FileTreeFolderNode => child.type === "folder" && child.name === segment,
      );
      if (!next) {
        next = { type: "folder", name: segment, path: folderPath, children: [] };
        current.children.push(next);
      }
      current = next;
    }
    const fileName = segments[segments.length - 1] ?? file.name;
    current.children.push({ type: "file", name: fileName, file });
  }

  sortRecursive(root);
  return root.children;
}
