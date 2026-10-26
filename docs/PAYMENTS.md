# Paddle setup and payment acceptance

Paddle integration is code, not merchant approval. Verify your eligibility,
business category, payout method and onboarding requirements directly with Paddle.
No bKash/Nagad integration is included. Do not silently substitute a payment
provider without updating the code, legal terms, tests and account approvals.

1. Create a sandbox account. Create recurring monthly USD prices: Pro $6, Plus $12.
2. Configure the default payment link/approved checkout domain for this application.
3. Set NEXT_PUBLIC_PADDLE_ENV=sandbox, browser client token, server API key,
   PADDLE_PRO_PRICE_ID and PADDLE_PLUS_PRICE_ID.
4. Configure /api/paddle/webhook and subscribe to subscription lifecycle events
   including created, activated, updated, canceled, paused, resumed and past_due.
   Store the notification secret in PADDLE_WEBHOOK_SECRET.
5. Set BILLING_ENABLED=true on sandbox preview only after account routes work.
6. Sign in and buy both plans with sandbox methods. Wait for verified webhooks;
   a success redirect never grants paid privileges.
7. Test cancellation, past_due, resume, upgrade/downgrade, duplicate delivery,
   invalid signatures, stale/out-of-order events, missing intent and DB outages.
8. Open Manage subscription and verify the portal belongs to that signed-in user.
9. Prevent accidental duplicate subscriptions during concurrent checkouts; the
   current server blocks existing subscriptions, but simultaneous new checkout
   creation remains a required review/test item. Resolve it before live billing.
10. Finalize support, refund/cancellation policy and seller details. Complete live
    merchant approval. Create separate live prices and credentials. Enable live
    billing only after launch review.

Implementation: server creates an opaque checkout intent bound to authenticated
user and allowed price; creates a Paddle transaction; browser opens that transaction.
Webhook signatures are checked by the official SDK before parsing raw snake_case
fields. Event insert and entitlement change share a DB transaction; duplicate
IDs are ignored; occurred_at prevents older events overwriting newer state.
Subscription ownership comes from server-created intent or an existing binding,
not email or a user-supplied plan. Unknown prices grant no paid plan.
Database errors return 500 so the provider can retry. Event data stored locally is
minimized to ID/type/time; subscription/customer identifiers remain for servicing.

Reconcile missed notifications against Paddle daily before relying on subscriptions
for a commercial SLA. Automated reconciliation is not included in this beta.
Refund/chargeback policy and entitlement treatment require merchant decisions and
additional adjustment-event handling. Do not claim these are complete.

Primary references:
https://developer.paddle.com/webhooks/about/signature-verification/
https://developer.paddle.com/webhooks/about/how-webhooks-work/
https://developer.paddle.com/api-reference/transactions/create-transaction/
https://www.paddle.com/pricing
