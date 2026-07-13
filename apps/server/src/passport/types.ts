import type { Handler, RequestHandler } from "express";

/**
 * The narrow slice of passport's Authenticator this app actually uses.
 * Passport's own TypeScript types use self-referential `this`-typed
 * generics that don't structurally compare cleanly once an instance crosses
 * a module boundary (`new passport.Authenticator()` in one file, consumed
 * as a parameter type in another) - this local interface sidesteps that
 * instead of fighting it.
 */
export interface AuthGate {
  use(strategy: unknown): void;
  serializeUser<TID>(fn: (user: Express.User, done: (err: unknown, id?: TID) => void) => void): void;
  deserializeUser<TID>(
    fn: (id: TID, done: (err: unknown, user?: Express.User | false | null) => void) => void,
  ): void;
  authenticate(strategy: string, callback: (...args: any[]) => void): RequestHandler;
  initialize(): Handler;
  session(): Handler;
}
