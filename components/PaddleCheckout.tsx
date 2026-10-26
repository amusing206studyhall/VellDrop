"use client";
import { useEffect, useState } from "react";
import { initializePaddle, type Paddle } from "@paddle/paddle-js";
export default function PaddleCheckout({
  plan,
  label = "Subscribe",
  enabled = false,
}: {
  plan: "pro" | "plus";
  label?: string;
  enabled?: boolean;
}) {
  const [paddle, setPaddle] = useState<Paddle>(),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!enabled || !process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN) return;
    initializePaddle({
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
      environment:
        process.env.NEXT_PUBLIC_PADDLE_ENV === "production"
          ? "production"
          : "sandbox",
    })
      .then(setPaddle)
      .catch(() => setStatus("Checkout unavailable"));
  }, [enabled]);
  async function buy() {
    setBusy(true);
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const d = await r.json();
      if (r.status === 401) {
        location.assign("/login");
        return;
      }
      if (!r.ok) throw new Error(d.error);
      paddle?.Checkout.open({
        transactionId: d.transactionId,
        settings: {
          displayMode: "overlay",
          theme: "dark",
          successUrl: location.origin + "/billing/success",
        },
      });
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Checkout unavailable");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="btn primary"
        disabled={!enabled || !paddle || busy}
        onClick={buy}
      >
        {!enabled ? "Coming after beta" : busy ? "Opening…" : label}
      </button>
      <p className="small" role="status">
        {status}
      </p>
    </>
  );
}
