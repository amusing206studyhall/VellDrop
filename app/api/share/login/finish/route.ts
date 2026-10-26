import * as opaque from "@serenity-kit/opaque";
import { db } from "@/lib/db";
import { opaqueReady } from "@/lib/opaque-server";
import { sameOrigin, boundedJson, sharingEnabled } from "@/lib/http";
import { isValidUuid } from "@/lib/server";
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
    const { shareId, sessionId, finishLoginRequest } =
      await boundedJson(request);
    if (
      !isValidUuid(shareId) ||
      !isValidUuid(sessionId) ||
      typeof finishLoginRequest !== "string" ||
      finishLoginRequest.length > 20000
    )
      return Response.json({ error: "Invalid request" }, { status: 400 });
    await client.query("BEGIN");
    const r = await client.query(
      "SELECT s.*,l.server_login_state FROM shares s JOIN opaque_login_sessions l ON l.share_id=s.id WHERE s.id=$1 AND l.id=$2 AND l.expires_at>now() AND s.status='active' AND s.expires_at>now() FOR UPDATE OF s,l",
      [shareId, sessionId],
    );
    if (!r.rowCount) {
      await client.query("ROLLBACK");
      return Response.json(
        { error: "Unlock session unavailable" },
        { status: 410 },
      );
    }
    const row = r.rows[0];
    await opaqueReady();
    let valid = false;
    try {
      opaque.server.finishLogin({
        serverLoginState: Buffer.from(row.server_login_state).toString("utf8"),
        finishLoginRequest,
      });
      valid = true;
    } catch {
      /* A failed or abandoned attempt stays counted. */
    }
    await client.query("DELETE FROM opaque_login_sessions WHERE id=$1", [
      sessionId,
    ]);
    if (!valid) {
      if (row.attempts >= row.max_attempts)
        await client.query(
          "UPDATE shares SET status='destroyed',wrapped_dek=NULL,wrap_salt=NULL,wrap_nonce=NULL,updated_at=now(),destroyed_at=now() WHERE id=$1",
          [shareId],
        );
      await client.query(
        "INSERT INTO share_audit_events(share_id,event_type) VALUES($1,'authentication_failed')",
        [shareId],
      );
      await client.query("COMMIT");
      return Response.json(
        {
          error: "Authentication failed",
          locked: row.attempts >= row.max_attempts,
        },
        { status: 401 },
      );
    }
    await client.query(
      "UPDATE shares SET attempts=0,updated_at=now() WHERE id=$1",
      [shareId],
    );
    await client.query(
      "INSERT INTO share_audit_events(share_id,event_type) VALUES($1,'authentication_succeeded')",
      [shareId],
    );
    await client.query("COMMIT");
    return Response.json({
      ok: true,
      wrappedDek: Buffer.from(row.wrapped_dek).toString("base64"),
      wrapSalt: Buffer.from(row.wrap_salt).toString("base64"),
      wrapNonce: Buffer.from(row.wrap_nonce).toString("base64"),
      attemptsRemaining: row.max_attempts,
    });
  } catch {
    await client.query("ROLLBACK");
    return Response.json({ error: "Unlock failed" }, { status: 400 });
  } finally {
    client.release();
    await pool.end();
  }
}
