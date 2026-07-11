const WIKILINK_COLOR = "#bbbbbb";

const KNOWN_KIND_COLORS: Record<string, string> = {
  wikilink: WIKILINK_COLOR,
  ally: "#3aa655",
  enemy: "#d1453d",
  family: "#8854d0",
  rival: "#e08e2c",
};

const FALLBACK_PALETTE = ["#3b82f6", "#ec4899", "#14b8a6", "#f59e0b", "#8b5cf6", "#22c55e"];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Deterministic color for a relationship "kind" string, stable across calls. */
export function colorForEdgeKind(kind: string): string {
  const normalized = kind.trim().toLowerCase();
  const known = KNOWN_KIND_COLORS[normalized];
  if (known) {
    return known;
  }
  const index = hashString(normalized) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[index]!;
}
