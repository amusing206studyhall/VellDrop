import { createBrowserClient } from "@supabase/ssr";
export function browserAuth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error(
      "Accounts are not configured yet. Local Studio is available.",
    );
  return createBrowserClient(url, key);
}
