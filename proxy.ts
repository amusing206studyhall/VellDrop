import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const authUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const authOrigin = authUrl ? new URL(authUrl).origin : "";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://*.paddle.com",
    `connect-src 'self' ${authOrigin} https://*.paddle.com https://*.paddle.io`,
    "frame-src https://*.paddle.com https://*.paddle.io",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (authUrl && key) {
    const client = createServerClient(authUrl, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          requestHeaders.set("cookie", request.cookies.toString());
          response = NextResponse.next({
            request: { headers: requestHeaders },
          });
          items.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });
    await client.auth.getUser();
  }
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/((?!api/paddle/webhook|api/maintenance|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
