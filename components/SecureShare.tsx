"use client";

import { useMemo, useState } from "react";
import * as opaque from "@serenity-kit/opaque";
import { b64, unb64 } from "@/lib/bytes";
import { detectCarrier, embedCarrier, type CarrierKind } from "@/lib/carrier";
import {
  encryptWithDataKey,
  generateDataKey,
  MAX_CARRIER_BYTES,
  MAX_DOCUMENT_BYTES,
  MAX_OUTPUT_BYTES,
  serializePayload,
  wrapDataKey,
} from "@/lib/crypto";

function formatMiB(bytes: number): string {
  return `${(bytes / 1048576).toFixed(2)} MiB`;
}

function download(bytes: Uint8Array, name: string, type: string): void {
  const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function outputName(coverName: string, kind: CarrierKind): string {
  const ext = kind === "png" ? "png" : kind === "webp" ? "webp" : "jpg";
  return `${coverName.replace(/\.[^.]+$/i, "")}.veildrop.${ext}`;
}

async function jsonOrThrow(response: Response): Promise<any> {
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Request failed.");
  return body;
}

export default function SecureShare() {
  const [file, setFile] = useState<File>();
  const [cover, setCover] = useState<File>();
  const [kind, setKind] = useState<CarrierKind>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [expiry, setExpiry] = useState("24");
  const [shareUrl, setShareUrl] = useState("");
  const [manageUrl, setManageUrl] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const canCreate = useMemo(
    () =>
      !!file &&
      !!cover &&
      !!kind &&
      password.length >= 16 &&
      password === confirmPassword &&
      !busy,
    [file, cover, kind, password, confirmPassword, busy],
  );

  async function chooseCover(next?: File) {
    setCover(next);
    setKind(undefined);
    if (!next) return;
    if (next.size > MAX_CARRIER_BYTES) {
      setStatus(
        `Cover image is too large. Maximum is ${formatMiB(MAX_CARRIER_BYTES)}.`,
      );
      return;
    }
    const bytes = new Uint8Array(await next.arrayBuffer());
    const detected = detectCarrier(bytes);
    if (!detected) {
      setStatus("Unsupported image. Use PNG, WebP, or JPEG.");
      return;
    }
    setKind(detected);
    setStatus(`${detected.toUpperCase()} cover selected.`);
  }

  async function create() {
    if (!file || !cover || !kind) return;
    setBusy(true);
    setStatus("Preparing local encryption…");
    try {
      if (file.size > MAX_DOCUMENT_BYTES)
        throw new Error(`Document exceeds ${formatMiB(MAX_DOCUMENT_BYTES)}.`);
      if (cover.size > MAX_CARRIER_BYTES)
        throw new Error(`Cover exceeds ${formatMiB(MAX_CARRIER_BYTES)}.`);
      if (file.size + cover.size + 1024 * 1024 > MAX_OUTPUT_BYTES) {
        throw new Error(
          `Estimated output exceeds ${formatMiB(MAX_OUTPUT_BYTES)}.`,
        );
      }
      if (password.length < 16) throw new Error("Use at least 16 characters.");

      await opaque.ready;

      const shareId = crypto.randomUUID();

      const registration = opaque.client.startRegistration({ password });

      const registrationResponse = await jsonOrThrow(
        await fetch("/api/share/register/start", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            userIdentifier: shareId,
            registrationRequest: registration.registrationRequest,
          }),
        }),
      );

      const finished = opaque.client.finishRegistration({
        clientRegistrationState: registration.clientRegistrationState,
        registrationResponse: registrationResponse.registrationResponse,
        password,
      });

      const { key, iv } = await generateDataKey();
      const encrypted = await encryptWithDataKey(file, key, iv);
      const payload = serializePayload({
        version: 1,
        mode: "random",
        iv: encrypted.iv,
        ciphertext: encrypted.ciphertext,
      });

      const wrapped = await wrapDataKey(key, unb64(finished.exportKey));
      const coverBytes = new Uint8Array(await cover.arrayBuffer());
      const output = embedCarrier(kind, coverBytes, payload);

      if (output.length > MAX_OUTPUT_BYTES) {
        throw new Error(`Final output exceeds ${formatMiB(MAX_OUTPUT_BYTES)}.`);
      }

      const expiresAt = new Date(
        Date.now() + Number(expiry) * 3600000,
      ).toISOString();
      const created = await jsonOrThrow(
        await fetch("/api/share/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            shareId,
            registrationRecord: finished.registrationRecord,
            wrappedDek: b64(wrapped.wrapped),
            wrapSalt: b64(wrapped.salt),
            wrapNonce: b64(wrapped.nonce),
            expiresAt,
            carrierKind: kind,
          }),
        }),
      );

      download(
        output,
        outputName(cover.name, kind),
        cover.type || `image/${kind}`,
      );
      const url = `${window.location.origin}/secure-share/${shareId}`;
      const management = `${window.location.origin}/secure-share/manage/${shareId}#token=${encodeURIComponent(created.manageToken)}`;
      setShareUrl(url);
      setManageUrl(management);
      setStatus(
        "Created. Send the carrier and share URL through one channel; send the password through a separate channel.",
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Secure Share creation failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero compact">
        <div className="eyebrow">Online controlled access</div>
        <h1>Encrypt locally. Control access remotely.</h1>
        <p>
          The document is encrypted in the browser. The server stores only the
          OPAQUE registration record and an encrypted copy of the random file
          key. The carrier itself is not uploaded to VeilDrop.
        </p>
      </section>

      <section className="panel" style={{ marginTop: 32 }}>
        <div className="row">
          <div className="drop">
            <strong>Document</strong>
            <span className="small">Up to {formatMiB(MAX_DOCUMENT_BYTES)}</span>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0])} />
            {file && (
              <div className="small">
                {file.name} · {formatMiB(file.size)}
              </div>
            )}
          </div>
          <div className="drop">
            <strong>Cover image</strong>
            <span className="small">PNG, WebP, or JPEG · no fixed ratio</span>
            <input
              type="file"
              accept="image/png,image/webp,image/jpeg"
              onChange={(e) => void chooseCover(e.target.files?.[0])}
            />
            {cover && (
              <div className="small">
                {cover.name} · {kind?.toUpperCase() || "checking…"}
              </div>
            )}
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label>Password — minimum 16 characters</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Use a long unique passphrase"
            />
          </div>
          <div className="field">
            <label>Confirm password</label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Share expiry</label>
            <select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
              <option value="1">1 hour</option>
              <option value="24">24 hours</option>
              <option value="72">72 hours</option>
              <option value="168">7 days · Pro / Plus</option>
              <option value="720">30 days · Plus</option>
            </select>
          </div>
        </div>

        <div className="status">
          Online policy: 10 consecutive authentication starts are permitted. A
          successful OPAQUE login resets the counter. The server also
          rate-limits requests. Unfinished attempts count too. After ten
          unsuccessful or abandoned starts, future unlocks are blocked. A
          successful unlock resets the counter.
        </div>
        <button
          className="btn primary"
          disabled={!canCreate}
          onClick={() => void create()}
        >
          {busy ? "Creating…" : "Create Secure Share"}
        </button>

        {shareUrl && (
          <div className="status">
            <strong>Recipient URL</strong>
            <br />
            <code>{shareUrl}</code>
          </div>
        )}
        {manageUrl && (
          <div className="status">
            <strong>Private management URL</strong>
            <br />
            <code>{manageUrl}</code>
            <br />
            <span className="small">
              Keep this URL private. It can revoke the share.
            </span>
          </div>
        )}
        <div className="status">{status || "Waiting for input."}</div>
      </section>

      <footer className="footer">
        Secure Share is designed for production hardening but should not be
        marketed as independently audited security until an external review is
        complete. Copyright © 2026 Md Taufiqur Rahman.
      </footer>
    </main>
  );
}
