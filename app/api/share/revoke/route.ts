import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { boundedJson, sameOrigin } from "@/lib/http";
import { db } from "@/lib/db";
import { isValidUuid } from "@/lib/server";

export const runtime = "nodejs";

function matchesToken(token: string, storedHash: string): boolean {
  const actual = createHash("sha256").update(token).digest();
  const expected = Buffer.from(storedHash, "hex");
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let pool: ReturnType<typeof db> | undefined;
  try {
    const { shareId, manageToken } = await boundedJson(request);
    if (
      !isValidUuid(shareId) ||
      typeof manageToken !== "string" ||
      manageToken.length < 32 ||
      manageToken.length > 128
    ) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    pool = db();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `SELECT manage_token_hash FROM shares WHERE id=$1 AND status='active' FOR UPDATE`,
        [shareId],
      );
      if (
        !result.rowCount ||
        !matchesToken(manageToken, result.rows[0].manage_token_hash)
      ) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "Not authorized." }, { status: 403 });
      }

      await client.query(
        `UPDATE shares
         SET status='revoked',
             wrapped_dek=NULL, wrap_salt=NULL, wrap_nonce=NULL,
             updated_at=now()
         WHERE id=$1`,
        [shareId],
      );
      await client.query(
        `INSERT INTO share_audit_events(share_id,event_type) VALUES($1,'revoked')`,
        [shareId],
      );
      await client.query("COMMIT");
      return NextResponse.json({ ok: true });
    } finally {
      client.release();
      await pool.end();
    }
  } catch {
    if (pool) await pool.end().catch(() => undefined);
    return NextResponse.json({ error: "Revoke failed." }, { status: 500 });
  }
}
