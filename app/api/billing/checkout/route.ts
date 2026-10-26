import { randomUUID } from "node:crypto";
import { currentUser } from "@/lib/supabase/server";
import { sameOrigin, boundedJson } from "@/lib/http";
import { db } from "@/lib/db";
import { paddleRequest } from "@/lib/paddle";
import { consumeRateLimit, hashRateKey } from "@/lib/server";
export async function POST(request: Request) {
  if (process.env.BILLING_ENABLED !== "true")
    return Response.json(
      { error: "Subscriptions are not open yet." },
      { status: 503 },
    );
  if (!sameOrigin(request))
    return Response.json({ error: "Forbidden" }, { status: 403 });
  const user = await currentUser();
  if (!user)
    return Response.json(
      { error: "Please sign in before subscribing." },
      { status: 401 },
    );
  const pool = db(),
    client = await pool.connect();
  try {
    const { plan } = await boundedJson(request);
    const price =
      plan === "pro"
        ? process.env.PADDLE_PRO_PRICE_ID
        : plan === "plus"
          ? process.env.PADDLE_PLUS_PRICE_ID
          : null;
    if (!price)
      return Response.json({ error: "Plan is unavailable" }, { status: 400 });
    const limit = await consumeRateLimit(
      client,
      hashRateKey("checkout", user.id),
      3600,
      10,
    );
    if (!limit.allowed)
      return Response.json({ error: "Please try later" }, { status: 429 });
    const existing = await client.query(
      "SELECT id FROM billing_entitlements WHERE user_id=$1 AND status IN ('active','trialing','past_due','paused')",
      [user.id],
    );
    if (existing.rowCount)
      return Response.json(
        {
          error:
            "Use Manage subscription in your dashboard to change an existing subscription.",
        },
        { status: 409 },
      );
    const intent = randomUUID();
    await client.query(
      "INSERT INTO checkout_intents(id,user_id,price_id) VALUES($1,$2,$3)",
      [intent, user.id, price],
    );
    const data = await paddleRequest("/transactions", {
      items: [{ price_id: price, quantity: 1 }],
      collection_mode: "automatic",
      custom_data: { checkout_intent_id: intent },
    });
    return Response.json({ transactionId: data.id });
  } catch {
    return Response.json(
      { error: "Checkout could not be created" },
      { status: 502 },
    );
  } finally {
    client.release();
    await pool.end();
  }
}
