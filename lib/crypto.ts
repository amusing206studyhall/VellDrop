import { b64, unb64, concatBytes, readU32be, u32be, utf8 } from "./bytes";

const te = new TextEncoder();
const td = new TextDecoder();
const AAD = utf8("VeilDrop/File/v1");
const PBKDF2_ITERATIONS = 600_000;

export const MAX_DOCUMENT_BYTES = 250 * 1024 * 1024;
export const MAX_CARRIER_BYTES = 100 * 1024 * 1024;
export const MAX_OUTPUT_BYTES = 350 * 1024 * 1024;

export function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(length);
  crypto.getRandomValues(out);
  return out;
}

async function passwordKey(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw",
    te.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function assertPassword(password: string): void {
  if (password.length < 16)
    throw new Error("Use at least 16 characters for a strong password.");
  if (password.length > 256) throw new Error("Password is too long.");
}

export type EncryptedPayload = {
  version: 1;
  mode: "password" | "random";
  salt?: Uint8Array<ArrayBuffer>;
  iv: Uint8Array<ArrayBuffer>;
  ciphertext: Uint8Array<ArrayBuffer>;
};

async function filePlaintext(file: File): Promise<Uint8Array<ArrayBuffer>> {
  const metadata = utf8(
    JSON.stringify({
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
    }),
  );
  const bytes = new Uint8Array(await file.arrayBuffer());
  return concatBytes(u32be(metadata.length), metadata, bytes);
}

export async function encryptWithPassword(
  file: File,
  password: string,
): Promise<EncryptedPayload> {
  assertPassword(password);
  if (file.size > MAX_DOCUMENT_BYTES)
    throw new Error(`Document exceeds ${MAX_DOCUMENT_BYTES / 1048576} MiB.`);
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await passwordKey(password, salt);
  const plain = await filePlaintext(file);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: AAD },
      key,
      plain,
    ),
  );
  return { version: 1, mode: "password", salt, iv, ciphertext };
}

export async function decryptWithPassword(
  payload: EncryptedPayload,
  password: string,
): Promise<{ bytes: Uint8Array<ArrayBuffer>; name: string; type: string }> {
  assertPassword(password);
  if (!payload.salt)
    throw new Error("Encrypted payload is missing its password salt.");
  const key = await passwordKey(password, payload.salt);
  const plain = new Uint8Array(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: payload.iv, additionalData: AAD },
      key,
      payload.ciphertext,
    ),
  );
  return unpackPlaintext(plain);
}

export async function generateDataKey(): Promise<{
  key: CryptoKey;
  iv: Uint8Array<ArrayBuffer>;
}> {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  return { key, iv: randomBytes(12) };
}

export async function encryptWithDataKey(
  file: File,
  key: CryptoKey,
  iv: Uint8Array<ArrayBuffer>,
): Promise<{
  ciphertext: Uint8Array<ArrayBuffer>;
  iv: Uint8Array<ArrayBuffer>;
}> {
  if (file.size > MAX_DOCUMENT_BYTES)
    throw new Error(`Document exceeds ${MAX_DOCUMENT_BYTES / 1048576} MiB.`);
  const plain = await filePlaintext(file);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: AAD },
      key,
      plain,
    ),
  );
  return { ciphertext, iv };
}

function unpackPlaintext(plain: Uint8Array<ArrayBuffer>): {
  bytes: Uint8Array<ArrayBuffer>;
  name: string;
  type: string;
} {
  if (plain.length < 4) throw new Error("Invalid encrypted payload.");
  const metadataLength = readU32be(plain, 0);
  if (metadataLength > plain.length - 4)
    throw new Error("Invalid encrypted metadata.");
  const metadata = JSON.parse(td.decode(plain.subarray(4, 4 + metadataLength)));
  if (typeof metadata?.name !== "string" || typeof metadata?.type !== "string")
    throw new Error("Invalid file metadata.");
  const bytes = plain.slice(4 + metadataLength);
  return { bytes, name: metadata.name, type: metadata.type };
}

