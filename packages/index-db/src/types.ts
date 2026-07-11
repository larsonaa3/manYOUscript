export interface FileRecord {
  path: string;
  relativePath: string;
  title: string;
  frontmatter: Record<string, unknown>;
  /** Schema id of a recognized stat block found in this file, if any (e.g. "dnd5e-v1"). */
  entitySchemaId?: string;
}

/** "wikilink" for plain [[links]]; otherwise the relationship type (e.g. "ally", "enemy"). */
export type LinkInput = string | { targetTitle: string; kind: string };

export interface LinkRecord {
  sourcePath: string;
  targetTitle: string;
  targetPath: string | null;
  kind: string;
}

export interface GraphNode {
  id: string;
  label: string;
  /** Absolute file path, or null for a ghost node (linked but no matching file). */
  path: string | null;
}

export interface GraphEdge {
  source: string;
  target: string;
  kind: string;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
