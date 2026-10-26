"use client";
import { useState } from "react";
import { browserAuth } from "@/lib/supabase/browser";
export default function AccountForm() {
  const [email, setEmail] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await browserAuth().auth.signInWithOtp({
        email,
        options: { emailRedirectTo: location.origin + "/auth/callback" },
      });
      if (error) throw error;
      setStatus("Check your email for the sign-in link.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="panel" onSubmit={submit}>
      <h2>A passwordless account</h2>
      <p className="muted">
        Your account email is separate from your document passwords.
      </p>
      <div className="field">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <button className="btn primary" disabled={busy}>
        {busy ? "Sending…" : "Email me a sign-in link"}
      </button>
      <p role="status">{status}</p>
    </form>
  );
}
