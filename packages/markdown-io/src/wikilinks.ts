const WIKILINK_PATTERN = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]+)?\]\]/g;

export function extractWikilinkTargets(body: string): string[] {
  const targets: string[] = [];
  const pattern = new RegExp(WIKILINK_PATTERN);
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    targets.push(match[1].trim());
  }
  return targets;
}
