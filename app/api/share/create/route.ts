import { randomBytes, createHash } from "node:crypto";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/supabase/server";
import { sameOrigin, boundedJson, sharingEnabled } from "@/lib/http";
import { accountPlan, plans } from "@/lib/account";
import { isValidUuid, isValidBase64, isValidOpaque } from "@/lib/server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sharingEnabled())
    return Response.json(
      { error: "Secure Share is not enabled yet." },
      { status: 503 },
    );
  if (!sameOrigin(request))
    return Response.json({ error: "Forbidden" }, { status: 403 });
  const user = await currentUser();
  if (!user)
    return Response.json(
      { error: "Please sign in to create a share." },
      { status: 401 },
    );
  const pool = db(),
    client = await pool.connect();
  try {
    const {
      shareId,
      registrationRecord,
      wrappedDek,
      wrapSalt,
      wrapNonce,
      expiresAt,
      carrierKind,
    } = await boundedJson(request);
    if (
      !isValidUuid(shareId) ||
      !isValidOpaque(registrationRecord) ||
      !isValidBase64(wrappedDek, 48) ||
      !isValidBase64(wrapSalt, 32) ||
      !isValidBase64(wrapNonce, 12) ||
      Buffer.from(wrappedDek, "base64").length !== 48 ||
      Buffer.from(wrapSalt, "base64").length !== 32 ||
      Buffer.from(wrapNonce, "base64").length !== 12 ||
      !["png", "webp", "jpeg"].includes(carrierKind)
    )
      return Response.json({ error: "Invalid share" }, { status: 400 });
    await client.query("BEGIN");
    // Serialize account quota checks across concurrent server instances.
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
      user.id,
    ]);
    const plan = await accountPlan(client, user.id),
      expiry = new Date(expiresAt);
    if (
      !Number.isFinite(expiry.valueOf()) ||
      expiry <= new Date() ||
      expiry.valueOf() > Date.now() + plans[plan].days * 86400000
    ) {
      await client.query("ROLLBACK");
      return Response.json(
        { error: `Your plan allows up to ${plans[plan].days} days.` },
        { status: 400 },
      );
    }
    const used = await client.query(
      "SELECT count(*)::int AS n FROM shares WHERE owner_id=$1 AND created_at>=date_trunc('month',now())",
      [user.id],
    );
    if (used.rows[0].n >= plans[plan].shares) {
      await client.query("ROLLBACK");
      return Response.json(
        {
          error:
            "Monthly share limit reached. Upgrade or wait until next month.",
        },
        { status: 429 },
      );
    }
    const manageToken = randomBytes(32).toString("base64url");
    await client.query(
      "INSERT INTO shares(id,owner_id,opaque_registration_record,wrapped_dek,wrap_salt,wrap_nonce,manage_token_hash,carrier_kind,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
      [
        shareId,
        user.id,
        Buffer.from(registrationRecord, "utf8"),
        Buffer.from(wrappedDek, "base64"),
        Buffer.from(wrapSalt, "base64"),
        Buffer.from(wrapNonce, "base64"),
        createHash("sha256").update(manageToken).digest("hex"),
        carrierKind,
        expiry.toISOString(),
      ],
    );
    await client.query(
      "INSERT INTO share_audit_events(share_id,event_type) VALUES($1,'created')",
      [shareId],
    );
    await client.query("COMMIT");
    return Response.json({ ok: true, shareId, manageToken });
  } catch {
    await client.query("ROLLBACK");
    return Response.json({ error: "Could not create share" }, { status: 400 });
  } finally {
    client.release();
    await pool.end();
  }
}
