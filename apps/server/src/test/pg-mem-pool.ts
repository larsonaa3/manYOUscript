import { newDb, DataType } from "pg-mem";
import type { Pool } from "pg";
import { applySchema } from "../db";

/**
 * An in-memory Postgres-compatible pool for tests, mirroring the old
 * createDb(":memory:") convenience SQLite gave us - same schema/query
 * code path as production, just backed by pg-mem instead of a real
 * network connection.
 */
export async function createTestPool(): Promise<Pool> {
  const db = newDb();
  // pg-mem implements only a small stdlib; connect-pg-simple's upsert
  // query hardcodes to_timestamp(epoch-seconds), which isn't in it.
  db.public.registerFunction({
    name: "to_timestamp",
    args: [DataType.text],
    returns: DataType.timestamptz,
    implementation: (epochSeconds: string) => new Date(Number(epochSeconds) * 1000),
  });
  const { Pool: MemPool } = db.adapters.createPg();
  const pool = new MemPool() as unknown as Pool;
  await applySchema(pool);
  return pool;
}
