import { z } from "zod";
import type { FieldDescriptor } from "./field-descriptor";

export const Dnd5eAbilityScoresSchema = z
  .object({
    str: z.number(),
    dex: z.number(),
    con: z.number(),
    int: z.number(),
    wis: z.number(),
    cha: z.number(),
  })
  .partial();

export const Dnd5eStatBlockSchema = z.object({
  name: z.string(),
  size: z.string().optional(),
  creatureType: z.string().optional(),
  alignment: z.string().optional(),
  armorClass: z.number().optional(),
  hitPoints: z.number().optional(),
  hitDice: z.string().optional(),
  speed: z.string().optional(),
  abilities: Dnd5eAbilityScoresSchema.optional(),
  savingThrows: z.record(z.string(), z.number()).optional(),
  skills: z.record(z.string(), z.number()).optional(),
  senses: z.string().optional(),
  languages: z.string().optional(),
  challengeRating: z.string().optional(),
  traits: z.array(z.object({ name: z.string(), description: z.string() })).optional(),
  actions: z.array(z.object({ name: z.string(), description: z.string() })).optional(),
});

export type Dnd5eStatBlock = z.infer<typeof Dnd5eStatBlockSchema>;

export const DND5E_FIELDS: FieldDescriptor[] = [
  { key: "name", label: "Name", kind: "text" },
  { key: "size", label: "Size", kind: "text" },
  { key: "creatureType", label: "Type", kind: "text" },
  { key: "alignment", label: "Alignment", kind: "text" },
  { key: "armorClass", label: "Armor Class", kind: "number" },
  { key: "hitPoints", label: "Hit Points", kind: "number" },
  { key: "hitDice", label: "Hit Dice", kind: "text" },
  { key: "speed", label: "Speed", kind: "text" },
  { key: "senses", label: "Senses", kind: "text" },
  { key: "languages", label: "Languages", kind: "text" },
  { key: "challengeRating", label: "Challenge Rating", kind: "text" },
];
