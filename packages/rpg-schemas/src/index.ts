export type { FieldDescriptor } from "./field-descriptor";
export { Dnd5eStatBlockSchema, DND5E_FIELDS } from "./dnd5e";
export type { Dnd5eStatBlock } from "./dnd5e";
export { GenericStatBlockSchema, GENERIC_FIELDS } from "./generic";
export type { GenericStatBlock } from "./generic";
export { NovelCharacterSchema, NOVEL_CHARACTER_FIELDS } from "./novel-character";
export type { NovelCharacter } from "./novel-character";
export { RelationshipEdgeSchema, RelationshipsBlockSchema } from "./relationships";
export type { RelationshipEdge, RelationshipsBlock } from "./relationships";
export {
  STAT_BLOCK_REGISTRY,
  STAT_BLOCK_SCHEMA_IDS,
  isStatBlockSchemaId,
  getFieldDescriptors,
  validateStatBlock,
  validateRelationshipsBlock,
} from "./registry";
export type { StatBlockSchemaId, ValidationResult } from "./registry";
