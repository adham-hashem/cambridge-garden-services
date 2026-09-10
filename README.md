# Cambridge Garden Services

Production-ready Vite + React frontend with Vercel serverless API routes and Supabase persistence.

## Local Setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Copy `.env.example` to `.env.local` and fill in the values.

3. Run the app:

   ```bash
   npm run dev
   ```

For full API behavior locally, run with Vercel dev so `/api/*` functions are available:

```bash
npx vercel dev
```

## Vercel Environment Variables

Set these in the Vercel project settings:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_USERNAME
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
SITE_ORIGIN
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
RESEND_API_KEY
RESEND_FROM_EMAIL
BOOKING_EMAIL_TO
```

`ADMIN_USERNAME` and `ADMIN_PASSWORD` are the static admin credentials. Change them in Vercel without changing code.

`ADMIN_SESSION_SECRET` must be a random string of at least 32 characters. `SITE_ORIGIN` should be the production URL, for example `https://www.example.com`.

If admin login returns `500`, verify these variables exist in the deployed Vercel environment and redeploy:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET` with at least 32 characters
- `SITE_ORIGIN` as a full URL, for example `https://cambridge-garden-services.vercel.app`

`TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` enable booking notifications to Telegram. Keep the bot token server-only in Vercel; never commit it to the repo.

`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and `BOOKING_EMAIL_TO` enable booking notifications by email through Resend. `RESEND_FROM_EMAIL` must use a sender/domain verified in Resend, for example `Cambridge Garden Services <bookings@cambridgegardenservices.co.uk>`. `BOOKING_EMAIL_TO` can contain one email or multiple comma-separated emails.

## Supabase Migrations Through GitHub Actions

The repo includes `.github/workflows/supabase-migrations.yml`. Add this GitHub Actions secret:

```text
SUPABASE_DB_URL
```

Use the Postgres connection string from Supabase project settings. Pushing migrations to `main` runs:

```bash
supabase db push --db-url "$SUPABASE_DB_URL"
```

Do not paste migration SQL manually into the Supabase SQL editor; add new files under `supabase/migrations/` and push them through GitHub Actions.

## Verification

```bash
npm run typecheck
npm run lint
npm run build
```
