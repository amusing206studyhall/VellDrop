# Business model and market reasoning

Research checked 21 October 2026. Proposed VeilDrop prices are experiments, not a
forecast and not competitor quotations. This app does not reproduce competitors'
branding, layouts or security certifications.

## What existing products teach us

| Reference            | Observed offering                                                               | Implication for VeilDrop                                                                               |
| -------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Proton Drive         | Free encrypted storage plus paid plans; passwords and link expiry               | Basic encryption should stay free; strong established competition means privacy alone is insufficient  |
| Tresorit FileSharing | Business sharing with expiry, passwords, access controls, integrations and logs | Workflow and management can be sold; do not advertise enterprise capabilities before implementation    |
| Paddle               | Merchant-of-record checkout and subscriptions, public standard fee 5% + $0.50   | Low-price monthly plans have meaningful payment overhead; seller approval is separate from integration |

Sources (primary):

- https://proton.me/drive/pricing
- https://proton.me/drive/file-sharing/password-protection
- https://tresorit.com/pricing/file-sharing
- https://www.paddle.com/pricing

## Positioning

A small, local-first document utility with optional online access control and
ordinary image carriers. Start with students and independent professionals who
already exchange documents as attachments. Do not target regulated enterprise
workloads before independent review, contractual controls and operational maturity.
The manual carrier-delivery step is both the privacy advantage and a usability cost.
Test whether people actually want it before buying advertising.

## Three plans, all individual

| Plan | USD/month | Shares/month |  Expiry | Local Studio         |
| ---- | --------: | -----------: | ------: | -------------------- |
| Free |         0 |           10 |   1 day | Unlimited operations |
| Pro  |         6 |          200 |  7 days | Same encryption      |
| Plus |        12 |        1,000 | 30 days | Same encryption      |

Quotas count created shares, including later-revoked ones, per UTC calendar month.
They are enforced under a PostgreSQL advisory transaction lock. Local usage is not
metered, since users can run the open-source code themselves. All plans have the
same in-memory file limits; paid plans do not pretend to offer streaming or teams.
No annual plans yet: validate retention and operating costs first. Self-hosted
setup/support is a future service opportunity, not an implemented SKU.

## Illustrative economics, not expected income

Using the public standard fee as a modeling assumption, a $6 payment leaves $5.20
and a $12 payment leaves $10.90 before hosting, refunds, taxes on your business,
support and other costs. Paddle invites bespoke pricing discussions below $10.
With 70 Pro and 30 Plus subscribers: gross $780/month; modeled payment fees $89;
$691 remains. With an ASSUMED $100/month fixed operating budget, $591 remains
before labor and other costs. This is not profit or a promise of customers.
That $100 budget needs replacement with real Vercel/Supabase/SMTP/monitoring quotes.
At that assumed budget, roughly 20 Pro subscriptions cover only the fixed budget
at the modeled net rate. Acquisition cost and support time can erase that margin.

## First validation milestones

Recruit 10 testers using non-sensitive files. Measure successful sender-to-recipient
recovery and the number who return within two weeks. Interview people who abandon
the flow. Then test willingness to pay for expiry periods and higher share volume.
Measure conversion, churn, refunds, support time and gross margin. Do not use fake
customer logos, testimonials, certifications, scarcity, or security guarantees.

MIT allows commercial use and competing forks. Income must come from hosting,
convenience, maintenance and service quality, not exclusive rights to AES.
