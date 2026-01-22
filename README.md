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
   - Update `NEXTAUTH_URL` when deploying (e.g. `https://admin.losthills.io`).

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

## Deployment notes

- Use Vercel Postgres or another Postgres provider.
- Add the env vars from `.env.local` in Vercel.
- Set the Google OAuth redirect URL to:
  - `https://admin.losthills.io/api/auth/callback/google`
