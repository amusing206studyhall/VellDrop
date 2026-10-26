"use client";
import { useState } from "react";
export default function DashboardActions({
  shareId,
  billing,
}: {
  shareId?: string;
  billing?: boolean;
}) {
  const [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  async function run() {
    if (
      !billing &&
      !confirm("Revoke future unlocks? Downloaded copies cannot be recalled.")
    )
      return;
    setBusy(true);
    try {
      const r = await fetch(
        billing ? "/api/billing/portal" : "/api/account/revoke",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shareId }),
        },
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (d.url) location.assign(d.url);
      else location.reload();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button className="btn" disabled={busy} onClick={run}>
        {billing ? "Manage subscription" : "Revoke"}
      </button>
      <span role="status" className="small">
        {" "}
        {status}
      </span>
    </div>
  );
}
