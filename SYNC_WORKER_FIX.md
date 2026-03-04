# Sync Worker Fix - January 24, 2026

## Problem Identified

The "Sync Spotify" button was creating sync jobs but **never actually syncing artists** because the worker was not being triggered.

### Root Cause

The `/api/spotify/sync-all` POST endpoint was:
1. ✅ Creating a `SpotifySyncJob` in the database
2. ✅ Returning the job to the UI for polling
3. ❌ **NOT triggering the worker to process the job**

The UI would poll the job status, but since the worker never ran, the job would stay in `QUEUED` status forever.

## Solution Applied

Added worker trigger to `/api/spotify/sync-all` POST endpoint (matching the pattern used in `/api/spotify/cron-sync`):

```typescript
// Trigger the worker immediately to start processing (fire and forget)
const baseUrl = process.env.NEXTAUTH_URL || 'https://admin.crm.losthills.io';
const workerUrl = `${baseUrl}/api/spotify/sync-worker`;
const headers: Record<string, string> = {
  'x-trigger-source': 'sync-all'
};

// Add auth header if secret is configured
if (process.env.SPOTIFY_SYNC_SECRET) {
  headers['authorization'] = `Bearer ${process.env.SPOTIFY_SYNC_SECRET}`;
}

fetch(workerUrl, {
  method: 'GET',
  headers
}).catch((error) => {
  console.error('Failed to trigger worker:', error);
  // Worker will be triggered by UI polling if this fails
});
```

## How Sync Works Now

### Manual Sync Flow (UI Button)
1. User clicks "Sync Spotify" button
2. POST `/api/spotify/sync-all` creates job
3. **Worker is immediately triggered** via fetch()
4. Worker processes batch of 10 artists
5. Worker chains itself for next batch
6. UI polls job status every 3 seconds
7. Toast shows progress: "Syncing artists: 45/1247 (2 failed)"
8. On completion: "Sync complete! Updated 1245 artists (2 failed)"

### Automated Sync Flow (Cron)
1. Vercel Cron triggers `/api/spotify/cron-sync` daily at 2 AM UTC
2. Endpoint creates job with batch size of 50
3. Worker is immediately triggered
4. Same processing flow as manual sync

### What Gets Synced

Artists are selected for sync if they meet ALL of:
- Have `spotifyId` OR `spotifyUrl`
- AND one of:
  - `needsSync: true` (manually marked)
  - `spotifyLastSyncedAt` is null (never synced)
  - `spotifyLastSyncedAt` > 24 hours ago (stale)

### What Data Is Synced

From Spotify Web API:
- ✅ `spotifyFollowers` - Total follower count
- ✅ `spotifyPopularity` - Popularity score (0-100)
- ✅ `spotifyGenres` - Array of genre strings
- ✅ `spotifyImage` - Artist profile image URL
- ✅ Latest release info (name, date, URL, type, image)
- ✅ All releases (stored in `ArtistRelease` table)

**NOT synced** (not available in Spotify Web API):
- ❌ `monthlyListeners` - Only available via web scraping or CSV import

## Monthly Listeners Explanation

### Current State
- 199 out of 1,446 artists (13.8%) have monthly listeners data
- This data came from CSV imports, NOT from Spotify sync

### Why Sync Doesn't Update Monthly Listeners

Spotify's official Web API **does not provide monthly listeners**. This metric is only visible on the Spotify web interface and is not exposed through their API endpoints.

The existing monthly listeners data was populated through:
1. CSV imports via `/api/import` route
2. Manual entry via artist creation/editing

### Options for Monthly Listeners

**Option 1: Keep Current Approach (Recommended)**
- Continue using CSV imports for monthly listeners
- Sync handles all other Spotify data
- Simple, reliable, no API violations

**Option 2: Web Scraping (Not Recommended)**
- Scrape Spotify web pages for monthly listeners
- Violates Spotify Terms of Service
- Fragile (breaks when Spotify changes HTML)
- Risk of IP bans

**Option 3: Third-Party APIs**
- Services like Chartmetric, Soundcharts provide this data
- Requires paid subscription
- More reliable than scraping

## Testing the Fix

1. Click "Sync Spotify" button in the UI
2. You should immediately see: "Syncing X artists..."
3. Progress updates every 3 seconds
4. Check browser network tab - you should see:
   - POST `/api/spotify/sync-all` (creates job)
   - GET `/api/spotify/sync-worker` (processes batch)
   - GET `/api/spotify/sync-all?jobId=...` (polls status)
5. After completion, refresh the page
6. Artists should have updated Spotify data (followers, popularity, etc.)
7. Monthly listeners will remain unchanged (expected behavior)

## Files Modified

- `src/app/api/spotify/sync-all/route.ts` - Added worker trigger with auth header after job creation
- `src/app/api/spotify/cron-sync/route.ts` - Updated worker trigger to include auth header for consistency

## Related Files

- `src/app/api/spotify/sync-worker/route.ts` - Worker that processes batches
- `src/app/api/spotify/cron-sync/route.ts` - Automated daily sync
- `src/lib/spotify-sync.ts` - Per-artist sync logic
- `src/lib/spotify.ts` - Spotify API client
- `src/components/notion-artists-database.tsx` - UI with sync button and toast
