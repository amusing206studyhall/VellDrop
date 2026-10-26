import { concatBytes, readU32be, readU32le, u32be, u32le, utf8 } from "./bytes";

export type CarrierKind = "png" | "webp" | "jpeg";

const PNG_SIG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const PNG_TYPE = utf8("vpLd");
const WEBP_TYPE = utf8("VLDp");
const JPEG_MAGIC = utf8("VeilDrop\0");
const MAX_PAYLOAD = 512 * 1024 * 1024;

function equal(
  a: Uint8Array<ArrayBuffer>,
  b: Uint8Array<ArrayBuffer>,
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function crc32(data: Uint8Array<ArrayBuffer>): number {
  let c = 0xffffffff;
  for (const x of data) {
    c ^= x;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(
  type: Uint8Array<ArrayBuffer>,
  data: Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> {
  const body = concatBytes(type, data);
  return concatBytes(u32be(data.length), body, u32be(crc32(body)));
}

function stripPngPayload(
  png: Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> {
  if (!equal(png.subarray(0, 8), PNG_SIG)) throw new Error("Not a PNG file.");
  const chunks: Uint8Array<ArrayBuffer>[] = [PNG_SIG];
  let p = 8;
  let foundIend = false;
  while (p + 12 <= png.length) {
    const len = readU32be(png, p);
    const end = p + 12 + len;
    if (end > png.length) throw new Error("Truncated PNG.");
    const type = png.subarray(p + 4, p + 8);
    if (!equal(type, PNG_TYPE)) chunks.push(png.subarray(p, end));
    p = end;
    if (String.fromCharCode(...type) === "IEND") {
      foundIend = true;
      break;
    }
  }
  if (!foundIend) throw new Error("PNG is missing IEND.");
  return concatBytes(...chunks);
}

function embedPng(
  png: Uint8Array<ArrayBuffer>,
  payload: Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> {
  if (payload.length > MAX_PAYLOAD) throw new Error("Payload is too large.");
  const clean = stripPngPayload(png);
  const iendOffset = clean.length - 12;
  return concatBytes(
    clean.subarray(0, iendOffset),
    pngChunk(PNG_TYPE, payload),
    clean.subarray(iendOffset),
  );
}

function extractPng(png: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  if (!equal(png.subarray(0, 8), PNG_SIG)) throw new Error("Not a PNG file.");
  let p = 8;
  while (p + 12 <= png.length) {
    const len = readU32be(png, p);
    const end = p + 12 + len;
    if (end > png.length) throw new Error("Truncated PNG.");
    const type = png.subarray(p + 4, p + 8);
    if (equal(type, PNG_TYPE)) {
      if (
        len > MAX_PAYLOAD ||
        crc32(png.subarray(p + 4, p + 8 + len)) !== readU32be(png, p + 8 + len)
      )
        throw new Error("Corrupted PNG payload");
      return png.slice(p + 8, p + 8 + len);
    }
    if (String.fromCharCode(...type) === "IEND") break;
    p = end;
  }
  throw new Error("No VeilDrop payload found.");
}

function embedWebp(
  webp: Uint8Array<ArrayBuffer>,
  payload: Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> {
  if (payload.length > MAX_PAYLOAD) throw new Error("Payload is too large.");
  if (
    webp.length < 12 ||
    String.fromCharCode(...webp.subarray(0, 4)) !== "RIFF" ||
    String.fromCharCode(...webp.subarray(8, 12)) !== "WEBP"
  ) {
    throw new Error("Not a WebP file.");
  }
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let p = 12;
  while (p + 8 <= webp.length) {
    const size = readU32le(webp, p + 4);
    const end = p + 8 + size + (size & 1);
    if (end > webp.length) throw new Error("Truncated WebP.");
    const type = webp.subarray(p, p + 4);
    if (!equal(type, WEBP_TYPE)) chunks.push(webp.subarray(p, end));
    p = end;
  }
  if (p !== webp.length) throw new Error("Invalid WebP chunk structure.");
  const webpChunk = concatBytes(
    WEBP_TYPE,
    u32le(payload.length),
    payload,
    payload.length & 1 ? new Uint8Array([0]) : new Uint8Array(),
  );
  const riffSize =
    4 + chunks.reduce((n, c) => n + c.length, 0) + webpChunk.length;
  return concatBytes(
    utf8("RIFF"),
    u32le(riffSize),
    utf8("WEBP"),
    ...chunks,
    webpChunk,
  );
}

function extractWebp(webp: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  if (
    webp.length < 12 ||
    String.fromCharCode(...webp.subarray(0, 4)) !== "RIFF" ||
    String.fromCharCode(...webp.subarray(8, 12)) !== "WEBP"
  ) {
    throw new Error("Not a WebP file.");
  }
  let p = 12;
  while (p + 8 <= webp.length) {
    const size = readU32le(webp, p + 4);
    const end = p + 8 + size + (size & 1);
    if (end > webp.length) throw new Error("Truncated WebP.");
    if (equal(webp.subarray(p, p + 4), WEBP_TYPE))
      return webp.slice(p + 8, p + 8 + size);
    p = end;
  }
  throw new Error("No VeilDrop payload found.");
}

function jpegSegments(
  bytes: Uint8Array<ArrayBuffer>,
): { start: number; end: number; marker: number; length: number }[] {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8)
    throw new Error("Not a JPEG file.");
  const out: { start: number; end: number; marker: number; length: number }[] =
    [];
  let p = 2;
  while (p < bytes.length) {
    if (bytes[p] !== 0xff) throw new Error("Invalid JPEG marker stream.");
    while (p < bytes.length && bytes[p] === 0xff) p++;
    if (p >= bytes.length) break;
    const marker = bytes[p++];
    if (marker === 0xd9 || marker === 0xda) {
      out.push({ start: p - 2, end: p, marker, length: 0 });
      break;
    }
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      out.push({ start: p - 2, end: p, marker, length: 0 });
      continue;
    }
    if (p + 2 > bytes.length) throw new Error("Truncated JPEG segment.");
    const length = (bytes[p] << 8) | bytes[p + 1];
    if (length < 2 || p + length > bytes.length)
      throw new Error("Invalid JPEG segment length.");
    out.push({ start: p - 2, end: p + length, marker, length });
    p += length;
  }
  return out;
}

function jpegPayloadSegment(
  seq: number,
  total: number,
  part: Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> {
  const body = concatBytes(
    JPEG_MAGIC,
    new Uint8Array([
      (seq >>> 24) & 255,
      (seq >>> 16) & 255,
      (seq >>> 8) & 255,
      seq & 255,
    ]),
    u32be(total),
    part,
  );
  if (body.length + 2 > 65535)
    throw new Error("JPEG carrier segment overflow.");
  const len = body.length + 2;
  return concatBytes(new Uint8Array([0xff, 0xef, len >>> 8, len & 255]), body);
}

function embedJpeg(
  jpeg: Uint8Array<ArrayBuffer>,
  payload: Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> {
  if (payload.length > MAX_PAYLOAD) throw new Error("Payload is too large.");
  const segments = jpegSegments(jpeg);
  // Never silently append a second secret behind a previous JPEG payload.
  for (const segment of segments) {
    if (
      segment.marker === 0xef &&
      equal(
        jpeg.subarray(segment.start + 4, segment.start + 4 + JPEG_MAGIC.length),
        JPEG_MAGIC,
      )
    )
      throw new Error(
        "This JPEG already contains a VeilDrop payload. Choose an original cover.",
      );
  }
  const insertAt =
    segments.find((s) => s.marker === 0xda)?.start ??
    segments.find((s) => s.marker === 0xd9)?.start ??
    jpeg.length;
  const parts: Uint8Array<ArrayBuffer>[] = [];
  const maxPart = 65535 - 2 - JPEG_MAGIC.length - 8;
  let offset = 0,
    seq = 0;
  while (offset < payload.length || (payload.length === 0 && seq === 0)) {
    const part = payload.subarray(
      offset,
      Math.min(payload.length, offset + maxPart),
    );
    parts.push(jpegPayloadSegment(seq++, payload.length, part));
    offset += part.length;
    if (payload.length === 0) break;
  }
  return concatBytes(
    jpeg.subarray(0, insertAt),
    ...parts,
    jpeg.subarray(insertAt),
  );
}

function extractJpeg(jpeg: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
  const segments = jpegSegments(jpeg);
  const parts: Uint8Array<ArrayBuffer>[] = [];
  let expectedTotal: number | undefined;
  let expectedSeq = 0;
  for (const s of segments) {
    if (s.marker !== 0xef || s.length < 2 + JPEG_MAGIC.length + 8) continue;
    const body = jpeg.subarray(s.start + 4, s.end);
    if (!equal(body.subarray(0, JPEG_MAGIC.length), JPEG_MAGIC)) continue;
    const seqOffset = JPEG_MAGIC.length;
    const seq = readU32be(body, seqOffset);
    const total = readU32be(body, seqOffset + 4);
    if (expectedTotal === undefined) expectedTotal = total;
    if (total !== expectedTotal || seq !== expectedSeq)
      throw new Error("Invalid VeilDrop JPEG payload sequence.");
    const data = body.subarray(seqOffset + 8);
    parts.push(data);
    expectedSeq++;
    const received = parts.reduce((n, p) => n + p.length, 0);
    if (received === expectedTotal) return concatBytes(...parts);
    if (received > expectedTotal)
      throw new Error("Invalid VeilDrop JPEG payload length.");
  }
  throw new Error("No VeilDrop payload found.");
}

export function detectCarrier(
  bytes: Uint8Array<ArrayBuffer>,
): CarrierKind | null {
  if (equal(bytes.subarray(0, 8), PNG_SIG)) return "png";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  )
    return "webp";
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8)
    return "jpeg";
  return null;
}

export function embedCarrier(
  kind: CarrierKind,
  bytes: Uint8Array<ArrayBuffer>,
  payload: Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> {
  if (kind === "png") return embedPng(bytes, payload);
  if (kind === "webp") return embedWebp(bytes, payload);
  return embedJpeg(bytes, payload);
}

export function extractCarrier(
  kind: CarrierKind,
  bytes: Uint8Array<ArrayBuffer>,
): Uint8Array<ArrayBuffer> {
  if (kind === "png") return extractPng(bytes);
  if (kind === "webp") return extractWebp(bytes);
  return extractJpeg(bytes);
}
