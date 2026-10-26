# Operational handoff

Daily cron removes expired login sessions, expires shares, disables exhausted
shares and removes rate buckets older than one day and audit events older than
90 days. Expiry is checked during unlock even when cleanup has not run.

Share records and billing mappings are not automatically purged. Owner must choose
and publish retention periods. Account erasure currently requires an operator-led
process: cancel subscriptions, address legal billing retention, then delete the
Supabase auth user (owned shares/entitlements/intents cascade). Do not promise a
self-service erase button. Backups follow separate provider retention settings.

Monitor HTTP error rates, database connections, signup/OPAQUE abuse, cron health,
webhook delivery and failed account email. Never log request bodies, OPAQUE state,
passwords, management fragments, database URLs or complete payment payloads.
Maintain billing reconciliation and revocation-safe restore procedures. A database
restore may revive deleted key material; reapply revocations before reopening access.

Rollback: redeploy a tested prior commit with compatible schema. Do not roll back
OPAQUE setup randomly. Use separate preview databases; never run destructive test
cleanup on the production database. License is MIT; keep copyright attribution.
