import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { db } from "@/lib/db";
import { planFromPrice } from "@/lib/plans";
import { isValidUuid } from "@/lib/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET,
    key = process.env.PADDLE_API_KEY;
  if (!secret || !key)
    return Response.json({ error: "Billing unavailable" }, { status: 503 });
  const raw = await request.text();
  if (raw.length > 1000000)
    return Response.json({ error: "Too large" }, { status: 413 });
  try {
    const paddle = new Paddle(key, {
      environment:
        process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
          ? Environment.production
          : Environment.sandbox,
    });
    await paddle.webhooks.unmarshal(
      raw,
      secret,
      request.headers.get("paddle-signature") || "",
    );
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }
  // Parse the verified raw event: Paddle webhooks use snake_case fields.
  const event = JSON.parse(raw),
    d = event.data;
  if (
    typeof event.event_id !== "string" ||
    !Number.isFinite(Date.parse(event.occurred_at))
  )
    return Response.json({ error: "Invalid event" }, { status: 400 });
  const pool = db(),
    client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query(
      "INSERT INTO billing_events(event_id,event_type,raw_json) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING event_id",
      [
        event.event_id,
        event.event_type,
        JSON.stringify({
          event_id: event.event_id,
          event_type: event.event_type,
          occurred_at: event.occurred_at,
        }),
      ],
    );
    if (!inserted.rowCount) {
      await client.query("COMMIT");
      return Response.json({ ok: true, duplicate: true });
    }
    if (String(event.event_type).startsWith("subscription.")) {
      const price = d.items?.[0]?.price?.id,
        plan = planFromPrice(price),
        intent = d.custom_data?.checkout_intent_id;
      const existing = await client.query(
        "SELECT user_id FROM billing_entitlements WHERE paddle_subscription_id=$1 FOR UPDATE",
        [d.id],
      );
      let userId = existing.rows[0]?.user_id;
      if (!userId && isValidUuid(intent)) {
        const binding = await client.query(
          "SELECT user_id FROM checkout_intents WHERE id=$1 AND price_id=$2",
          [intent, price],
        );
        userId = binding.rows[0]?.user_id;
      }
      if (userId) {
        await client.query(
          `INSERT INTO billing_entitlements(user_id,paddle_customer_id,paddle_subscription_id,plan,status,event_occurred_at) VALUES($1,$2,$3,$4,$5,$6)
 ON CONFLICT(paddle_subscription_id) DO UPDATE SET plan=EXCLUDED.plan,status=EXCLUDED.status,event_occurred_at=EXCLUDED.event_occurred_at,updated_at=now()
 WHERE billing_entitlements.event_occurred_at<EXCLUDED.event_occurred_at AND billing_entitlements.user_id=EXCLUDED.user_id`,
          [
            userId,
            d.customer_id,
            d.id,
            plan || "free",
            d.status,
            event.occurred_at,
          ],
        );
      }
    }
    await client.query("COMMIT");
    return Response.json({ ok: true });
  } catch {
    await client.query("ROLLBACK");
    return Response.json(
      { error: "Could not persist event. Retry." },
      { status: 500 },
    );
  } finally {
    client.release();
    await pool.end();
  }
}
