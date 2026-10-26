import test from "node:test";
import assert from "node:assert/strict";

test("policy constants are sane", async () => {
  const source = await import("../lib/crypto");
  assert.equal(source.MAX_DOCUMENT_BYTES, 250 * 1024 * 1024);
  assert.equal(source.MAX_CARRIER_BYTES, 100 * 1024 * 1024);
  assert.equal(source.MAX_OUTPUT_BYTES, 350 * 1024 * 1024);
});
