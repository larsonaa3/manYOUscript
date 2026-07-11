import { splitFrontmatter, joinFrontmatter } from "./frontmatter";
import { extractWikilinkTargets } from "./wikilinks";

export interface ParsedNote {
  frontmatter: Record<string, unknown>;
  body: string;
  wikilinkTargets: string[];
}

export function parseNote(raw: string): ParsedNote {
  const { frontmatter, body } = splitFrontmatter(raw);
  return {
    frontmatter,
    body,
    wikilinkTargets: extractWikilinkTargets(body),
  };
}

export function stringifyNote(frontmatter: Record<string, unknown>, body: string): string {
  return joinFrontmatter(frontmatter, body);
}

export function deriveTitle(fileName: string, frontmatter: Record<string, unknown>): string {
  const fromFrontmatter = frontmatter.title;
  if (typeof fromFrontmatter === "string" && fromFrontmatter.trim().length > 0) {
    return fromFrontmatter.trim();
  }
  return fileName.replace(/\.md$/i, "");
}
