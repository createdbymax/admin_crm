# Automated Spotify Sync Setup

## Overview
The CRM now automatically scans all artists for new releases daily at 2 AM UTC using Vercel Cron Jobs.

## How It Works

1. **Vercel Cron** (`vercel.json`) triggers `/api/spotify/cron-sync` daily at 2 AM UTC
2. **Cron endpoint** checks for artists that need syncing:
   - Not synced in the last 7 days, OR
   - Marked with `needsSync: true`
3. **Sync job** is created in the database (`SpotifySyncJob`)
4. **Sync worker** (`/api/spotify/sync-worker`) processes the job in batches
5. **Release calendar** is automatically updated with new releases

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

4. **Verify**:
   - Check Vercel deployment logs
   - Wait for 2 AM UTC or manually test the endpoint:
     ```bash
     curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
       https://admin.crm.losthills.io/api/spotify/cron-sync
     ```

## Manual Sync
Users can still manually trigger a sync from the Artists page using the "Sync all Spotify" button.

## Monitoring
- Check `SpotifySyncJob` table in Prisma Studio for job history
- View sync status in the Artists page UI
- Check Vercel logs for cron execution history

## Schedule Customization
To change the sync schedule, edit `vercel.json`:
- `"0 2 * * *"` = Daily at 2 AM UTC
- `"0 */6 * * *"` = Every 6 hours
- `"0 0 * * 0"` = Weekly on Sunday at midnight

See [Vercel Cron documentation](https://vercel.com/docs/cron-jobs) for more schedule options.
