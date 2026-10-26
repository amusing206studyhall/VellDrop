import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidUuid } from "@/lib/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !isValidUuid(id))
    return NextResponse.json({ error: "Not found." }, { status: 404 });

  let pool: ReturnType<typeof db> | undefined;
  try {
    pool = db();
    await pool.query(
      `UPDATE shares
       SET status='expired',
           wrapped_dek=NULL, wrap_salt=NULL, wrap_nonce=NULL,
           updated_at=now()
       WHERE status='active' AND expires_at <= now()`,
    );
    const result = await pool.query(
      `SELECT id,
              CASE WHEN status='active' AND expires_at > now() THEN 'active' ELSE status END AS status,
              attempts, max_attempts, expires_at, carrier_kind
       FROM shares WHERE id=$1`,
      [id],
    );
    if (!result.rowCount)
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      status: row.status,
      attemptsRemaining: Math.max(
        0,
        Number(row.max_attempts) - Number(row.attempts),
      ),
      expiresAt: row.expires_at,
      carrierKind: row.carrier_kind,
    });
  } finally {
    if (pool) await pool.end();
  }
}
