import express, { type Express } from "express";
import session from "express-session";
import cors from "cors";
import passport from "passport";
import path from "node:path";
import type Database from "better-sqlite3";
import SqliteStoreFactory from "better-sqlite3-session-store";
import { createDb } from "./db";
import { configurePassport } from "./passport/index";
import type { AuthGate } from "./passport/types";
import { createAuthRouter } from "./routes/auth";

export interface CreateServerOptions {
  /** Inject an existing db handle (e.g. an in-memory db in tests) instead of opening one from dbPath. */
  db?: Database.Database;
  dbPath?: string;
  sessionSecret?: string;
  /** Set only for Path B (server on a different origin than the static site). */
  corsOrigin?: string;
  /** When set, serves the built apps/web static bundle from this directory (Path A). */
  staticDir?: string;
}

export function createServer(options: CreateServerOptions = {}): Express {
  const db = options.db ?? createDb(options.dbPath ?? process.env.DB_PATH ?? "./data/manyouscript.db");
  // A per-server-instance Authenticator (not the module-level singleton) so that
  // multiple createServer() calls (e.g. one per test) don't accumulate duplicate
  // serializers/deserializers on shared global state.
  const auth = new passport.Authenticator() as unknown as AuthGate;
  configurePassport(db, auth);

  const app = express();
  app.use(express.json());

  const corsOrigin = options.corsOrigin ?? process.env.CORS_ORIGIN ?? undefined;
  if (corsOrigin) {
    app.use(cors({ origin: corsOrigin, credentials: true }));
  }

  const SqliteStore = SqliteStoreFactory(session);
  const isProduction = process.env.NODE_ENV === "production";
  app.use(
    session({
      store: new SqliteStore({ client: db, expired: { clear: true, intervalMs: 15 * 60 * 1000 } }),
      secret: options.sessionSecret ?? process.env.SESSION_SECRET ?? "dev-only-secret-change-me",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: corsOrigin ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    }),
  );

  app.use(auth.initialize());
  app.use(auth.session());

  app.use("/api", createAuthRouter(db, auth));

  const staticDir = options.staticDir ?? process.env.STATIC_DIR;
  if (staticDir) {
    app.use(express.static(staticDir));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(path.join(staticDir, "index.html"));
    });
  }

  return app;
}
