import { z } from "zod";
import type { FieldDescriptor } from "./field-descriptor";

export const GenericStatBlockSchema = z.object({
  name: z.string(),
  system: z.string().optional(),
  attributes: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  notes: z.string().optional(),
});

export type GenericStatBlock = z.infer<typeof GenericStatBlockSchema>;

export const GENERIC_FIELDS: FieldDescriptor[] = [
  { key: "name", label: "Name", kind: "text" },
  { key: "system", label: "System", kind: "text" },
  { key: "notes", label: "Notes", kind: "textarea" },
];
