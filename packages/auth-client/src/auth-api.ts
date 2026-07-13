import { PublicUserSchema, type PublicUser } from "@manyouscript/auth-schemas";

/**
 * Cast rather than an ambient ImportMetaEnv augmentation: this package is
 * typechecked standalone (`tsc --noEmit` from its own directory) as well as
 * transitively by every consumer's own `tsc` run, and a global .d.ts
 * augmentation only applies within the "include" set of whichever tsconfig
 * is doing the compiling - it doesn't travel with the module across a
 * separate project's typecheck the way node_modules/@types/* packages do.
 */
const API_BASE = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "";

export interface AuthApiError extends Error {
  status: number;
}

function apiError(message: string, status: number): AuthApiError {
  const err = new Error(message) as AuthApiError;
  err.status = status;
  return err;
}

async function parseUserResponse(res: Response): Promise<PublicUser> {
  const body = await res.json();
  return PublicUserSchema.parse(body);
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return (body && typeof body === "object" && "error" in body && typeof body.error === "string"
    ? body.error
    : fallback);
}

export async function fetchMe(): Promise<PublicUser | null> {
  const res = await fetch(`${API_BASE}/api/me`, { credentials: "include" });
  if (res.status === 401) {
    return null;
  }
  if (!res.ok) {
    throw apiError(await parseErrorMessage(res, "Failed to fetch current user"), res.status);
  }
  return parseUserResponse(res);
}

export async function login(username: string, password: string): Promise<PublicUser> {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    throw apiError(await parseErrorMessage(res, "Login failed"), res.status);
  }
  return parseUserResponse(res);
}

export async function register(username: string, password: string, email?: string): Promise<PublicUser> {
  const res = await fetch(`${API_BASE}/api/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, email }),
  });
  if (!res.ok) {
    throw apiError(await parseErrorMessage(res, "Registration failed"), res.status);
  }
  return parseUserResponse(res);
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/api/logout`, { method: "POST", credentials: "include" });
}
