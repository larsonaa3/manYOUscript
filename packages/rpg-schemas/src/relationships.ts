import { z } from "zod";

export const RelationshipEdgeSchema = z.object({
  target: z.string(),
  type: z.string(),
  note: z.string().optional(),
});

export const RelationshipsBlockSchema = z.object({
  relationships: z.array(RelationshipEdgeSchema),
});

export type RelationshipEdge = z.infer<typeof RelationshipEdgeSchema>;
export type RelationshipsBlock = z.infer<typeof RelationshipsBlockSchema>;
