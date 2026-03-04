# Spotify Sync - How It Works

## What Gets Synced

The sync fetches the following data from Spotify for each artist:

### Artist Data
- **Monthly Listeners** - Current monthly listener count
- **Followers** - Total Spotify followers
- **Popularity** - Spotify popularity score (0-100)
- **Genres** - Array of genre tags
- **Profile Image** - Artist's Spotify profile picture
- **Spotify ID** - Unique Spotify identifier

### Release Data
- **Latest Release Name** - Most recent album/single/EP name
- **Release Date** - When it was released
- **Release URL** - Link to the release on Spotify
- **Release Type** - album, single, or EP
- **Release Image** - Cover art

### All Releases
- Creates/updates records in `ArtistRelease` table
- Stores all albums, singles, and EPs
- Used for the release calendar feature

## Which Artists Get Synced

The sync uses smart filtering to only sync artists that need it:

### Selection Criteria (ANY of these)

1. **Never Synced Before**
   ```sql
   spotifyLastSyncedAt IS NULL
   ```
   - Artists that have never been synced with Spotify
   - Ensures all new artists get their data

2. **Stale Data (>24 hours old)**
   ```sql
   spotifyLastSyncedAt < (NOW - 24 hours)
   ```
   - Artists not synced in the last 24 hours
   - Keeps data fresh and up-to-date

3. **Manually Flagged**
   ```sql
   needsSync = true
   ```
   - Artists marked as needing a sync
   - Set when artist data is updated manually
   - Set when Spotify URL/ID is added

### Required Condition (MUST have)

Artists must have either:
- `spotifyId` (direct Spotify ID)
- OR `spotifyUrl` (Spotify artist URL)

**Artists without Spotify info are skipped.**

## Current Database Stats

Based on your data:
- **Total artists**: 1,446
- **With monthly listeners**: 199 (13.8%)
- **Without monthly listeners**: 1,247 (86.2%)

### Why Some Don't Have Data

Artists show "Empty" for monthly listeners when:

1. **Never synced** - Artist added but sync hasn't run yet
2. **No Spotify link** - Artist doesn't have `spotifyId` or `spotifyUrl`
3. **Spotify API returned null** - Artist exists on Spotify but has no listener data
4. **Sync failed** - Error occurred during sync for that artist

## Sync Process Flow

### 1. Job Creation
```typescript
POST /api/spotify/sync-all
```
- Counts artists matching criteria
- Creates `SpotifySyncJob` record
- Status: QUEUED
- Returns job ID and total count

### 2. Worker Processing
```typescript
GET /api/spotify/sync-worker
```
- Fetches next batch (10 artists)
- For each artist:
  - Extracts Spotify ID from URL if needed
  - Calls Spotify API (with rate limiting)
  - Updates artist record
  - Creates/updates release records
  - Marks as synced
- Updates job progress
- Repeats until all done

### 3. Status Updates
```typescript
GET /api/spotify/sync-all?jobId={id}
```
- Returns current progress
- Frontend polls every 3 seconds
- Shows live progress in toast

### 4. Completion
- Status changes to COMPLETED
- Frontend refreshes page
- New data appears in table

## Rate Limiting

The sync uses Spotify API rate limiting to avoid hitting limits:

```typescript
withSpotifyRateLimit(() => fetchSpotifyArtist(spotifyId))
```

- Respects Spotify's rate limits
- Automatically retries on 429 errors
- Processes in batches of 10
- Safe for large datasets

## Automated Daily Sync

A cron job runs daily at 2 AM UTC:

```typescript
GET /api/spotify/cron-sync
```

Automatically syncs artists that:
- Haven't been synced in 24 hours
- Are marked with `needsSync: true`
- Have never been synced

This keeps your data fresh without manual intervention.

## Manual Sync Options

### 1. Sync All (Button in UI)
```typescript
POST /api/spotify/sync-all
{ force: false }
```
- Syncs artists matching criteria
- Won't start if sync already running
- Shows progress toast

### 2. Force Sync (Restart)
```typescript
POST /api/spotify/sync-all
{ force: true }
```
- Cancels existing sync
- Starts new sync immediately
- Use if sync appears stuck

### 3. Individual Artist Sync
```typescript
POST /api/artists/{id}/sync
```
- Syncs single artist immediately
- Available on artist detail page
- Bypasses 24-hour check

## What You'll See After Sync

### Before Sync
```
Name: "Third Vibes"
Monthly Listeners: Empty
Followers: Empty
Popularity: Empty
```

### After Sync
```
Name: "Third Vibes"
Monthly Listeners: 16,493
Followers: 3,789
Popularity: 20
Genres: ["indie", "alternative"]
Latest Release: "Summer Nights"
Release Date: 2024-06-15
```

## Troubleshooting

### "Empty" Still Shows After Sync

**Possible reasons**:
1. Artist has no Spotify ID/URL in database
2. Spotify ID is invalid
3. Artist not found on Spotify
4. Spotify API returned null (artist has no data)

**Check**: Look at `spotifyLastSyncedAt` field
- If NULL: Never synced (missing Spotify info)
- If recent date: Synced but Spotify has no data

### Sync Appears Stuck

**Solutions**:
1. Check `/api/spotify/sync-all?active=1` for job status
2. Look at `synced` vs `total` count
3. Check for errors in job record
4. Use force sync to restart

### Some Artists Skipped

**Expected behavior** if:
- No `spotifyId` or `spotifyUrl`
- Already synced in last 24 hours
- `needsSync` is false

**To force sync**: Set `needsSync: true` on artist record

## Performance

### Current Setup
- Batch size: 10 artists at a time
- Poll interval: 3 seconds
- Rate limiting: Respects Spotify limits
- Timeout: 30 seconds per artist

### For 1,446 Artists
- Estimated time: 10-20 minutes
- Depends on Spotify API response time
- Progress updates every 3 seconds
- Safe for production use

## Summary

The sync is **smart** and **efficient**:
- ✅ Only syncs artists that need it
- ✅ Respects rate limits
- ✅ Shows live progress
- ✅ Runs automatically daily
- ✅ Handles errors gracefully
- ✅ Updates all Spotify data
- ✅ Keeps release calendar current

Your 86.2% of artists without data will get populated after running the sync!
