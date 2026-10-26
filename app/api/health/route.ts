import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "VeilDrop",
    version: "1.1.0-beta.1",
    author: "Md Taufiqur Rahman",
    features: {
      localStudio: true,
      secureShare: Boolean(
        process.env.SECURE_SHARE_ENABLED === "true" &&
        process.env.DATABASE_URL &&
        process.env.OPAQUE_SERVER_SETUP,
      ),
      billingConfigured: Boolean(
        process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN &&
        process.env.PADDLE_API_KEY &&
        process.env.PADDLE_WEBHOOK_SECRET,
      ),
    },
  });
}
