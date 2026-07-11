import type { FileRecord, LinkRecord, LinkInput, Graph, GraphNode, Manuscript } from "./types";

function normalizeLinkInput(link: LinkInput): { targetTitle: string; kind: string } {
  return typeof link === "string" ? { targetTitle: link, kind: "wikilink" } : link;
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase();
}

export class VaultIndex {
  private files = new Map<string, FileRecord>();
  private linksBySource = new Map<string, LinkRecord[]>();
  /** Normalized title -> path, kept in sync incrementally so lookups are O(1). */
  private titleIndex = new Map<string, string>();
  /** Normalized target title -> set of source paths with a link to it, so a
   * rename only has to re-resolve the links actually affected by it rather
   * than every link in the vault. */
  private linksByTargetTitle = new Map<string, Set<string>>();

  setFile(record: FileRecord, links: LinkInput[]): void {
    const previous = this.files.get(record.path);
    const previousTitleKey = previous ? normalizeTitle(previous.title) : null;
    const newTitleKey = normalizeTitle(record.title);

    const previousLinks = this.linksBySource.get(record.path);
    if (previousLinks) {
      for (const link of previousLinks) {
        this.removeFromTargetIndex(link.targetTitle, record.path);
      }
    }

    this.files.set(record.path, record);

    if (previousTitleKey && previousTitleKey !== newTitleKey) {
      if (this.titleIndex.get(previousTitleKey) === record.path) {
        this.titleIndex.delete(previousTitleKey);
      }
    }
    this.titleIndex.set(newTitleKey, record.path);

    const newLinks: LinkRecord[] = links.map((link) => {
      const { targetTitle, kind } = normalizeLinkInput(link);
      this.addToTargetIndex(targetTitle, record.path);
      return { sourcePath: record.path, targetTitle, targetPath: null, kind };
    });
    this.linksBySource.set(record.path, newLinks);

    this.resolveLinksForFile(record.path);
    if (previousTitleKey && previousTitleKey !== newTitleKey) {
      this.resolveLinksTargeting(previousTitleKey);
    }
    this.resolveLinksTargeting(newTitleKey);
  }

  removeFile(path: string): void {
    const existing = this.files.get(path);
    const links = this.linksBySource.get(path);
    if (links) {
      for (const link of links) {
        this.removeFromTargetIndex(link.targetTitle, path);
      }
    }
    this.files.delete(path);
    this.linksBySource.delete(path);

    if (existing) {
      const titleKey = normalizeTitle(existing.title);
      if (this.titleIndex.get(titleKey) === path) {
        this.titleIndex.delete(titleKey);
      }
      this.resolveLinksTargeting(titleKey);
    }
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

  getManuscripts(): Manuscript[] {
    const groups = new Map<string, FileRecord[]>();
    for (const file of this.files.values()) {
      const manuscript = file.frontmatter.manuscript;
      if (typeof manuscript !== "string" || manuscript.trim().length === 0) {
        continue;
      }
      const list = groups.get(manuscript) ?? [];
      list.push(file);
      groups.set(manuscript, list);
    }

    const manuscripts: Manuscript[] = [];
    for (const [name, chapters] of groups) {
      const sorted = [...chapters].sort((a, b) => {
        const orderA = typeof a.frontmatter.order === "number" ? a.frontmatter.order : Number.POSITIVE_INFINITY;
        const orderB = typeof b.frontmatter.order === "number" ? b.frontmatter.order : Number.POSITIVE_INFINITY;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.relativePath.localeCompare(b.relativePath);
      });
      const totalWordCount = sorted.reduce((sum, f) => sum + (f.wordCount ?? 0), 0);
      manuscripts.push({ name, chapters: sorted, totalWordCount });
    }
    manuscripts.sort((a, b) => a.name.localeCompare(b.name));
    return manuscripts;
  }

  findPathByTitle(title: string): string | null {
    return this.titleIndex.get(normalizeTitle(title)) ?? null;
  }

  private resolveLinksForFile(path: string): void {
    const links = this.linksBySource.get(path);
    if (!links) {
      return;
    }
    for (const link of links) {
      link.targetPath = this.findPathByTitle(link.targetTitle);
    }
  }

  private resolveLinksTargeting(titleKey: string): void {
    const sources = this.linksByTargetTitle.get(titleKey);
    if (!sources) {
      return;
    }
    const resolved = this.titleIndex.get(titleKey) ?? null;
    for (const sourcePath of sources) {
      const links = this.linksBySource.get(sourcePath);
      if (!links) {
        continue;
      }
      for (const link of links) {
        if (normalizeTitle(link.targetTitle) === titleKey) {
          link.targetPath = resolved;
        }
      }
    }
  }

  private addToTargetIndex(targetTitle: string, sourcePath: string): void {
    const key = normalizeTitle(targetTitle);
    let sources = this.linksByTargetTitle.get(key);
    if (!sources) {
      sources = new Set();
      this.linksByTargetTitle.set(key, sources);
    }
    sources.add(sourcePath);
  }

  private removeFromTargetIndex(targetTitle: string, sourcePath: string): void {
    const key = normalizeTitle(targetTitle);
    const sources = this.linksByTargetTitle.get(key);
    if (!sources) {
      return;
    }
    sources.delete(sourcePath);
    if (sources.size === 0) {
      this.linksByTargetTitle.delete(key);
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
      const ghostId = `ghost:${normalizeTitle(link.targetTitle)}`;
      if (!ghostNodes.has(ghostId)) {
        ghostNodes.set(ghostId, { id: ghostId, label: link.targetTitle, path: null });
      }
      edges.push({ source: link.sourcePath, target: ghostId, kind: link.kind });
    }

    return { nodes: [...nodes, ...ghostNodes.values()], edges };
  }
}
