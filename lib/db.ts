import { Pool } from "pg";
export function db(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("Database is not configured");
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
  });
}
