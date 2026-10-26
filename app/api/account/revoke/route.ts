import { currentUser } from "@/lib/supabase/server";
import { sameOrigin, boundedJson } from "@/lib/http";
import { db } from "@/lib/db";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Forbidden" }, { status: 403 });
  const user = await currentUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const { shareId } = await boundedJson(request);
  const pool = db();
  try {
    const r = await pool.query(
      "UPDATE shares SET status='revoked',wrapped_dek=NULL,wrap_salt=NULL,wrap_nonce=NULL,updated_at=now() WHERE id=$1 AND owner_id=$2 AND status='active' RETURNING id",
      [shareId, user.id],
    );
    return Response.json({ ok: !!r.rowCount });
  } finally {
    await pool.end();
  }
}
