# Automated Spotify Sync Setup

## Overview
The CRM now automatically scans all artists for new releases daily at 2 AM UTC using Vercel Cron Jobs.

## How It Works

1. **Vercel Cron** (`vercel.json`) triggers `/api/spotify/cron-sync` daily at 2 AM UTC
2. **Cron endpoint** checks for artists that need syncing:
   - Not synced in the last 7 days, OR
   - Marked with `needsSync: true`
3. **Sync job** is created in the database (`SpotifySyncJob`)
4. **Worker is triggered immediately** - the cron endpoint calls the worker to start processing
5. **Worker chains itself** - after each batch, it triggers itself again until all artists are synced
6. **Worker processes** 50 artists per batch in parallel (respecting 10 req/sec rate limit)
7. **Release calendar** is automatically updated with new releases

With 1500 artists and 50 per batch, it takes about 30 batches. Each batch takes ~5-10 seconds, so the full sync completes in ~5-10 minutes total.

**Note**: This self-chaining approach works around Vercel Hobby's limitation of only daily cron jobs. The worker triggers itself to process all batches continuously.

## Files Created/Modified

### New Files
- `vercel.json` - Cron job configuration
- `src/app/api/spotify/cron-sync/route.ts` - Cron endpoint
- `.env.example` - Environment variable documentation
- `AUTOMATED_SYNC_SETUP.md` - This file

### Modified Files
- `README.md` - Added automated sync documentation
- `AGENTS.md` - Updated API patterns and configuration sections

## Deployment Steps

1. **Generate a CRON_SECRET**:
   ```bash
   openssl rand -base64 32
   ```

2. **Add to Vercel Environment Variables**:
   - Go to your Vercel project settings
   - Add `CRON_SECRET` with the generated value
   - Make sure it's available for Production environment

3. **Deploy**:
   ```bash
   git add .
   git commit -m "Add automated Spotify sync via Vercel Cron"
   git push
   ```

4. **Verify & Test**:
   
   **Option A: Vercel Dashboard (Recommended)**
   - Go to your Vercel project → Settings → Cron Jobs
   - Find your cron job in the list
   - Click the "..." menu → "Run Now" to manually trigger it
   - Check the execution logs in the same panel
   
   **Option B: Manual HTTP Request**
   ```bash
   curl -X GET https://admin.crm.losthills.io/api/spotify/cron-sync \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```
   
   **Option C: Wait for scheduled execution**
   - Wait for 2 AM UTC
   - Check Vercel deployment logs for automatic execution

## Manual Sync
Users can still manually trigger a sync from the Artists page using the "Sync all Spotify" button.

## Local Testing

To test the cron endpoint locally:

1. **Start your dev server**:
   ```bash
   pnpm dev
   ```

2. **Trigger the endpoint** (no auth required in development):
   ```bash
   curl http://localhost:3000/api/spotify/cron-sync
   ```

3. **Check the response**:
   - Should return `{ "message": "Sync job created", "jobId": "...", "total": X }`
   - Or `{ "message": "No artists need syncing", "total": 0 }`
   - Or `{ "message": "Sync job already running", "jobId": "..." }`

4. **Monitor the sync**:
   - The sync worker will process the job automatically in development
   - Check your terminal logs for sync progress
   - Or visit the Artists page to see the sync status UI

## Monitoring
- **Artists Page UI**: Go to `/artists` and scroll to the "Spotify Sync" card to see:
  - Real-time progress bar
  - Status: "RUNNING — 450/1500 synced (5 failed)"
  - Auto-refreshes every 30 seconds
- **Prisma Studio**: Check `SpotifySyncJob` table for job history
- **Vercel Logs**: View cron execution history:
  - `/api/spotify/cron-sync` runs once daily at 2 AM UTC
  - `/api/spotify/sync-worker` chains itself until complete
- A full sync of 1500 artists takes approximately 5-10 minutes to complete

## Schedule Customization
To change the sync schedule, edit `vercel.json`:
- `"0 2 * * *"` = Daily at 2 AM UTC
- `"0 */6 * * *"` = Every 6 hours
- `"0 0 * * 0"` = Weekly on Sunday at midnight

See [Vercel Cron documentation](https://vercel.com/docs/cron-jobs) for more schedule options.
