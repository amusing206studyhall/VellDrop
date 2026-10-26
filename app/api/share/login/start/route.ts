import { randomUUID } from "node:crypto";
import * as opaque from "@serenity-kit/opaque";
import { db } from "@/lib/db";
import {
  consumeRateLimit,
  hashRateKey,
  getClientIp,
  isValidUuid,
  isValidBase64,
  isValidOpaque,
} from "@/lib/server";
import { opaqueReady, serverSetup } from "@/lib/opaque-server";
import { sameOrigin, boundedJson, sharingEnabled } from "@/lib/http";
import { expireShares } from "@/lib/share-maintenance";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!sharingEnabled())
    return Response.json(
      { error: "Secure Share is not enabled." },
      { status: 503 },
    );
  if (!sameOrigin(request))
    return Response.json({ error: "Forbidden" }, { status: 403 });
  const pool = db(),
    client = await pool.connect();
  try {
    const { shareId, startLoginRequest } = await boundedJson(request);
    if (!isValidUuid(shareId) || !isValidOpaque(startLoginRequest))
      return Response.json({ error: "Invalid request" }, { status: 400 });
    const limit = await consumeRateLimit(
      client,
      hashRateKey("login", getClientIp(request)),
      600,
      30,
    );
    if (!limit.allowed)
      return Response.json(
        { error: "Too many requests. Try later." },
        { status: 429 },
      );
    await expireShares(client);
    await client.query("BEGIN");
    const r = await client.query(
      "SELECT * FROM shares WHERE id=$1 AND status='active' AND expires_at>now() AND attempts<max_attempts FOR UPDATE",
      [shareId],
    );
    if (!r.rowCount) {
      await client.query("ROLLBACK");
      return Response.json(
        { error: "Share unavailable, expired, or locked." },
        { status: 410 },
      );
    }
    const pending = await client.query(
      "SELECT id FROM opaque_login_sessions WHERE share_id=$1 AND expires_at>now()",
      [shareId],
    );
    if (pending.rowCount) {
      await client.query("ROLLBACK");
      return Response.json(
        {
          error:
            "An unlock is already in progress. Please wait up to five minutes.",
        },
        { status: 409 },
      );
    }
    await opaqueReady();
    const row = r.rows[0];
    const result = opaque.server.startLogin({
      serverSetup: serverSetup(),
      userIdentifier: shareId,
      registrationRecord: Buffer.from(row.opaque_registration_record).toString(
        "utf8",
      ),
      startLoginRequest,
    });
    const sessionId = randomUUID();
    await client.query(
      "UPDATE shares SET attempts=attempts+1,updated_at=now() WHERE id=$1",
      [shareId],
    );
    await client.query(
      "INSERT INTO opaque_login_sessions(id,share_id,server_login_state,expires_at) VALUES($1,$2,$3,now()+interval '5 minutes')",
      [sessionId, shareId, Buffer.from(result.serverLoginState, "utf8")],
    );
    await client.query(
      "INSERT INTO share_audit_events(share_id,event_type) VALUES($1,'authentication_started')",
      [shareId],
    );
    await client.query("COMMIT");
    return Response.json({
      sessionId,
      loginResponse: result.loginResponse,
      attemptsRemaining: row.max_attempts - row.attempts - 1,
    });
  } catch {
    await client.query("ROLLBACK");
    return Response.json({ error: "Could not start unlock" }, { status: 400 });
  } finally {
    client.release();
    await pool.end();
  }
}
