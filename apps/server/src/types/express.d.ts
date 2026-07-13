import type { UserRow } from "../db";

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-pattern
    interface User extends UserRow {}
  }
}

export {};
