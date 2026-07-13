import { z } from "zod";

/**
 * The wire-safe projection of a user, never the DB row - no password_hash,
 * no oauth_id. Shared contract between apps/server's route responses and
 * the frontend auth client.
 */
export const PublicUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().nullable(),
});

export type PublicUser = z.infer<typeof PublicUserSchema>;

export const CredentialsSchema = z.object({
  username: z.string().min(3).max(64),
  password: z.string().min(8).max(256),
});

export type Credentials = z.infer<typeof CredentialsSchema>;

export const RegisterPayloadSchema = CredentialsSchema.extend({
  email: z.string().email().optional(),
});

export type RegisterPayload = z.infer<typeof RegisterPayloadSchema>;
