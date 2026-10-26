import { currentUser } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/http";
import { db } from "@/lib/db";
import { paddleRequest } from "@/lib/paddle";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json({ error: "Forbidden" }, { status: 403 });
  const user = await currentUser();
  if (!user)
    return Response.json({ error: "Sign in required" }, { status: 401 });
  const pool = db();
  try {
    const r = await pool.query(
      "SELECT paddle_customer_id FROM billing_entitlements WHERE user_id=$1 ORDER BY updated_at DESC LIMIT 1",
      [user.id],
    );
    if (!r.rows[0]?.paddle_customer_id)
      return Response.json(
        { error: "No subscription found yet." },
        { status: 404 },
      );
    const data = await paddleRequest(
      "/customers/" +
        encodeURIComponent(r.rows[0].paddle_customer_id) +
        "/portal-sessions",
      {},
    );
    return Response.json({ url: data.urls.general.overview });
  } catch {
    return Response.json(
      { error: "Billing portal unavailable" },
      { status: 502 },
    );
  } finally {
    await pool.end();
  }
}
