export type NoteType = "chapter" | "session" | "character" | "note";

const NOTE_TYPES: readonly NoteType[] = ["chapter", "session", "character", "note"];

function isNoteType(value: unknown): value is NoteType {
  return typeof value === "string" && (NOTE_TYPES as readonly string[]).includes(value);
}

/**
 * A note's effective type. An explicit `type` in frontmatter always wins
 * (this is how session logs already tag themselves); otherwise it's
 * inferred from existing conventions - a `manuscript` field means a
 * chapter, a stat-block fence means a character - falling back to the
 * catchall "note".
 */
export function deriveNoteType(frontmatter: Record<string, unknown>, hasStatBlock: boolean): NoteType {
  if (isNoteType(frontmatter.type)) {
    return frontmatter.type;
  }
  if (typeof frontmatter.manuscript === "string" && frontmatter.manuscript.trim().length > 0) {
    return "chapter";
  }
  if (hasStatBlock) {
    return "character";
  }
  return "note";
}
