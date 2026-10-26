import { db } from "@/lib/db";
import { expireShares } from "@/lib/share-maintenance";
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== "Bearer " + secret)
    return Response.json({ error: "Forbidden" }, { status: 401 });
  const pool = db(),
    client = await pool.connect();
  try {
    await expireShares(client);
    await client.query(
      "DELETE FROM rate_limit_buckets WHERE window_start<now()-interval '1 day'",
    );
    await client.query(
      "DELETE FROM share_audit_events WHERE created_at<now()-interval '90 days'",
    );
    return Response.json({ ok: true });
  } finally {
    client.release();
    await pool.end();
  }
}
