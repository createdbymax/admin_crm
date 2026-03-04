import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { syncArtistById } from "@/lib/spotify-sync";
import { SpotifySyncJobStatus } from "@prisma/client";

export const maxDuration = 60;

const activeStatuses: SpotifySyncJobStatus[] = ["QUEUED", "RUNNING"];

function getSyncJobClient() {
  const client = (prisma as typeof prisma & {
    spotifySyncJob?: typeof prisma.spotifySyncJob;
  }).spotifySyncJob;
  if (!client) {
    throw new Error(
      "SpotifySyncJob model is missing. Run `pnpm prisma migrate dev` and `pnpm prisma generate`.",
    );
  }
  return client;
}

function isAuthorized(request: Request) {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  const secret = process.env.SPOTIFY_SYNC_SECRET;
  if (!secret) {
    return true;
  }
  const authHeader = request.headers.get("authorization") ?? "";
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let syncJobClient;
  try {
    syncJobClient = getSyncJobClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load sync job.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const job = await syncJobClient.findFirst({
    where: { status: { in: activeStatuses } },
    orderBy: { createdAt: "asc" },
  });

  if (!job) {
    return NextResponse.json({ job: null });
  }

  if (job.status === "QUEUED") {
    const started = await syncJobClient.updateMany({
      where: { id: job.id, status: "QUEUED" },
      data: { status: "RUNNING", startedAt: new Date() },
    });
    if (started.count === 0) {
      return NextResponse.json({ job: null });
    }
  }

  try {
    const staleCutoff = new Date(Date.now() - 1000 * 60 * 60 * 24); // 1 day
    const where = {
      AND: [
        {
          OR: [
            { needsSync: true },
            { spotifyLastSyncedAt: { lt: staleCutoff } },
            { spotifyLastSyncedAt: null }, // Never synced
          ],
        },
        {
          OR: [{ spotifyId: { not: null } }, { spotifyUrl: { not: null } }],
        },
      ],
    };

    const batch = await prisma.artist.findMany({
      where,
      orderBy: { id: "asc" },
      take: job.batchSize,
      ...(job.cursor ? { cursor: { id: job.cursor }, skip: 1 } : {}),
    });

    console.log(`[Worker] Found ${batch.length} artists to sync for job ${job.id}`);

    if (!batch.length) {
      console.log(`[Worker] No more artists to sync. Marking job as COMPLETED.`);
      const completed = await syncJobClient.update({
        where: { id: job.id },
        data: { status: "COMPLETED", finishedAt: new Date(), cursor: null },
      });
      return NextResponse.json({
        job: { id: completed.id, status: completed.status },
      });
    }

    let synced = 0;
    let failed = 0;
    let lastError: string | null = null;
    let rateLimited = false;
    
    console.log(`[Worker] Processing ${batch.length} artists sequentially...`);
    
    // Process artists sequentially to avoid overwhelming Spotify API
    for (const artist of batch) {
      try {
        console.log(`[Worker] Syncing ${artist.name} (${artist.id})...`);
        
        // Add timeout to prevent hanging
        const syncPromise = syncArtistById(artist.id);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sync timeout after 30s')), 30000)
        );
        
        await Promise.race([syncPromise, timeoutPromise]);
        
        synced += 1;
        console.log(`[Worker] ✓ Synced ${artist.name} (${synced}/${batch.length})`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Sync failed.";
        if (errorMsg.startsWith("Spotify rate limit: wait")) {
          rateLimited = true;
          lastError = errorMsg;
          console.error(
            `[Worker] Rate limited while syncing ${artist.name}: ${errorMsg}`,
          );
          break;
        }
        failed += 1;
        lastError = errorMsg;
        console.error(`[Worker] ✗ Failed to sync ${artist.name}: ${errorMsg}`);
      }
    }

    console.log(`[Worker] Batch complete. Synced: ${synced}, Failed: ${failed}`);

    const nextCursor = batch[batch.length - 1]?.id ?? job.cursor;
    const updated = await syncJobClient.update({
      where: { id: job.id },
      data: {
        synced: { increment: synced },
        failed: { increment: failed },
        cursor: nextCursor,
        lastError,
      },
    });

    console.log(`[Worker] Job updated. Total synced: ${updated.synced}, Total failed: ${updated.failed}, Total: ${updated.total}`);

    // Trigger next batch immediately if there's more work to do
    const processed = updated.synced + updated.failed;
    const hasMoreWork = processed < (updated.total ?? 0);
    
    console.log(`[Worker] Batch complete. Processed: ${processed}/${updated.total}, Has more work: ${hasMoreWork}`);
    
    if (hasMoreWork && !rateLimited) {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://admin.crm.losthills.io';
      const workerUrl = `${baseUrl}/api/spotify/sync-worker`;
      const headers: Record<string, string> = {
        'x-trigger-source': 'self-chain'
      };
      
      // Add auth header if secret is configured
      if (process.env.SPOTIFY_SYNC_SECRET) {
        headers['authorization'] = `Bearer ${process.env.SPOTIFY_SYNC_SECRET}`;
      }
      
      console.log(`[Worker] Triggering next batch. URL: ${workerUrl}`);
      
      fetch(workerUrl, {
        method: 'GET',
        headers
      }).catch((error) => {
        console.error('[Worker] Failed to chain worker:', error);
        // Will be picked up by UI polling
      });
    } else if (!rateLimited) {
      // Mark job as completed when all work is done
      console.log(`[Worker] All work complete. Marking job as COMPLETED.`);
      await syncJobClient.update({
        where: { id: job.id },
        data: { status: "COMPLETED", finishedAt: new Date(), cursor: null },
      });
    } else {
      console.log(
        `[Worker] Pausing job ${job.id} due to rate limit. Not chaining next batch.`,
      );
    }

    return NextResponse.json({
      job: {
        id: updated.id,
        status: updated.status,
        synced: updated.synced,
        failed: updated.failed,
        total: updated.total,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed.";
    await syncJobClient.update({
      where: { id: job.id },
      data: { status: "FAILED", finishedAt: new Date(), lastError: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
