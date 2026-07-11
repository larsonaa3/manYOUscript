export interface FileRecord {
  path: string;
  relativePath: string;
  title: string;
  frontmatter: Record<string, unknown>;
}

export interface LinkRecord {
  sourcePath: string;
  targetTitle: string;
  targetPath: string | null;
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
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
