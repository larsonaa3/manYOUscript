import { Strategy as LocalStrategy } from "passport-local";
import type Database from "better-sqlite3";
import { verifyPassword } from "../lib/password";
import type { UserRow } from "../db";
import type { AuthGate } from "./types";

/**
 * Local username/password strategy today; a future Google/GitHub strategy
 * is a new passport.use(...) call added here, not a rewrite of this pipeline.
 *
 * Takes a per-server-instance Passport (not the module-level singleton) so
 * that multiple createServer() calls (e.g. one per test) don't accumulate
 * duplicate serializers/deserializers on shared global state.
 */
export function configurePassport(db: Database.Database, passport: AuthGate): void {
  passport.use(
    new LocalStrategy((username, password, done) => {
      void (async () => {
        try {
          const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as
            | UserRow
            | undefined;
          if (!user || !user.password_hash) {
            done(null, false, { message: "Invalid username or password" });
            return;
          }
          const valid = await verifyPassword(password, user.password_hash);
          if (!valid) {
            done(null, false, { message: "Invalid username or password" });
            return;
          }
          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      })();
    }),
  );

  passport.serializeUser<number>((user, done) => {
    done(null, (user as UserRow).id);
  });

  passport.deserializeUser<number>((id, done) => {
    try {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
      done(null, user ?? false);
    } catch (err) {
      done(err as Error);
    }
  });
}
