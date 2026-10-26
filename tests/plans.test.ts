import test from "node:test";
import assert from "node:assert/strict";
import { planFromPrice } from "../lib/plans";
test("unknown or missing prices never grant paid access", () => {
  assert.equal(planFromPrice(""), null);
  assert.equal(planFromPrice("attacker_price"), null);
});
