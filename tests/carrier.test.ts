import test from "node:test";
import assert from "node:assert/strict";
import { detectCarrier, embedCarrier, extractCarrier } from "../lib/carrier";

const png1x1 = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  ),
);

function webpContainer(): Uint8Array<ArrayBuffer> {
  // Minimal RIFF/WEBP container with a VP8X-sized placeholder chunk.
  const body = new Uint8Array([
    0x56,
    0x50,
    0x38,
    0x58, // VP8X
    0x0a,
    0x00,
    0x00,
    0x00, // size 10
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
  ]);
  const out = new Uint8Array(12 + body.length);
  out.set([0x52, 0x49, 0x46, 0x46], 0);
  const size = 4 + body.length;
  out.set(
    [size & 255, (size >>> 8) & 255, (size >>> 16) & 255, (size >>> 24) & 255],
    4,
  );
  out.set([0x57, 0x45, 0x42, 0x50], 8);
  out.set(body, 12);
  return out;
}

function jpegSkeleton(): Uint8Array<ArrayBuffer> {
  return Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]);
}

for (const [kind, carrier] of [
  ["png", png1x1],
  ["webp", webpContainer()],
  ["jpeg", jpegSkeleton()],
] as const) {
  test(`${kind} carrier round trip`, () => {
    assert.equal(detectCarrier(carrier), kind);
    const payload = new TextEncoder().encode("VeilDrop test payload");
    const embedded = embedCarrier(kind, carrier, payload);
    assert.equal(detectCarrier(embedded), kind);
    assert.deepEqual(
      Array.from(extractCarrier(kind, embedded)),
      Array.from(payload),
    );
  });
}
