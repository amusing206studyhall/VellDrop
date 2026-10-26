"use client";

import { useState } from "react";
import * as opaque from "@serenity-kit/opaque";
import { b64, unb64 } from "@/lib/bytes";
import { detectCarrier, extractCarrier } from "@/lib/carrier";
import { parsePayload, unwrapAndDecrypt } from "@/lib/crypto";

function download(bytes: Uint8Array, name: string, type: string): void {
  const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function jsonOrThrow(response: Response): Promise<any> {
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Request failed.");
  return body;
}

export default function ReceiveShare({ shareId }: { shareId: string }) {
  const [carrier, setCarrier] = useState<File>();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [remaining, setRemaining] = useState<number>();
  const [busy, setBusy] = useState(false);

  async function unlock() {
    if (!carrier) return;
    setBusy(true);
    try {
      setStatus("Starting secure authentication…");
      await opaque.ready;

      if (carrier.size > 350 * 1048576)
        throw new Error("Carrier exceeds 350 MiB.");
      const bytes = new Uint8Array(await carrier.arrayBuffer());
      const kind = detectCarrier(bytes);
      if (!kind)
        throw new Error(
          "Unsupported carrier. Use the original PNG, WebP, or JPEG.",
        );

      const payload = parsePayload(extractCarrier(kind, bytes));
      if (payload.mode !== "random")
        throw new Error(
          "This is a local-mode file. Use VeilDrop Studio to unlock it.",
        );

      const login = opaque.client.startLogin({ password });

      const start = await jsonOrThrow(
        await fetch("/api/share/login/start", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            shareId,
            startLoginRequest: login.startLoginRequest,
          }),
        }),
      );

      setRemaining(start.attemptsRemaining);

      const result = opaque.client.finishLogin({
        clientLoginState: login.clientLoginState,
        loginResponse: start.loginResponse,
        password,
      });

      if (!result) {
        await fetch("/api/share/login/finish", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            shareId,
            sessionId: start.sessionId,
            finishLoginRequest: "",
          }),
        });
        throw new Error(
          `Authentication failed. Attempts remaining: ${start.attemptsRemaining}.`,
        );
      }

      const finish = await jsonOrThrow(
        await fetch("/api/share/login/finish", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            shareId,
            sessionId: start.sessionId,
            finishLoginRequest: result.finishLoginRequest,
          }),
        }),
      );

      setRemaining(finish.attemptsRemaining);

      const recovered = await unwrapAndDecrypt(
        unb64(result.exportKey),
        unb64(finish.wrapSalt),
        unb64(finish.wrapNonce),
        unb64(finish.wrappedDek),
        payload,
      );

      download(recovered.bytes, recovered.name, recovered.type);
      setStatus("Recovered successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unlock failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero compact">
        <div className="eyebrow">Secure Share</div>
        <h1>Unlock the protected file.</h1>
        <p>
          Use the original VeilDrop carrier. Screenshots, resizing,
          recompression, or image conversion can remove the encrypted payload.
        </p>
      </section>

      <section className="panel" style={{ maxWidth: 720, marginTop: 32 }}>
        <div className="drop">
          <strong>Original carrier</strong>
          <span className="small">PNG, WebP, or JPEG</span>
          <input
            type="file"
            accept="image/png,image/webp,image/jpeg"
            onChange={(e) => setCarrier(e.target.files?.[0])}
          />
          {carrier && <div className="small">{carrier.name}</div>}
        </div>

        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Enter the sender's password"
          />
        </div>

        <button
          className="btn primary"
          disabled={!carrier || !password || busy}
          onClick={() => void unlock()}
        >
          {busy ? "Authenticating…" : "Unlock & recover"}
        </button>

        {remaining !== undefined && (
          <div className="status">
            Authentication attempts remaining: {remaining}
          </div>
        )}
        <div className="status">{status || "Waiting for unlock."}</div>
      </section>

      <footer className="footer">
        The server never receives the plaintext carrier or document. Copyright ©
        2026 Md Taufiqur Rahman.
      </footer>
    </main>
  );
}
