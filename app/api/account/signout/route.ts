import { authClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/http";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response("Forbidden", { status: 403 });
  await (await authClient()).auth.signOut();
  return Response.redirect(new URL("/login", request.url), 303);
}
