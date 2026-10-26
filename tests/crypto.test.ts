import test from "node:test";
import assert from "node:assert/strict";
import * as opaque from "@serenity-kit/opaque";
import {
  encryptWithPassword,
  decryptWithPassword,
  parsePayload,
  serializePayload,
  generateDataKey,
  encryptWithDataKey,
  wrapDataKey,
  unwrapAndDecrypt,
} from "../lib/crypto";
import { unb64 } from "../lib/bytes";
const password = "test-only-long-passphrase-2026";
const file = new File([new Uint8Array([0, 1, 255, 42, 99])], "বাংলা.pdf", {
  type: "application/pdf",
});
test("password encryption preserves binary content and Unicode filename", async () => {
  const encrypted = await encryptWithPassword(file, password);
  const out = await decryptWithPassword(
    parsePayload(serializePayload(encrypted)),
    password,
  );
  assert.equal(out.name, file.name);
  assert.deepEqual(out.bytes, new Uint8Array(await file.arrayBuffer()));
});
test("wrong password and altered ciphertext are rejected", async () => {
  const encrypted = await encryptWithPassword(file, password);
  await assert.rejects(decryptWithPassword(encrypted, password + "wrong"));
  encrypted.ciphertext[0] ^= 1;
  await assert.rejects(decryptWithPassword(encrypted, password));
});
test("salt and nonce vary for repeated encryption", async () => {
  const a = await encryptWithPassword(file, password),
    b = await encryptWithPassword(file, password);
  assert.notDeepEqual(a.salt, b.salt);
  assert.notDeepEqual(a.iv, b.iv);
  assert.notDeepEqual(a.ciphertext, b.ciphertext);
});
test("malformed payload header is rejected", () => {
  assert.throws(() => parsePayload(new Uint8Array([255, 255, 255, 255])));
});
test("OPAQUE registration/login export key decrypts the actual wrapped document key", async () => {
  await opaque.ready;
  const setup = opaque.server.createSetup(),
    id = crypto.randomUUID();
  const start = opaque.client.startRegistration({ password });
  const response = opaque.server.createRegistrationResponse({
    serverSetup: setup,
    userIdentifier: id,
    registrationRequest: start.registrationRequest,
  });
  const registration = opaque.client.finishRegistration({
    password,
    clientRegistrationState: start.clientRegistrationState,
    registrationResponse: response.registrationResponse,
  });
  const { key, iv } = await generateDataKey();
  const encrypted = await encryptWithDataKey(file, key, iv);
  const wrapped = await wrapDataKey(key, unb64(registration.exportKey));
  const login = opaque.client.startLogin({ password });
  const server = opaque.server.startLogin({
    serverSetup: setup,
    userIdentifier: id,
    registrationRecord: registration.registrationRecord,
    startLoginRequest: login.startLoginRequest,
  });
  const finish = opaque.client.finishLogin({
    password,
    clientLoginState: login.clientLoginState,
    loginResponse: server.loginResponse,
  });
  assert.ok(finish);
  opaque.server.finishLogin({
    serverLoginState: server.serverLoginState,
    finishLoginRequest: finish.finishLoginRequest,
  });
  assert.equal(finish.exportKey, registration.exportKey);
  const out = await unwrapAndDecrypt(
    unb64(finish.exportKey),
    wrapped.salt,
    wrapped.nonce,
    wrapped.wrapped,
    { version: 1, mode: "random", ...encrypted },
  );
  assert.deepEqual(out.bytes, new Uint8Array(await file.arrayBuffer()));
  const wrong = opaque.client.startLogin({ password: password + "bad" });
  const wrongServer = opaque.server.startLogin({
    serverSetup: setup,
    userIdentifier: id,
    registrationRecord: registration.registrationRecord,
    startLoginRequest: wrong.startLoginRequest,
  });
  assert.equal(
    opaque.client.finishLogin({
      password: password + "bad",
      clientLoginState: wrong.clientLoginState,
      loginResponse: wrongServer.loginResponse,
    }),
    undefined,
  );
});
