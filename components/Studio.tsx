"use client";

import { useEffect, useMemo, useState } from "react";
import {
  detectCarrier,
  embedCarrier,
  extractCarrier,
  type CarrierKind,
} from "@/lib/carrier";
import {
  decryptWithPassword,
  encryptWithPassword,
  MAX_CARRIER_BYTES,
  MAX_DOCUMENT_BYTES,
  MAX_OUTPUT_BYTES,
  parsePayload,
  serializePayload,
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

export default function Studio() {
  const [file, setFile] = useState<File>();
  const [cover, setCover] = useState<File>();
  const [coverKind, setCoverKind] = useState<CarrierKind>();
  const [previewUrl, setPreviewUrl] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [reveal, setReveal] = useState<File>();
  const [revealPassword, setRevealPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!cover) {
      setPreviewUrl("");
      setDimensions("");
      setCoverKind(undefined);
      return;
    }
    const url = URL.createObjectURL(cover);
    setPreviewUrl(url);
    const image = new Image();
    image.onload = () =>
      setDimensions(`${image.naturalWidth} × ${image.naturalHeight}px`);
    image.onerror = () => setDimensions("Could not read image dimensions");
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [cover]);

  const canHide = useMemo(
    () =>
      !!file &&
      !!cover &&
      !!coverKind &&
      password.length >= 16 &&
      password === confirmPassword &&
      !busy,
    [file, cover, coverKind, password, confirmPassword, busy],
  );

  async function selectCover(next?: File) {
    setCover(next);
    setCoverKind(undefined);
    if (!next) return;
    if (next.size > MAX_CARRIER_BYTES) {
      setStatus(
        `Cover image is too large. Maximum is ${formatMiB(MAX_CARRIER_BYTES)}.`,
      );
      return;
    }
    const bytes = new Uint8Array(await next.arrayBuffer());
    const kind = detectCarrier(bytes);
    if (!kind) {
      setCoverKind(undefined);
      setStatus("Unsupported image. Use PNG, WebP, or JPEG.");
      return;
    }
    setCoverKind(kind);
    setStatus(`${kind.toUpperCase()} cover selected.`);
  }

  async function hide() {
    if (!file || !cover || !coverKind) return;
    setBusy(true);
    try {
      if (file.size > MAX_DOCUMENT_BYTES)
        throw new Error(`Document exceeds ${formatMiB(MAX_DOCUMENT_BYTES)}.`);
      if (cover.size > MAX_CARRIER_BYTES)
        throw new Error(`Cover exceeds ${formatMiB(MAX_CARRIER_BYTES)}.`);

      const roughOutput = cover.size + file.size + 1024 * 1024;
      if (roughOutput > MAX_OUTPUT_BYTES) {
        throw new Error(
          `The estimated output exceeds ${formatMiB(MAX_OUTPUT_BYTES)}.`,
        );
      }

      setStatus("Encrypting locally…");
      const encrypted = await encryptWithPassword(file, password);
      const payload = serializePayload(encrypted);
      const coverBytes = new Uint8Array(await cover.arrayBuffer());
      const output = embedCarrier(coverKind, coverBytes, payload);

      if (output.length > MAX_OUTPUT_BYTES) {
        throw new Error(`Final output exceeds ${formatMiB(MAX_OUTPUT_BYTES)}.`);
      }

      download(
        output,
        outputName(cover.name, coverKind),
        cover.type || `image/${coverKind}`,
      );
      setStatus(
        "Done. Keep the original output file and password. Send the password separately.",
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Encryption failed.");
    } finally {
      setBusy(false);
    }
  }

  async function revealFile() {
    if (!reveal) return;
    setBusy(true);
    try {
      setStatus("Reading the carrier locally…");
      if (reveal.size > MAX_OUTPUT_BYTES)
        throw new Error("Carrier is too large.");
      const bytes = new Uint8Array(await reveal.arrayBuffer());
      const kind = detectCarrier(bytes);
      if (!kind)
        throw new Error(
          "Unsupported carrier. Use a VeilDrop PNG, WebP, or JPEG.",
        );
      const payload = parsePayload(extractCarrier(kind, bytes));
      if (payload.mode !== "password") {
        throw new Error(
          "This file belongs to an Online Secure Share. Open its Secure Share link to unlock it.",
        );
      }
      const recovered = await decryptWithPassword(payload, revealPassword);
      download(recovered.bytes, recovered.name, recovered.type);
      setStatus(
        "Recovered successfully. The recovered bytes match the encrypted source.",
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unlock failed. Check the password and original carrier.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <section className="hero compact">
        <div className="eyebrow">Local mode</div>
        <h1>Encrypt on your device.</h1>
        <p>
          Choose a document, your own password, and a PNG, WebP, or JPEG cover.
          The document is encrypted locally before the carrier file is created.
        </p>
      </section>

      <section className="studio">
        <div className="panel">
          <h2>Hide a file</h2>

          <div className="drop">
            <strong>1. Document</strong>
            <span className="small">Up to {formatMiB(MAX_DOCUMENT_BYTES)}</span>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0])} />
            {file && (
              <div className="small">
                {file.name} · {formatMiB(file.size)}
              </div>
            )}
          </div>

          <div className="drop">
            <strong>2. Cover image</strong>
            <span className="small">
              PNG, WebP, or JPEG · no fixed ratio or resolution
            </span>
            <input
              type="file"
              accept="image/png,image/webp,image/jpeg"
              onChange={(e) => void selectCover(e.target.files?.[0])}
            />
            {cover && previewUrl && (
              <div className="preview">
                <img src={previewUrl} alt="Selected cover preview" />
                <div>
                  <strong>{cover.name}</strong>
                  <div className="small">
                    {coverKind?.toUpperCase()} · {formatMiB(cover.size)} ·{" "}
                    {dimensions}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="field">
            <label>Your own password — minimum 16 characters</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Use a long unique passphrase"
              autoComplete="new-password"
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
          <button
            className="btn primary"
            disabled={!canHide}
            onClick={() => void hide()}
          >
            {busy ? "Processing…" : "Encrypt & create carrier"}
          </button>
        </div>

        <div className="panel">
          <h2>Reveal a local file</h2>
          <div className="drop">
            <strong>VeilDrop carrier</strong>
            <span className="small">
              Keep the original file; screenshots and re-encoded images can
              remove the payload.
            </span>
            <input
              type="file"
              accept="image/png,image/webp,image/jpeg"
              onChange={(e) => setReveal(e.target.files?.[0])}
            />
            {reveal && (
              <div className="small">
                {reveal.name} · {formatMiB(reveal.size)}
              </div>
            )}
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={revealPassword}
              onChange={(e) => setRevealPassword(e.target.value)}
              placeholder="Enter the sender's password"
              autoComplete="current-password"
            />
          </div>

          <button
            className="btn primary"
            disabled={!reveal || !revealPassword || busy}
            onClick={() => void revealFile()}
          >
            {busy ? "Processing…" : "Unlock & recover"}
          </button>

          <div className="status">
            {status || "Nothing has been processed yet."}
          </div>

          <div className="estimate">
            <div className="metric">
              <span>Carrier</span>
              <strong>{coverKind?.toUpperCase() || "—"}</strong>
            </div>
            <div className="metric">
              <span>Document</span>
              <strong>{file ? formatMiB(file.size) : "—"}</strong>
            </div>
            <div className="metric">
              <span>Output</span>
              <strong>
                {file && cover ? formatMiB(file.size + cover.size) : "—"}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        Local mode is offline-capable and does not enforce the online 10-attempt
        policy. Copyright © 2026 Md Taufiqur Rahman.
      </footer>
    </main>
  );
}
