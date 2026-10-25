# Validation record — 22 October 2026

Version: 1.1.0-beta.1. Source package for Claude deployment handoff.

| Check | Result | Scope |
|---|---|---|
| Dependency installation | Passed | npm install produced included package-lock.json |
| TypeScript typecheck | Passed | npm run typecheck |
| Automated tests | 11 passed, 0 failed | npm test |
| Production build | Passed | Next.js 16.4.2, npm run build (webpack) |
| Production dependency audit | 0 reported known vulnerabilities | npm audit --omit=dev; snapshot, not a security audit |
| Browser visual/end-to-end QA | Not run | Managed preview supplied unsupported --host/--strictPort options to Next.js |
| Real Supabase account/database integration | Not run | Requires owner's project configuration |
| Paddle sandbox/live lifecycle | Not run | Requires owner's merchant setup and callback endpoint |
| Independent security audit | Not performed | Required before claiming audited security |

Tests cover three carrier round trips, password-encrypted binary/Unicode filename
recovery, wrong-password and ciphertext-tamper rejection, fresh salt/nonce,
malformed header rejection, actual OPAQUE registration/login export-key recovery
of an encrypted document, embedded PostgreSQL schema permissions/revocation,
unknown billing price denial and size-policy constants.

The database test uses PGlite with mock auth.users and roles. It is not proof of
real Supabase API authorization or Vercel concurrency. Carrier fixtures include
minimal containers; real image decoder/browser compatibility still needs testing.
No full-sized memory/performance benchmark was run.

Evidence files: docs/validation/typecheck.log, tests.log, build.log, audit.json.
No deployment URL, native installer, live billing, or external security review is
included or implied. CLAUDE_HANDOFF.md lists the work needed to reach launch.

Remaining implementation/review items include duplicate concurrent checkout
prevention, refund/dispute entitlement policy, automatic billing reconciliation,
production account deletion/retention decisions, abuse controls and API concurrency
acceptance. These are explicitly assigned in the handoff rather than hidden behind
marketing claims. Core encryption is the same across all plans.
