import { z } from "zod";
import type { FieldDescriptor } from "./field-descriptor";

export const NovelCharacterSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  age: z.union([z.string(), z.number()]).optional(),
  appearance: z.string().optional(),
  personality: z.string().optional(),
  goals: z.string().optional(),
  backstory: z.string().optional(),
});

export type NovelCharacter = z.infer<typeof NovelCharacterSchema>;

export const NOVEL_CHARACTER_FIELDS: FieldDescriptor[] = [
  { key: "name", label: "Name", kind: "text" },
  { key: "role", label: "Role", kind: "text" },
  { key: "age", label: "Age", kind: "text" },
  { key: "appearance", label: "Appearance", kind: "textarea" },
  { key: "personality", label: "Personality", kind: "textarea" },
  { key: "goals", label: "Goals", kind: "textarea" },
  { key: "backstory", label: "Backstory", kind: "textarea" },
];
