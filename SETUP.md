# GitHub + Vercel + Supabase setup

## 1. GitHub

Create a repository named VeilDrop, with the source files at its root (package.json
must be at the root). Preserve LICENSE. Commit package-lock.json. Never commit
.env.local, .next, node_modules, database URLs or generated secrets. GitHub Actions
runs install, typecheck, tests and production build.

## 2. Supabase

Create a NEW project or explicitly choose a dedicated existing empty project.
Do not run the fresh-project migration against unrelated application tables.
Apply supabase/migrations/202610210001_initial.sql with the SQL connector/editor.
The migration references auth.users and enables RLS with no browser grants for all
app tables. Account data comes through validated server routes; no service-role
key is exposed or required by the browser.

Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from the
project's API settings. The publishable key is intended for browser use; DB
credentials are private. Set DATABASE_URL to the Supabase transaction pooler
connection string from Connect, normally port 6543. Keep TLS certificate checking
on; follow Supabase's SSL instructions and CA requirements. Do not set
rejectUnauthorized=false to bypass connection errors. Use the pooler connection
for Vercel; no named prepared statements are used.

Configure Auth site URL and allowlisted redirect URLs for
https://YOUR-DOMAIN/auth/callback and the exact preview URL used in tests.
Set up production SMTP, appropriate email rate limits and bot protection before
public signup. Local test redirect: http://localhost:3000/auth/callback.

## 3. Secrets and Vercel

Generate secrets in a private terminal:

```sh
node scripts/generate-secrets.mjs
```

Store its outputs directly in Vercel environment variables. Do not paste them into
chat, commit them, or include them in screenshots. OPAQUE_SERVER_SETUP must remain
stable across deploys; losing/rotating it without migration breaks existing shares.
Back it up securely with a documented restore procedure.

Import the GitHub repo into Vercel as Next.js, Node 22 or newer. Install: npm ci.
Build: npm run build. Add all .env.example values to appropriate Preview and
Production scopes. Use separate Supabase projects and Paddle credentials for
preview/testing and production. NEXT_PUBLIC values require a rebuild.

Initially SECURE_SHARE_ENABLED=false and BILLING_ENABLED=false. Local Studio works.
After Supabase integration tests pass, set SECURE_SHARE_ENABLED=true on preview.
The daily /api/maintenance cron requires CRON_SECRET, automatically sent by Vercel.
Expiry is enforced by unlock endpoints even if cron is late. Commercial Vercel
usage requires an appropriate commercial plan; verify current provider terms.

## 4. Paddle

See docs/PAYMENTS.md. Keep sandbox/live credentials isolated. A GitHub, Vercel or
Supabase connector does not create an approved payment merchant account.

## 5. Run validation

npm ci; npm run typecheck; npm test; npm run build; npm audit --omit=dev.
Then perform docs/LAUNCH_CHECKLIST.md against the real preview, including separate
sender and recipient sessions. Do not interpret a successful build as a security audit.
