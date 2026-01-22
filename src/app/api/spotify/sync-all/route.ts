import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { syncArtistById } from "@/lib/spotify-sync";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";
  const isAdmin = session?.user?.isAdmin ?? false;
  if (!email.endsWith("@losthills.io") || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staleCutoff = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
  const toSync = await prisma.artist.findMany({
    where: {
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
    },
    orderBy: { updatedAt: "desc" },
    take: 25,
  });

  let synced = 0;
  let failed = 0;
  for (const artist of toSync) {
    try {
      await syncArtistById(artist.id);
      synced += 1;
    } catch (error) {
      failed += 1;
      console.error(error);
    }
  }

  const response = {
    queued: toSync.length,
    synced,
    failed,
  };

  await logAuditEvent({
    action: "spotify.sync_all",
    userId: session?.user?.id ?? null,
    userEmail: email,
    metadata: response,
    request,
  });

  return NextResponse.json(response);
}
