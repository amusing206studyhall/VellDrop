import fs from "node:fs";
import pg from "pg";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(
    fs.readFileSync(
      new URL(
        "../supabase/migrations/202610210001_initial.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  console.log("Migration applied");
} finally {
  await client.end();
}
