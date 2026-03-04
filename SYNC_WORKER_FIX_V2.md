# Sync Worker Fix V2 - Client-Side Triggering

## Problem

The server-side `fetch()` calls to trigger the worker were failing silently in development because:
1. `fetch()` to `localhost` from server-side code can be unreliable
2. Fire-and-forget pattern swallows errors
3. No way to debug why the worker wasn't being called

## Solution

**Moved worker triggering to the client side** where `fetch()` calls are more reliable.

### Changes Made

#### 1. Client Triggers Worker After Job Creation
**File**: `src/components/notion-artists-database.tsx`

When user clicks "Sync Spotify":
1. Creates job via POST `/api/spotify/sync-all`
2. **Immediately triggers worker** via GET `/api/spotify/sync-worker` from client
3. Starts polling for progress

```typescript
// Create the sync job
const response = await fetch('/api/spotify/sync-all', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ force: false }),
});

if (response.ok) {
  const data = await response.json();
  if (data.job) {
    // Trigger the worker immediately from the client
    fetch('/api/spotify/sync-worker', {
      method: 'GET',
    }).catch((error) => {
      console.error('Failed to trigger worker:', error);
    });
    
    // Start polling
    startPolling(jobId);
  }
}
```

#### 2. Auto-Recovery for Stuck Jobs
**File**: `src/components/notion-artists-database.tsx`

Polling now detects stuck jobs and auto-triggers the worker:

```typescript
// Check if job is stuck (no progress for 3 polls = 9 seconds)
if (processed === lastProcessed && status === 'RUNNING') {
  stuckCount++;
  if (stuckCount >= 3) {
    console.log('[Sync] Job appears stuck, triggering worker...');
    fetch('/api/spotify/sync-worker', { method: 'GET' }).catch(console.error);
    stuckCount = 0; // Reset to avoid spamming
  }
}
```

#### 3. Resume Active Jobs on Page Load
**File**: `src/components/notion-artists-database.tsx`

When page loads, checks for active jobs and triggers worker if needed:

```typescript
useEffect(() => {
  const checkActiveSync = async () => {
    const response = await fetch('/api/spotify/sync-all?active=1');
    const data = await response.json();
    
    if (data.job && (data.job.status === 'RUNNING' || data.job.status === 'QUEUED')) {
      // Trigger worker in case it's stuck
      if (data.job.status === 'QUEUED' || synced === 0) {
        console.log('[Sync] Triggering worker for active job...');
        fetch('/api/spotify/sync-worker', { method: 'GET' }).catch(console.error);
      }
      
      startPolling(id);
    }
  };
  
  checkActiveSync();
}, [startPolling]);
```

#### 4. Fixed Worker Completion Logic
**File**: `src/app/api/spotify/sync-worker/route.ts`

- Fixed calculation: `synced + failed < total` (was only checking `synced < total`)
- Added completion marking when all work is done
- Added auth header support for self-chaining
- Added logging for debugging

```typescript
const processed = updated.synced + updated.failed;
const hasMoreWork = processed < (updated.total ?? 0);

console.log(`[Worker] Batch complete. Processed: ${processed}/${updated.total}, Has more work: ${hasMoreWork}`);

if (hasMoreWork) {
  // Chain to next batch
  fetch(workerUrl, { method: 'GET', headers }).catch(console.error);
} else {
  // Mark job as completed
  console.log(`[Worker] All work complete. Marking job as COMPLETED.`);
  await syncJobClient.update({
    where: { id: job.id },
    data: { status: "COMPLETED", finishedAt: new Date(), cursor: null },
  });
}
```

#### 5. Removed Server-Side Worker Trigger
**File**: `src/app/api/spotify/sync-all/route.ts`

Removed the unreliable server-side `fetch()` call since client now handles it.

#### 6. Added Debug Endpoint
**File**: `src/app/api/spotify/debug-sync/route.ts`

New endpoint for debugging sync issues:
- `GET /api/spotify/debug-sync?action=status` - Check current job status
- `GET /api/spotify/debug-sync?action=trigger` - Manually trigger worker
- `GET /api/spotify/debug-sync?action=complete&jobId=xxx` - Mark job as complete

## How It Works Now

### Normal Flow
1. User clicks "Sync Spotify"
2. Client creates job
3. Client triggers worker
4. Worker processes batch of 10 artists
5. Worker chains itself for next batch
6. Client polls every 3 seconds
7. If stuck, client auto-triggers worker
8. On completion, shows success toast

### Recovery Mechanisms

**Stuck Detection**: If no progress for 9 seconds (3 polls), auto-trigger worker

**Page Reload**: If user reloads page during sync, it resumes automatically

**Worker Chaining**: Worker triggers itself for next batch with proper auth

**Completion**: Worker marks job as COMPLETED when all artists processed

## Testing

1. Click "Sync Spotify" button
2. Should see immediate progress: "Syncing artists: 0/1095..."
3. Progress updates every 3 seconds
4. Check browser console for logs:
   - `[Sync] Triggering worker for active job...`
   - `[Worker] Batch complete. Processed: 10/1095...`
5. Check network tab:
   - POST `/api/spotify/sync-all` (creates job)
   - GET `/api/spotify/sync-worker` (processes batch)
   - GET `/api/spotify/sync-all?jobId=...` (polls status)
6. Should complete successfully: "Sync complete! Updated X artists"

## Files Modified

- `src/components/notion-artists-database.tsx` - Client-side worker triggering and stuck detection
- `src/app/api/spotify/sync-worker/route.ts` - Fixed completion logic and added logging
- `src/app/api/spotify/sync-all/route.ts` - Removed server-side worker trigger
- `src/app/api/spotify/debug-sync/route.ts` - New debug endpoint (created)

## Why This Works Better

**Client-side fetch is more reliable**:
- Browser handles localhost correctly
- Can see errors in console
- No CORS issues
- Works in both dev and production

**Multiple recovery mechanisms**:
- Initial trigger on sync start
- Auto-trigger on page load
- Auto-trigger when stuck detected
- Manual trigger via debug endpoint

**Better visibility**:
- Console logs show what's happening
- Network tab shows all requests
- Toast shows real-time progress
- Debug endpoint for troubleshooting
