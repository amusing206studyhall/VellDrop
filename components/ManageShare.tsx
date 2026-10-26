"use client";

import { useEffect, useState } from "react";

export default function ManageShare({ shareId }: { shareId: string }) {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("Loading private management token…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const raw = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(raw);
    const value = params.get("token") || "";
    setToken(value);
    setStatus(
      value
        ? "Management authorization loaded locally."
        : "No management token was supplied.",
    );
  }, []);

  async function revoke() {
    if (!token) return;
    if (
      !window.confirm(
        "Revoke this share? Future server unlocks will be blocked. Already recovered files or cached keys cannot be recalled.",
      )
    )
      return;
    setBusy(true);
    try {
      const response = await fetch("/api/share/revoke", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shareId, manageToken: token }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Revoke failed.");
      setStatus(
        "Share revoked. Future key release is blocked. Previously recovered copies remain usable.",
      );
      setToken("");
      history.replaceState(null, "", window.location.pathname);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Revoke failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero compact">
        <div className="eyebrow">Private share management</div>
        <h1>Revoke access.</h1>
        <p>
          This page accepts the private management token that VeilDrop returned
          when the share was created. The token is kept in the URL fragment so
          it is not sent to the server as part of the HTTP request.
        </p>
      </section>
      <section className="panel" style={{ maxWidth: 720, marginTop: 32 }}>
        <div className="status">{status}</div>
        <button
          className="btn danger"
          disabled={!token || busy}
          onClick={() => void revoke()}
        >
          {busy ? "Revoking…" : "Revoke share"}
        </button>
      </section>
      <footer className="footer">
        Keep the management URL private. Copyright © 2026 Md Taufiqur Rahman.
      </footer>
    </main>
  );
}
