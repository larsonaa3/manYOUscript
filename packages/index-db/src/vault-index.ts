import type { FileRecord, LinkRecord, Graph, GraphNode } from "./types";

export class VaultIndex {
  private files = new Map<string, FileRecord>();
  private linksBySource = new Map<string, LinkRecord[]>();

  setFile(record: FileRecord, wikilinkTargets: string[]): void {
    this.files.set(record.path, record);
    this.linksBySource.set(
      record.path,
      wikilinkTargets.map((targetTitle) => ({ sourcePath: record.path, targetTitle, targetPath: null })),
    );
    this.resolveLinks();
  }

  removeFile(path: string): void {
    this.files.delete(path);
    this.linksBySource.delete(path);
    this.resolveLinks();
  }

  getFile(path: string): FileRecord | undefined {
    return this.files.get(path);
  }

  getAllFiles(): FileRecord[] {
    return [...this.files.values()];
  }

  findPathByTitle(title: string): string | null {
    const normalized = title.trim().toLowerCase();
    for (const file of this.files.values()) {
      if (file.title.toLowerCase() === normalized) {
        return file.path;
      }
    }
    return null;
  }

  private resolveLinks(): void {
    for (const links of this.linksBySource.values()) {
      for (const link of links) {
        link.targetPath = this.findPathByTitle(link.targetTitle);
      }
    }
  }

  getBacklinks(path: string): LinkRecord[] {
    return this.getAllLinks().filter((link) => link.targetPath === path);
  }

  getAllLinks(): LinkRecord[] {
    return [...this.linksBySource.values()].flat();
  }

  getGraph(): Graph {
    const nodes: GraphNode[] = [...this.files.values()].map((file) => ({
      id: file.path,
      label: file.title,
      path: file.path,
    }));

    const ghostNodes = new Map<string, GraphNode>();
    const edges: Graph["edges"] = [];

    for (const link of this.getAllLinks()) {
      if (link.targetPath) {
        edges.push({ source: link.sourcePath, target: link.targetPath });
        continue;
      }
      const ghostId = `ghost:${link.targetTitle.trim().toLowerCase()}`;
      if (!ghostNodes.has(ghostId)) {
        ghostNodes.set(ghostId, { id: ghostId, label: link.targetTitle, path: null });
      }
      edges.push({ source: link.sourcePath, target: ghostId });
    }

    return { nodes: [...nodes, ...ghostNodes.values()], edges };
  }
}
