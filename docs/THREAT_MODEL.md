# Security review notes

Protected assets: document bytes and metadata, passwords, file/wrapping keys,
OPAQUE server setup, account sessions, subscription ownership and quota integrity.

Attackers: carrier thieves, remote unauthenticated users, other authenticated
accounts, forged/replayed webhooks, malformed files and concurrent unlock requests.
Not protected: compromised endpoints, malicious browser extensions, malicious
replacement frontend code, screenshots of recovered content, previously cached
file keys, colluding recipients or backups held outside the application's control.

Review priorities:

1. OPAQUE library protocol/version review, identifiers, registration credential
   binding, setup-secret lifecycle, database-backup threat model.
2. Online attempt exhaustion can be abused for denial of service. The implemented
   policy counts unsuccessful/abandoned starts, not provably wrong passwords only.
3. Full API concurrency tests: start/finish/revoke/expiry interleavings and replay.
4. Canonical parsing: malformed PNG/JPEG/WebP, duplicate carrier payloads, existing
   metadata, corrupt lengths, decompression/memory exhaustion, image compatibility.
5. CSP with actual Next/Paddle/Supabase flows, XSS, callback redirects, cookie refresh,
   authentication/session expiry and cross-account authorization.
6. Payment replay/order/identity tests and reconciliation, duplicate subscriptions,
   disputed/refunded subscription policy, payment failures and outages.
7. Resource abuse: Vercel WAF/rate limiting, trustworthy edge IP headers, bounded
   request streaming (current boundedJson validates after reading request.text),
   signup bots and aggregate OPAQUE CPU/database usage.
8. Operational backups, least-privilege DB credentials, secret rotation, dependency
   updates, logging redaction, incident response and restoring revoked records safely.

The current browser engine buffers files. Stated size limits are guardrails, not
cross-device performance guarantees. Cover metadata may disclose location or camera
information. The carrier image itself is not cryptographically bound to the file;
container replacement must not be described as sender-authenticity protection.

Revocation means live service access revocation. Database NULL updates cannot be
advertised as guaranteed cryptographic destruction from every backup or recipient.
