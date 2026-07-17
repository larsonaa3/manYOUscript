import { Pool } from "pg";

export interface UserRow {
  id: number;
  username: string;
  password_hash: string | null;
  email: string | null;
  oauth_provider: string | null;
  oauth_id: string | null;
  // node-pg parses timestamptz columns into Date objects by default.
  created_at: Date;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  email TEXT,
  oauth_provider TEXT,
  oauth_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_oauth
  ON users(oauth_provider, oauth_id) WHERE oauth_provider IS NOT NULL;

-- connect-pg-simple's standard session table, created up front (with
-- createTableIfMissing: false in app.ts) rather than via its own
-- existence-check-then-create path: that check uses to_regclass(), which
-- pg-mem (our test double) doesn't implement, and running unpredictable
-- DDL against Neon on every boot isn't something we want anyway.
--
-- sess is TEXT rather than the official docs' JSON: connect-pg-simple
-- writes it as a plain string parameter either way (no ::json cast) and
-- JSON.parse()s it back on read regardless of column type, so this is a
-- functionally identical, portable choice - and it sidesteps pg-mem (our
-- test double) rejecting the implicit text->json cast real Postgres allows.
CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR NOT NULL,
  sess TEXT NOT NULL,
  -- timestamptz, not the official docs' bare timestamp: connect-pg-simple
  -- compares this column against to_timestamp(...), which itself returns
  -- timestamptz, so this matches what's actually being compared.
  expire TIMESTAMPTZ NOT NULL,
  CONSTRAINT session_pkey PRIMARY KEY (sid)
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON session (expire);
`;

export async function applySchema(pool: Pool): Promise<void> {
  await pool.query(SCHEMA);
}

export async function createDb(connectionString: string): Promise<Pool> {
  const pool = new Pool({ connectionString });
  await applySchema(pool);
  return pool;
}
