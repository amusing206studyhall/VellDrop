# VeilDrop

Private files, familiar images. By **Md Taufiqur Rahman**.

**1.1.0-beta.1 — deployment handoff, not an audited commercial release.**
This repository includes a working Next.js web application, browser encryption,
PNG/WebP/JPEG carriers, Supabase account integration, server-managed online
unlocking, monthly quotas, a dashboard, and Paddle subscription integration.

Start with `START-HERE.md`, then `CLAUDE_HANDOFF.md`.

## Quick start

Requires Node.js 22 or newer.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. Local Studio requires no cloud credentials.
Online sharing needs Supabase Auth/PostgreSQL and the secrets described in SETUP.md.
No file-storage bucket is needed: users deliver their carrier files themselves.

```sh
npm run typecheck
npm test
npm run build
npm audit --omit=dev
```

## Product

| Plan | Monthly USD | Shares per UTC calendar month | Maximum expiry |
| ---- | ----------: | ----------------------------: | -------------: |
| Free |           0 |                            10 |          1 day |
| Pro  |           6 |                           200 |         7 days |
| Plus |          12 |                         1,000 |        30 days |

Local Studio is free with unlimited operations. All tiers use the same encryption
and the same 250 MiB document / 100 MiB cover / 350 MiB output limits. Browser
memory may impose lower practical limits. This engine is not streaming.
Plans are individual accounts, not teams. No storage quota is advertised.
Prices are launch hypotheses, not demonstrated market demand.

## Security boundaries

- AES-256-GCM; PBKDF2-HMAC-SHA-256 (600,000 iterations) for local mode.
- Secure Share: OPAQUE with the package's default key stretching, random file key,
  HKDF-derived wrapping key, and authenticated encryption. Do not describe local mode as Argon2id.
- OPAQUE registration/login strings are URL-safe Base64. Stored as UTF-8 bytes.
- Ten unsuccessful or abandoned online login starts lock the share; success resets
  the counter. One pending login per share; pending sessions expire after five minutes.
- An attacker who knows a share ID can deliberately exhaust its attempts. This
  availability tradeoff is not fixed by password cryptography.
- Revocation prevents future server release. It cannot revoke cached keys or copies.
- Deleting a wrapped key from the live database is not guaranteed physical erasure
  from backups, logs, snapshots, or a recipient's device.
- The image is a detectable container, not an invisibility guarantee. EXIF and
  other original cover metadata may remain. Photo transformations can remove payloads.
- No independent audit, production Supabase test, real payment test or browser QA
  is claimed. See VALIDATION.md for actual evidence.

## Repository map

`app/`: pages and API routes. `components/`: interactive UI.
`lib/`: crypto, parsers, plans, auth, database and billing helpers.
`supabase/migrations/`: fresh-project schema and restrictive table access.
`tests/`: binary/crypto/OPAQUE/schema checks. `docs/`: deployment, business,
security and operational handoff. `package-lock.json`: reproducible dependencies.

MIT source license; copyright © 2026 Md Taufiqur Rahman. This is source code,
not a signed Windows/macOS/Linux installer. Modern browsers are the delivery target.
