import { load as loadYaml, dump as dumpYaml } from "js-yaml";

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export interface SplitNote {
  frontmatter: Record<string, unknown>;
  body: string;
}

export function splitFrontmatter(raw: string): SplitNote {
  const match = raw.match(FRONTMATTER_PATTERN);
  if (!match) {
    return { frontmatter: {}, body: raw };
  }
  const parsed = loadYaml(match[1]);
  return {
    frontmatter: parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {},
    body: raw.slice(match[0].length),
  };
}

export function joinFrontmatter(frontmatter: Record<string, unknown>, body: string): string {
  if (Object.keys(frontmatter).length === 0) {
    return body;
  }
  return `---\n${dumpYaml(frontmatter).trimEnd()}\n---\n${body}`;
}
