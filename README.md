# Lost Hills CRM

Internal CRM for artist outreach campaigns and Spotify enrichment.

## Setup

1. Install dependencies:

```bash
pnpm install
pnpm approve-builds
```

2. Configure `.env.local`:
   - `DATABASE_URL` should point to a Postgres database.
   - Update `NEXTAUTH_URL` when deploying (e.g. `https://admin.crm.losthills.io`).

3. Push the Prisma schema:

```bash
pnpm prisma db push
```

4. Start the dev server:

```bash
pnpm dev
```

## Importing artists

- Go to `/artists`.
- Upload the CSV from `/Users/max/Documents/Dev/Tools/spotify-scrape/output.csv`.
- Click "Sync Spotify" on any row to enrich the artist with Spotify data.

## Automated Spotify Sync

The app automatically scans all artists for new releases daily at 2 AM UTC via Vercel Cron Jobs. Artists are synced if:
- They haven't been synced in the last 7 days, OR
- They're marked with `needsSync: true`

The cron job creates a `SpotifySyncJob` which is processed by the sync worker. You can also manually trigger a sync from the Artists page using the "Sync all Spotify" button.

## Deployment notes

- Use Vercel Postgres or another Postgres provider.
- Add the env vars from `.env.local` in Vercel.
- Add `CRON_SECRET` environment variable in Vercel (generate a random string for security).
- Set the Google OAuth redirect URL to:
  - `https://admin.crm.losthills.io/api/auth/callback/google`
