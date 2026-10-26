import type { PoolClient } from "pg";
export async function expireShares(client: PoolClient) {
  await client.query(
    "DELETE FROM opaque_login_sessions WHERE expires_at<=now()",
  );
  await client.query(
    "UPDATE shares SET status='expired',wrapped_dek=NULL,wrap_salt=NULL,wrap_nonce=NULL,updated_at=now() WHERE status='active' AND expires_at<=now()",
  );
  await client.query(
    "UPDATE shares s SET status='destroyed',wrapped_dek=NULL,wrap_salt=NULL,wrap_nonce=NULL,updated_at=now() WHERE status='active' AND attempts>=max_attempts AND NOT EXISTS(SELECT 1 FROM opaque_login_sessions l WHERE l.share_id=s.id AND l.expires_at>now())",
  );
}
