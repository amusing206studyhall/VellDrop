import { createHash } from "node:crypto";
import type { PoolClient } from "pg";

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim().slice(0, 120);
  return request.headers.get("x-real-ip")?.slice(0, 120) || "unknown";
}

export function hashRateKey(scope: string, ip: string): string {
  const pepper = process.env.RATE_LIMIT_PEPPER;
  if (!pepper) throw new Error("RATE_LIMIT_PEPPER is not configured.");
  return createHash("sha256").update(`${pepper}:${scope}:${ip}`).digest("hex");
}

/**
 * Fixed-window limiter stored in PostgreSQL. The UPSERT is atomic and therefore
 * remains correct across concurrent Vercel function instances.
 */
export async function consumeRateLimit(
  client: PoolClient,
  key: string,
  windowSeconds: number,
  maxRequests: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const result = await client.query(
    `INSERT INTO rate_limit_buckets(rate_key, window_start, request_count)
     VALUES ($1, now(), 1)
     ON CONFLICT (rate_key) DO UPDATE SET
       request_count = CASE
         WHEN rate_limit_buckets.window_start <= now() - ($2::text || ' seconds')::interval THEN 1
         ELSE rate_limit_buckets.request_count + 1
       END,
       window_start = CASE
         WHEN rate_limit_buckets.window_start <= now() - ($2::text || ' seconds')::interval THEN now()
         ELSE rate_limit_buckets.window_start
       END
     RETURNING request_count`,
    [key, windowSeconds],
  );
  const count = Number(result.rows[0].request_count);
  return {
    allowed: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
  };
}

export function isValidUuid(value: unknown): boolean {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function isValidBase64(
  value: unknown,
  maxBytes: number,
): value is string {
  if (
    typeof value !== "string" ||
    value.length > Math.ceil((maxBytes * 4) / 3) + 16
  )
    return false;
  try {
    const bytes = Buffer.from(value, "base64");
    return (
      bytes.length <= maxBytes &&
      Buffer.from(bytes).toString("base64").replace(/=+$/, "") ===
        value.replace(/=+$/, "")
    );
  } catch {
    return false;
  }
}

export function isValidOpaque(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 8192 &&
    /^[A-Za-z0-9_-]+$/.test(value)
  );
}
