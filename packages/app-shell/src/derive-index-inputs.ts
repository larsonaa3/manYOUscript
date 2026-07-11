import type { LinkInput } from "@manyouscript/index-db";
import { isStatBlockSchemaId, validateRelationshipsBlock } from "@manyouscript/rpg-schemas";
import type { ParsedNote } from "@manyouscript/markdown-io";

export function deriveIndexInputs(parsed: ParsedNote): { entitySchemaId?: string; links: LinkInput[] } {
  const statBlock = parsed.structuredBlocks.find((b) => isStatBlockSchemaId(b.schemaId));
  const relationshipsBlock = parsed.structuredBlocks.find((b) => b.schemaId === "relationships-v1");

  const links: LinkInput[] = [...parsed.wikilinkTargets];
  if (relationshipsBlock) {
    const validated = validateRelationshipsBlock(relationshipsBlock.data);
    if (validated.success) {
      const relationships = (validated.data as { relationships: { target: string; type: string }[] })
        .relationships;
      for (const rel of relationships) {
        links.push({ targetTitle: rel.target, kind: rel.type });
      }
    }
  }

  return { entitySchemaId: statBlock?.schemaId, links };
}
