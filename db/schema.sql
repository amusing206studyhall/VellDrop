CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS shares (
  id uuid PRIMARY KEY,
  opaque_registration_record bytea NOT NULL,
  wrapped_dek bytea,
  wrap_salt bytea,
  wrap_nonce bytea,
  manage_token_hash text NOT NULL,
  carrier_kind text NOT NULL DEFAULT 'png' CHECK (carrier_kind IN ('png','webp','jpeg')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts integer NOT NULL DEFAULT 10 CHECK (max_attempts BETWEEN 1 AND 100),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','destroyed','expired','revoked')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  destroyed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_shares_status_expiry ON shares(status, expires_at);

CREATE TABLE IF NOT EXISTS share_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id uuid NOT NULL REFERENCES shares(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_share_audit_share_time ON share_audit_events(share_id, created_at);

CREATE TABLE IF NOT EXISTS opaque_login_sessions (
  id uuid PRIMARY KEY,
  share_id uuid NOT NULL REFERENCES shares(id) ON DELETE CASCADE,
  server_login_state bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_opaque_sessions_expiry ON opaque_login_sessions(expires_at);

CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  rate_key text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count >= 0)
);

CREATE TABLE IF NOT EXISTS billing_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  raw_json jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS billing_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paddle_customer_id text,
  paddle_subscription_id text UNIQUE,
  email text,
  plan text NOT NULL,
  status text NOT NULL,
  raw_event_id text UNIQUE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_email ON billing_entitlements(email);

ALTER TABLE shares ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE billing_entitlements ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE billing_entitlements ADD COLUMN IF NOT EXISTS event_occurred_at timestamptz NOT NULL DEFAULT '1970-01-01';
CREATE INDEX IF NOT EXISTS shares_owner_created ON shares(owner_id,created_at);
CREATE INDEX IF NOT EXISTS billing_user ON billing_entitlements(user_id);
CREATE TABLE IF NOT EXISTS checkout_intents(id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,price_id text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON shares FROM anon, authenticated;
ALTER TABLE share_audit_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON share_audit_events FROM anon, authenticated;
ALTER TABLE opaque_login_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON opaque_login_sessions FROM anon, authenticated;
ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON rate_limit_buckets FROM anon, authenticated;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON billing_events FROM anon, authenticated;
ALTER TABLE billing_entitlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON billing_entitlements FROM anon, authenticated;
ALTER TABLE checkout_intents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON checkout_intents FROM anon, authenticated;

-- No browser policies: all application data is accessed by validated server routes.
-- No plaintext documents or carriers are uploaded, so no Storage bucket is needed.
