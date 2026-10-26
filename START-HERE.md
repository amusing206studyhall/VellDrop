# Start here

1. Upload this ZIP to Claude and paste the short prompt below.
2. Claude should read CLAUDE_HANDOFF.md and VALIDATION.md before changing anything.
3. It should use your GitHub, Vercel and Supabase connectors to deploy a tested preview.
4. You supply business details and complete payment-provider onboarding privately.
5. Real billing stays disabled until the sandbox checkout/webhook/cancellation flow
   and the production launch requirements pass.

## Prompt to paste

I own VeilDrop. Use this attached repository to finish and deploy my web app using
my connected GitHub, Vercel and Supabase accounts. Read CLAUDE_HANDOFF.md first and
follow its acceptance tests. Preserve the identity Md Taufiqur Rahman and the MIT
license. Implement and verify the app, do not just give instructions or a mockup.
Keep Free, Pro ($6/month) and Plus ($12/month) with the server-enforced quotas.
Use Paddle sandbox until merchant approval and payment tests pass. Do not put
secrets in chat or GitHub. Fix any failures you find, deploy a preview, then report
working URLs, test evidence and any remaining launch blockers. Ask me only for
missing account choices, business details or approvals that you actually need.

## What is in this archive?

The complete source tree, lockfile, pages, route handlers, SQL migration, tests,
commercial plan and deployment prompt. There are no account credentials, compiled
installers, or paid third-party subscriptions inside it.

## Product flow

Local: select document → select your cover → set/confirm password → create carrier.
Recipient: select original carrier in Studio → password → recover file.
Online: sign in → create share with expiry → send carrier + recipient URL → send
password separately. Recipient uses the URL and original carrier. Sender can
revoke future unlocks from Dashboard.
