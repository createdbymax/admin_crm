import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { SpotifySyncJobStatus } from "@prisma/client";

const activeStatuses: SpotifySyncJobStatus[] = ["QUEUED", "RUNNING"];

function serializeJob(job: {
  id: string;
  status: string;
  total: number | null;
  synced: number;
  failed: number;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}) {
  return {
    id: job.id,
    status: job.status,
    total: job.total,
    synced: job.synced,
    failed: job.failed,
    createdAt: job.createdAt.toISOString(),
    startedAt: job.startedAt ? job.startedAt.toISOString() : null,
    finishedAt: job.finishedAt ? job.finishedAt.toISOString() : null,
  };
}

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
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";
  const isAdmin = session?.user?.isAdmin ?? false;
  if (!email.endsWith("@losthills.io") || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  const active = searchParams.get("active");

  let job = null;
  try {
    const syncJobClient = getSyncJobClient();
    if (jobId) {
      job = await syncJobClient.findUnique({ where: { id: jobId } });
    } else if (active) {
      job = await syncJobClient.findFirst({
        where: { status: { in: activeStatuses } },
        orderBy: { createdAt: "desc" },
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load sync job.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ job: job ? serializeJob(job) : null });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";
  const isAdmin = session?.user?.isAdmin ?? false;
  if (!email.endsWith("@losthills.io") || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let force = false;
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      force?: boolean;
    };
    force = Boolean(payload.force);
  } catch {
    force = false;
  }

  let syncJobClient;
  try {
    syncJobClient = getSyncJobClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create sync job.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const existing = await syncJobClient.findFirst({
    where: { status: { in: activeStatuses } },
    orderBy: { createdAt: "desc" },
  });
  if (existing && !force) {
    return NextResponse.json({ job: serializeJob(existing) });
  }
  if (existing && force) {
    await syncJobClient.update({
      where: { id: existing.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        lastError: "Superseded by a new sync job.",
      },
    });
  }

  const staleCutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
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

  const total = await prisma.artist.count({ where });
  const job = await syncJobClient.create({
    data: {
      requestedById: session?.user?.id ?? null,
      total,
      batchSize: 10,
    },
  });

  await logAuditEvent({
    action: "spotify.sync_all",
    userId: session?.user?.id ?? null,
    userEmail: email,
    metadata: { jobId: job.id, total },
    request,
  });

  return NextResponse.json({ job: serializeJob(job) });
}
