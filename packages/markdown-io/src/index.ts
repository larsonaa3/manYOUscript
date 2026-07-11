export { splitFrontmatter, joinFrontmatter } from "./frontmatter";
export type { SplitNote } from "./frontmatter";
export { extractWikilinkTargets } from "./wikilinks";
export { extractStructuredBlocks, upsertStructuredBlock } from "./structured-blocks";
export type { StructuredBlock } from "./structured-blocks";
export { parseNote, stringifyNote, deriveTitle } from "./parse-note";
export type { ParsedNote } from "./parse-note";
export { compileManuscript } from "./compile-manuscript";
export type { ManuscriptChapter } from "./compile-manuscript";
