import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("schema denies browser access and permits revocation without NOT NULL failure", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);",
    );
    const schema = await readFile(
      new URL(
        "../supabase/migrations/202610210001_initial.sql",
        import.meta.url,
      ),
      "utf8",
    );
    await db.exec(
      schema.replace("CREATE EXTENSION IF NOT EXISTS pgcrypto;", ""),
    );
    const user = crypto.randomUUID(),
      share = crypto.randomUUID();
    await db.query("INSERT INTO auth.users VALUES($1)", [user]);
    await db.query(
      "INSERT INTO shares(id,owner_id,opaque_registration_record,wrapped_dek,wrap_salt,wrap_nonce,manage_token_hash,expires_at) VALUES($1,$2,'abc','abc','abc','abc','hash',now()+interval '1 hour')",
      [share, user],
    );
    await db.exec("SET ROLE anon");
    await assert.rejects(db.query("SELECT * FROM shares"));
    await db.exec("RESET ROLE");
    await db.query(
      "UPDATE shares SET status='revoked',wrapped_dek=NULL,wrap_salt=NULL,wrap_nonce=NULL WHERE id=$1",
      [share],
    );
    const row = await db.query<{ status: string; wrapped_dek: unknown }>(
      "SELECT status,wrapped_dek FROM shares WHERE id=$1",
      [share],
    );
    assert.equal(row.rows[0].status, "revoked");
    assert.equal(row.rows[0].wrapped_dek, null);
  } finally {
    await db.close();
  }
});
