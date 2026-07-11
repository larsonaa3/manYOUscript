import type { z } from "zod";
import { Dnd5eStatBlockSchema, DND5E_FIELDS } from "./dnd5e";
import { GenericStatBlockSchema, GENERIC_FIELDS } from "./generic";
import { NovelCharacterSchema, NOVEL_CHARACTER_FIELDS } from "./novel-character";
import { RelationshipsBlockSchema } from "./relationships";
import type { FieldDescriptor } from "./field-descriptor";

export const STAT_BLOCK_REGISTRY = {
  "dnd5e-v1": { schema: Dnd5eStatBlockSchema, fields: DND5E_FIELDS, label: "D&D 5e Stat Block" },
  "generic-v1": { schema: GenericStatBlockSchema, fields: GENERIC_FIELDS, label: "Generic Stat Block" },
  "novel-character-v1": {
    schema: NovelCharacterSchema,
    fields: NOVEL_CHARACTER_FIELDS,
    label: "Character Profile",
  },
} as const satisfies Record<string, { schema: z.ZodType; fields: FieldDescriptor[]; label: string }>;

export type StatBlockSchemaId = keyof typeof STAT_BLOCK_REGISTRY;

export const STAT_BLOCK_SCHEMA_IDS = Object.keys(STAT_BLOCK_REGISTRY) as StatBlockSchemaId[];

export function isStatBlockSchemaId(id: string): id is StatBlockSchemaId {
  return id in STAT_BLOCK_REGISTRY;
}

export function getFieldDescriptors(schemaId: StatBlockSchemaId): FieldDescriptor[] {
  return STAT_BLOCK_REGISTRY[schemaId].fields;
}

export interface ValidationResult {
  success: boolean;
  data?: Record<string, unknown>;
  errors?: string[];
}

export function validateStatBlock(schemaId: string, data: unknown): ValidationResult {
  if (!isStatBlockSchemaId(schemaId)) {
    return { success: false, errors: [`Unknown stat block schema: "${schemaId}"`] };
  }
  const result = STAT_BLOCK_REGISTRY[schemaId].schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as Record<string, unknown> };
  }
  return { success: false, errors: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
}

export function validateRelationshipsBlock(data: unknown): ValidationResult {
  const result = RelationshipsBlockSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as Record<string, unknown> };
  }
  return { success: false, errors: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
}
