import * as opaque from "@serenity-kit/opaque";
import { opaqueReady, serverSetup } from "@/lib/opaque-server";
import { currentUser } from "@/lib/supabase/server";
import { sameOrigin, boundedJson, sharingEnabled } from "@/lib/http";
import { db } from "@/lib/db";
import {
  consumeRateLimit,
  hashRateKey,
  isValidUuid,
  isValidBase64,
  isValidOpaque,
} from "@/lib/server";
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
    const { userIdentifier, registrationRequest } = await boundedJson(request);
    if (!isValidUuid(userIdentifier) || !isValidOpaque(registrationRequest))
      return Response.json({ error: "Invalid request" }, { status: 400 });
    const limit = await consumeRateLimit(
      client,
      hashRateKey("registration", user.id),
      3600,
      100,
    );
    if (!limit.allowed)
      return Response.json({ error: "Please try later." }, { status: 429 });
    await opaqueReady();
    return Response.json(
      opaque.server.createRegistrationResponse({
        serverSetup: serverSetup(),
        userIdentifier,
        registrationRequest,
      }),
    );
  } catch {
    return Response.json(
      { error: "Registration could not be started." },
      { status: 400 },
    );
  } finally {
    client.release();
    await pool.end();
  }
}
