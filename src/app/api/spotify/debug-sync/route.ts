import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getSyncJobClient() {
  const client = (prisma as typeof prisma & {
    spotifySyncJob?: typeof prisma.spotifySyncJob;
  }).spotifySyncJob;
  if (!client) {
    throw new Error("SpotifySyncJob model is missing.");
  }
  return client;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";
  const isAdmin = session?.user?.isAdmin ?? false;
  
  if (!email.endsWith("@losthills.io") || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const jobId = searchParams.get("jobId");

  const syncJobClient = getSyncJobClient();

  // Get current job status
  if (action === "status") {
    const job = jobId 
      ? await syncJobClient.findUnique({ where: { id: jobId } })
      : await syncJobClient.findFirst({
          where: { status: { in: ["QUEUED", "RUNNING"] } },
          orderBy: { createdAt: "desc" },
        });

    if (!job) {
      return NextResponse.json({ error: "No active job found" }, { status: 404 });
    }

    const processed = job.synced + job.failed;
    const remaining = (job.total ?? 0) - processed;

    return NextResponse.json({
      job: {
        id: job.id,
        status: job.status,
        total: job.total,
        synced: job.synced,
        failed: job.failed,
        processed,
        remaining,
        cursor: job.cursor,
        lastError: job.lastError,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
      },
    });
  }

  // Manually trigger worker
  if (action === "trigger") {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://admin.crm.losthills.io';
    const workerUrl = `${baseUrl}/api/spotify/sync-worker`;
    const headers: Record<string, string> = {
      'x-trigger-source': 'manual-debug'
    };
    
    if (process.env.SPOTIFY_SYNC_SECRET) {
      headers['authorization'] = `Bearer ${process.env.SPOTIFY_SYNC_SECRET}`;
    }
    
    try {
      const response = await fetch(workerUrl, {
        method: 'GET',
        headers
      });
      
      const data = await response.json();
      
      return NextResponse.json({
        message: "Worker triggered",
        workerResponse: data,
      });
    } catch (error) {
      return NextResponse.json({
        error: "Failed to trigger worker",
        details: error instanceof Error ? error.message : "Unknown error",
      }, { status: 500 });
    }
  }

  // Complete stuck job
  if (action === "complete" && jobId) {
    const job = await syncJobClient.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        finishedAt: new Date(),
        cursor: null,
      },
    });

    return NextResponse.json({
      message: "Job marked as completed",
      job: {
        id: job.id,
        status: job.status,
        synced: job.synced,
        failed: job.failed,
        total: job.total,
      },
    });
  }

  return NextResponse.json({
    message: "Spotify Sync Debug Endpoint",
    usage: {
      status: "GET /api/spotify/debug-sync?action=status[&jobId=xxx]",
      trigger: "GET /api/spotify/debug-sync?action=trigger",
      complete: "GET /api/spotify/debug-sync?action=complete&jobId=xxx",
    },
  });
}
