# Deployment acceptance — fill with evidence, not assumptions

- [ ] npm ci, typecheck, tests, build and current dependency/security review pass.
- [ ] Phone and desktop browser tests: Chrome, Firefox, Safari; keyboard navigation.
- [ ] Real PNG/JPEG/WebP sample round-trip, unchanged decoded cover and identical recovered bytes.
- [ ] Small files, Unicode filenames, zero-byte file, wrong password, tampering,
      invalid images, oversize input, canceled selection and memory-pressure behavior.
- [ ] Supabase signup/email callback/session refresh/signout works on actual domains.
- [ ] Account A cannot inspect, revoke or bill as account B; anon cannot read tables.
- [ ] Concurrent create calls cannot exceed account monthly quota.
- [ ] Actual HTTP unlock tests: ten failures, abandoned session, final attempt success,
      session replay, concurrent finish, expiry, revoke racing finish and server restart.
- [ ] Daily cleanup works with auth; server checks enforce expiry without cron.
- [ ] OPAQUE setup survives deploy and restore; no secrets in logs or repository.
- [ ] Paddle sandbox purchase both plans; portal identity; cancellation; plan changes;
      bad signature, duplicate event, stale event, DB retry and missing intent behavior.
- [ ] Fix simultaneous-checkout duplication and define refund/chargeback handling;
      implement/test reconciliation before making paid service reliability promises.
- [ ] Support contact, legal business identity, country, privacy retention/deletion,
      refund terms and merchant approval finalized.
- [ ] Monitor errors and abuse; configure SMTP, backup retention, budget alerts and WAF.
- [ ] Independent security review findings triaged and high-risk items resolved.
- [ ] Preview verified; rollback commit and database backup identified.
- [ ] Enable live billing only after appropriate review; no fake compliance claims.

Deliver URLs, commit SHA, migration result, test output and unresolved issues.
