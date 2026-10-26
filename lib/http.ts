export function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}
export async function boundedJson(request: Request) {
  const text = await request.text();
  if (text.length > 32768) throw new Error("Request too large");
  return JSON.parse(text);
}
export function sharingEnabled() {
  return process.env.SECURE_SHARE_ENABLED === "true";
}
