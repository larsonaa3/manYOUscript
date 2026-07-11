import type { FileRecord, LinkRecord, LinkInput, Graph, GraphNode } from "./types";

function normalizeLinkInput(link: LinkInput): { targetTitle: string; kind: string } {
  return typeof link === "string" ? { targetTitle: link, kind: "wikilink" } : link;
}

export class VaultIndex {
  private files = new Map<string, FileRecord>();
  private linksBySource = new Map<string, LinkRecord[]>();

  setFile(record: FileRecord, links: LinkInput[]): void {
    this.files.set(record.path, record);
    this.linksBySource.set(
      record.path,
      links.map((link) => {
        const { targetTitle, kind } = normalizeLinkInput(link);
        return { sourcePath: record.path, targetTitle, targetPath: null, kind };
      }),
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

  getEntities(): FileRecord[] {
    return this.getAllFiles().filter((file) => Boolean(file.entitySchemaId));
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
        edges.push({ source: link.sourcePath, target: link.targetPath, kind: link.kind });
        continue;
      }
      const ghostId = `ghost:${link.targetTitle.trim().toLowerCase()}`;
      if (!ghostNodes.has(ghostId)) {
        ghostNodes.set(ghostId, { id: ghostId, label: link.targetTitle, path: null });
      }
      edges.push({ source: link.sourcePath, target: ghostId, kind: link.kind });
    }

    return { nodes: [...nodes, ...ghostNodes.values()], edges };
  }
}
