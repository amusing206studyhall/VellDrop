# Claude implementation and deployment instruction

You are completing VeilDrop for its owner, **Md Taufiqur Rahman**. Use the attached
source repository and your connected GitHub, Vercel and Supabase tools. The owner
wants a working commercial web product, not a fresh conceptual scaffold or screenshots.
Do the work you can, test it, deploy a preview and report exact remaining blockers.

## Read first

README.md, VALIDATION.md, SETUP.md, docs/BUSINESS_MODEL.md, docs/THREAT_MODEL.md,
docs/PAYMENTS.md and docs/LAUNCH_CHECKLIST.md. Inspect the actual code. Historical
labels such as publish-ready are not evidence of an audit or live deployment.
This is v1.1.0-beta.1, built from the earlier v1.0 source and corrected for Supabase.

## Product decisions already made

- Name VeilDrop; retain MIT and Md Taufiqur Rahman in license, metadata and footer.
- Three individual plans: Free $0 / Pro $6 monthly / Plus $12 monthly.
- Server-created shares per UTC calendar month: 10 / 200 / 1,000.
- Maximum expiry: 1 / 7 / 30 days. Encryption quality identical across plans.
- Local Studio unlimited operations and no account. No false cloud-storage quotas.
- Current limits: 250 MiB document, 100 MiB cover, 350 MiB carrier. In-memory engine;
  do not promise GB-sized streaming or higher paid size limits without implementing it.
- PNG/WebP/JPEG carriers; user picks their own cover and password. Keep original
  attachments intact. Never silently replace a rejected cover with a default image.
- Supabase Auth + Postgres; Vercel Next.js; GitHub source/CI; Paddle billing.
- Do not replace this working UI with generic placeholder pages or fabricated stats.

## Execution order

1. Inspect files and run npm ci, npm run typecheck, npm test, npm run build and audit.
   Fix failures. Confirm OPAQUE string encoding and wrapped-key recovery, not just
   TypeScript compilation. Preserve package-lock.json. Review current advisories.
2. Select the owner's GitHub target and an EMPTY/dedicated Supabase project. If
   account/project choices are ambiguous, ask a single short question. Do not
   overwrite an unrelated existing project or deploy into another person's account.
3. Apply the migration to Supabase. Inspect RLS/grants and prove anon/authenticated
   access cannot expose registration records, wrapped keys, billing or login state.
4. Configure email Auth, production SMTP, exact callback URLs and server-side user
   validation. Test with two accounts and separate recipient browser sessions.
5. Generate private secrets directly into authorized secret stores. Never print
   them in chat, include them in Git commits, or use NEXT_PUBLIC for server secrets.
   Keep OPAQUE setup stable. Use the Supabase pooler with verified TLS.
6. Create/import GitHub repository into Vercel. Configure Preview with test accounts
   and sandbox payment credentials. Initially keep secure sharing and billing off.
7. Finish missing launch engineering in the review docs. In particular implement
   reliable duplicate-checkout prevention, payment refund/dispute policy and daily
   reconciliation; test quota/unlock/revoke concurrency using a real database and
   HTTP routes, including aborted login sessions and request replay.
8. Run browser/device acceptance. Check CSP/nonces, cookies, email auth, chosen cat
   image preservation, PNG/JPEG/WebP recovery, wrong passwords, corruption and memory
   limits. The original environment could not run browser QA; do not skip this.
9. Enable Secure Share only after its preview tests pass. It counts ten failed or
   abandoned starts; success resets. One pending session per share. Explain lockout
   denial-of-service and limits of revocation clearly. Do not call DB deletion
   permanent destruction across backups or clients. No invented zero-knowledge claims.
10. Use Paddle sandbox and test complete lifecycle. The code binds server-created
    checkout intents to users and verifies webhooks before entitlements change.
    Do not grant paid access from a success URL, client plan field or email match.
11. Request only missing owner information: support email, legal seller name/address
    and jurisdiction, refund/cancellation decisions, retention policy, payment
    merchant account status, domain choice and approved hosting budget. Never invent
    legal details. Complete production legal pages with review appropriate to launch.
12. Publish a free/beta deployment if it passes its applicable checks while billing
    remains disabled for unresolved commercial blockers. Do not enable paid checkout
    merely because it compiles. Obtain appropriate authorization for new paid services.
13. For live commercial release, finish independent security review, production
    merchant approval, monitoring, backup/restore and final acceptance. An automated
    code review alone is not an independent cryptographic audit.

## Required delivery

Working repository URL, preview URL, production URL if released, deployed commit,
migration version, environment-variable NAMES configured (never values), completed
acceptance results with evidence, and a short remaining-blockers list. Demonstrate
one end-to-end send/recover flow and sandbox purchase/cancel flow. Provide rollback
instructions. Do not claim a connector action occurred unless its result verifies it.

## Boundaries

No unauthorized email sending or live charges. Do not add tracking or file uploads
without a product decision and matching privacy disclosure. Do not make the core
local encryption weaker for free users. No fabricated customers/certifications.
Native desktop/mobile applications, organizations/SSO and cloud carrier hosting
are future scope, not existing features to advertise.
