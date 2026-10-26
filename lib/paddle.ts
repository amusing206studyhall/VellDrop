export async function paddleRequest(path: string, body: unknown) {
  const token = process.env.PADDLE_API_KEY;
  if (!token) throw new Error("Billing is not configured");
  const base =
    process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
      ? "https://api.paddle.com"
      : "https://sandbox-api.paddle.com";
  const r = await fetch(base + path, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok)
    throw new Error("Payment service is unavailable. Please try later.");
  return (await r.json()).data;
}
