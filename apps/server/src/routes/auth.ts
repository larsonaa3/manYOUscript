import { Router } from "express";
import type { Pool } from "pg";
import { RegisterPayloadSchema, CredentialsSchema, type PublicUser } from "@manyouscript/auth-schemas";
import { hashPassword } from "../lib/password";
import type { UserRow } from "../db";
import type { AuthGate } from "../passport/types";

function toPublicUser(row: UserRow): PublicUser {
  return { id: row.id, username: row.username, email: row.email };
}

export function createAuthRouter(db: Pool, passport: AuthGate): Router {
  const router = Router();

  router.post("/register", (req, res, next) => {
    const parsed = RegisterPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid registration payload" });
      return;
    }
    const { username, password, email } = parsed.data;

    void (async () => {
      try {
        const existing = await db.query("SELECT id FROM users WHERE username = $1", [username]);
        if (existing.rows.length > 0) {
          res.status(409).json({ error: "Username already taken" });
          return;
        }

        const passwordHash = await hashPassword(password);
        const inserted = await db.query<UserRow>(
          "INSERT INTO users (username, password_hash, email) VALUES ($1, $2, $3) RETURNING *",
          [username, passwordHash, email ?? null],
        );
        const row = inserted.rows[0]!;

        req.login(row, (err) => {
          if (err) {
            next(err);
            return;
          }
          res.status(201).json(toPublicUser(row));
        });
      } catch (err) {
        next(err);
      }
    })();
  });

  router.post("/login", (req, res, next) => {
    const parsed = CredentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid credentials payload" });
      return;
    }

    passport.authenticate(
      "local",
      (err: Error | null, user: UserRow | false, info: { message?: string } | undefined) => {
        if (err) {
          next(err);
          return;
        }
        if (!user) {
          res.status(401).json({ error: info?.message ?? "Invalid credentials" });
          return;
        }
        req.login(user, (loginErr) => {
          if (loginErr) {
            next(loginErr);
            return;
          }
          res.json(toPublicUser(user));
        });
      },
    )(req, res, next);
  });

  router.post("/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        next(err);
        return;
      }
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          next(destroyErr);
          return;
        }
        res.clearCookie("connect.sid");
        res.status(204).end();
      });
    });
  });

  router.get("/me", (req, res) => {
    if (!req.isAuthenticated() || !req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    res.json(toPublicUser(req.user));
  });

  return router;
}
