# Architecture

Browser → Next.js on Vercel → Supabase PostgreSQL.
Supabase Auth provides passwordless account sessions; Paddle provides billing.
GitHub stores source and runs CI. No document-storage provider is used.

## Local mode

The browser reads the document and selected cover into memory. PBKDF2 with a random
16-byte salt and 600,000 SHA-256 iterations derives an AES-256-GCM key. A fresh
12-byte nonce is used. The document filename/type/size and contents are encrypted.
A versioned header plus ciphertext is embedded in PNG vpLd, WebP VLDp or JPEG APP15.
The recipient reverses the process locally. No password recovery or enforced
attempt limit is possible in this mode.

## Online mode

The client generates a random AES data key. OPAQUE registration establishes an
export key. HKDF with a new salt derives the wrapping key; AES-GCM wraps the data
key. Only registration material and the wrapped data key go to the server. The
ciphertext carrier stays on the sender's device.

A recipient authenticates with OPAQUE. Server start counts an attempt under a
locked share row; only one pending session is allowed. Finish locks both rows,
consumes the session, verifies the proof, and conditionally releases wrapped key
material. Success resets the counter. Abandoned sessions count after expiry.
Last failure or expiry prevents new release. Previously released material can be
cached; this is not DRM or remote deletion.

## Trust boundaries

Server routes validate Supabase getUser responses before account operations.
All secret app tables have RLS enabled and no anon/authenticated grants. The
server DB connection is privileged and must validate owner IDs in every query.
RLS alone does not protect a route that uses that connection incorrectly.

OPAQUE setup and database compromise together change the offline guessing threat
model. A malicious hosting operator or injected browser JavaScript can capture
future passwords. No absolute zero-knowledge or unhackable claim is made.

## What is deliberately not built

Cloud carrier uploads, large-file streaming, resumable transfers, organizations,
SSO, signed desktop installers, mobile-native apps, legal certification and
independent security audit. They are not advertised as paid functionality.
