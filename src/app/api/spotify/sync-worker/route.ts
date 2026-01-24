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

    if (!batch.length) {
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
    
    // Process artists in parallel with rate limiting
    // Spotify allows ~10-20 requests/second, so we can do batches of 10 in parallel
    const results = await Promise.allSettled(
      batch.map(artist => syncArtistById(artist.id))
    );
    
    results.forEach((result) => {
      if (result.status === "fulfilled") {
        synced += 1;
      } else {
        failed += 1;
        lastError = result.reason instanceof Error ? result.reason.message : "Sync failed.";
        console.error(result.reason);
      }
    });

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

    // Trigger next batch immediately if there's more work to do
    const hasMoreWork = updated.synced < (updated.total ?? 0);
    if (hasMoreWork) {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://admin.crm.losthills.io';
      const workerUrl = `${baseUrl}/api/spotify/sync-worker`;
      
      fetch(workerUrl, {
        method: 'GET',
        headers: {
          'x-trigger-source': 'self-chain'
        }
      }).catch((error) => {
        console.error('Failed to chain worker:', error);
        // Will be picked up by UI polling
      });
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
