import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SpotifySyncJobStatus } from "@prisma/client";

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

export async function GET(request: Request) {
  // Verify this is a Vercel Cron request
  const authHeader = request.headers.get("authorization");
  
  // Allow local testing without auth in development
  const isDevelopment = process.env.NODE_ENV !== "production";
  const isAuthorized = isDevelopment || authHeader === `Bearer ${process.env.CRON_SECRET}`;
  
  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let syncJobClient;
  try {
    syncJobClient = getSyncJobClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create sync job.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Check if there's already an active sync job
  const existing = await syncJobClient.findFirst({
    where: { status: { in: activeStatuses } },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return NextResponse.json({
      message: "Sync job already running",
      jobId: existing.id,
    });
  }

  // Find artists that need syncing (stale or marked for sync)
  const staleCutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7); // 7 days
  const where = {
    AND: [
      {
        OR: [
          { needsSync: true },
          { spotifyLastSyncedAt: { lt: staleCutoff } },
        ],
      },
      {
        OR: [{ spotifyId: { not: null } }, { spotifyUrl: { not: null } }],
      },
    ],
  };

  if (total === 0) {
    return NextResponse.json({
      message: "No artists need syncing",
      total: 0,
    });
  }

  // Create a new sync job
  const job = await syncJobClient.create({
    data: {
      requestedById: null, // Automated job
      total,
      batchSize: 50, // Increased from 10 to 50
    },
  });

  // Trigger the first worker execution immediately (fire and forget)
  const workerUrl = new URL('/api/spotify/sync-worker', request.url);
  fetch(workerUrl.toString(), {
    method: 'GET',
    headers: {
      'x-trigger-source': 'cron-sync'
    }
  }).catch(() => {
    // Ignore errors - worker will be triggered by UI polling if this fails
  });

  return NextResponse.json({
    message: "Sync job created and worker triggered",
    jobId: job.id,
    total,
  });
}
