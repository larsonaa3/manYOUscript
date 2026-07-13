import type { NextFunction, Request, Response } from "express";

/** Guard for future protected non-auth routes. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}