export function serializePayload(
  payload: EncryptedPayload,
): Uint8Array<ArrayBuffer> {
  const header = utf8(
    JSON.stringify({
      v: payload.version,
      mode: payload.mode,
      salt: payload.salt ? b64(payload.salt) : undefined,
      iv: b64(payload.iv),
    }),
  );
  return concatBytes(u32be(header.length), header, payload.ciphertext);
}

export function parsePayload(
  payload: Uint8Array<ArrayBuffer>,
): EncryptedPayload {
  if (payload.length < 4) throw new Error("Invalid VeilDrop payload.");
  const headerLength = readU32be(payload, 0);
  if (headerLength > 4096 || headerLength > payload.length - 4)
    throw new Error("Invalid VeilDrop header.");
  const header = JSON.parse(td.decode(payload.subarray(4, 4 + headerLength)));
  if (
    header?.v !== 1 ||
    !["password", "random"].includes(header?.mode) ||
    typeof header?.iv !== "string"
  )
    throw new Error("Unsupported VeilDrop payload.");
  if (unb64(header.iv).length !== 12 || payload.length - 4 - headerLength < 16)
    throw new Error("Invalid encryption header");
  if (
    header.mode === "password" &&
    (typeof header.salt !== "string" || unb64(header.salt).length !== 16)
  )
    throw new Error("Invalid password salt");
  return {
    version: 1,
    mode: header.mode,
    salt: typeof header.salt === "string" ? unb64(header.salt) : undefined,
    iv: unb64(header.iv),
    ciphertext: payload.slice(4 + headerLength),
  };
}

export async function unwrapAndDecrypt(
  exportKeyBytes: Uint8Array<ArrayBuffer>,
  wrapSalt: Uint8Array<ArrayBuffer>,
  wrapNonce: Uint8Array<ArrayBuffer>,
  wrappedDek: Uint8Array<ArrayBuffer>,
  payload: EncryptedPayload,
): Promise<{ bytes: Uint8Array<ArrayBuffer>; name: string; type: string }> {
  const dataKey = await unwrapDataKey(
    exportKeyBytes,
    wrapSalt,
    wrapNonce,
    wrappedDek,
  );
  const plain = new Uint8Array(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: payload.iv, additionalData: AAD },
      dataKey,
      payload.ciphertext,
    ),
  );
  return unpackPlaintext(plain);
}

export async function wrapDataKey(
  dataKey: CryptoKey,
  exportKeyBytes: Uint8Array<ArrayBuffer>,
): Promise<{
  salt: Uint8Array<ArrayBuffer>;
  nonce: Uint8Array<ArrayBuffer>;
  wrapped: Uint8Array<ArrayBuffer>;
}> {
  const salt = randomBytes(32);
  const nonce = randomBytes(12);
  const base = await crypto.subtle.importKey(
    "raw",
    exportKeyBytes,
    "HKDF",
    false,
    ["deriveKey"],
  );
  const wrapKey = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info: utf8("VeilDrop/DEK-wrap/v1") },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", dataKey));
  const wrapped = new Uint8Array(
    await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: nonce,
        additionalData: utf8("VeilDrop/DEK-wrap/v1"),
      },
      wrapKey,
      raw,
    ),
  );
  return { salt, nonce, wrapped };
}

export async function unwrapDataKey(
  exportKeyBytes: Uint8Array<ArrayBuffer>,
  salt: Uint8Array<ArrayBuffer>,
  nonce: Uint8Array<ArrayBuffer>,
  wrapped: Uint8Array<ArrayBuffer>,
): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw",
    exportKeyBytes,
    "HKDF",
    false,
    ["deriveKey"],
  );
  const wrapKey = await crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info: utf8("VeilDrop/DEK-wrap/v1") },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  const raw = new Uint8Array(
    await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: nonce,
        additionalData: utf8("VeilDrop/DEK-wrap/v1"),
      },
      wrapKey,
      wrapped,
    ),
  );
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
