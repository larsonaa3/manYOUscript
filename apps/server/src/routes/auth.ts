import { Router } from "express";
import type Database from "better-sqlite3";
import { RegisterPayloadSchema, CredentialsSchema, type PublicUser } from "@manyouscript/auth-schemas";
import { hashPassword } from "../lib/password";
import type { UserRow } from "../db";
import type { AuthGate } from "../passport/types";

function toPublicUser(row: UserRow): PublicUser {
  return { id: row.id, username: row.username, email: row.email };
}

export function createAuthRouter(db: Database.Database, passport: AuthGate): Router {
  const router = Router();

  router.post("/register", (req, res, next) => {
    const parsed = RegisterPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid registration payload" });
      return;
    }
    const { username, password, email } = parsed.data;

    const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
    if (existing) {
      res.status(409).json({ error: "Username already taken" });
      return;
    }

    void (async () => {
      try {
        const passwordHash = await hashPassword(password);
        const info = db
          .prepare("INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)")
          .run(username, passwordHash, email ?? null);
        const row = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid) as UserRow;

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
