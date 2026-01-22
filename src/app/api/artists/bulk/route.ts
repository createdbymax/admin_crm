import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { syncArtistById } from "@/lib/spotify-sync";

const allowedStatuses = ["LEAD", "CONTACTED", "NEGOTIATING", "WON", "LOST"];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";
  if (!email.endsWith("@losthills.io")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    action?: "assign" | "status" | "sync";
    artistIds?: string[];
    ownerId?: string | null;
    status?: string;
  };

  if (!body.action || !Array.isArray(body.artistIds) || body.artistIds.length === 0) {
    return NextResponse.json({ error: "Missing artists." }, { status: 400 });
  }

  const artistIds = body.artistIds.filter(Boolean);
  if (!artistIds.length) {
    return NextResponse.json({ error: "Missing artists." }, { status: 400 });
  }

  const isAdmin = session?.user?.isAdmin ?? false;
  if ((body.action === "assign" || body.action === "status") && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (body.action === "assign") {
    const ownerId = body.ownerId ?? null;
    const result = await prisma.artist.updateMany({
      where: { id: { in: artistIds } },
      data: { ownerId },
    });

    await logAuditEvent({
      action: "artist.bulk.assign",
      userId: session?.user?.id ?? null,
      userEmail: email,
      metadata: { count: result.count, ownerId },
      request,
    });

    return NextResponse.json({
      message: `Updated owner for ${result.count} artist${result.count === 1 ? "" : "s"}.`,
    });
  }

  if (body.action === "status") {
    if (!body.status || !allowedStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx: typeof prisma) => {
      const artists = await tx.artist.findMany({
        where: { id: { in: artistIds } },
        select: { id: true, status: true },
      });

      let count = 0;
      for (const artist of artists) {
        if (artist.status === body.status) {
          continue;
        }
        await tx.artist.update({
          where: { id: artist.id },
          data: {
            status: body.status as never,
            wonReason: null,
            lostReason: null,
          },
        });

        await tx.artistStageHistory.create({
          data: {
            artistId: artist.id,
            userId: session?.user?.id ?? null,
            fromStatus: artist.status,
            toStatus: body.status as never,
          },
        });

        await tx.artistActivity.create({
          data: {
            artistId: artist.id,
            userId: session?.user?.id ?? null,
            type: "Stage change",
            detail: `${artist.status} -> ${body.status}`,
          },
        });
        count += 1;
      }

      return count;
    });

    await logAuditEvent({
      action: "artist.bulk.status",
      userId: session?.user?.id ?? null,
      userEmail: email,
      metadata: { count: updated, status: body.status },
      request,
    });

    return NextResponse.json({
      message: `Updated status for ${updated} artist${updated === 1 ? "" : "s"}.`,
    });
  }

  let synced = 0;
  let failed = 0;
  for (const artistId of artistIds) {
    try {
      await syncArtistById(artistId);
      synced += 1;
    } catch (error) {
      console.error(error);
      failed += 1;
    }
  }

  await logAuditEvent({
    action: "artist.bulk.sync",
    userId: session?.user?.id ?? null,
    userEmail: email,
    metadata: { queued: artistIds.length, synced, failed },
    request,
  });

  return NextResponse.json({
    message: `Synced ${synced}/${artistIds.length} artists${failed ? ` (${failed} failed)` : ""}.`,
  });
}
