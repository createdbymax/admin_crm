import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

type ArtistStatus = "LEAD" | "CONTACTED" | "NEGOTIATING" | "WON" | "LOST";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";
  const isAdmin = session?.user?.isAdmin ?? false;
  if (!email.endsWith("@losthills.io") || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { status?: ArtistStatus; reason?: string | null };
  const allowed: ArtistStatus[] = ["LEAD", "CONTACTED", "NEGOTIATING", "WON", "LOST"];
  if (!body.status || !allowed.includes(body.status)) {
    return NextResponse.json({ error: "Missing status." }, { status: 400 });
  }

  const reason = body.reason?.trim() || null;
  const nextStatus = body.status;

  let fromStatus: ArtistStatus = "LEAD";
  const updated = await prisma.$transaction(async (tx) => {
    const current = await tx.artist.findUnique({
      where: { id },
      select: { status: true },
    });
    fromStatus = current?.status ?? "LEAD";

    const artist = await tx.artist.update({
      where: { id },
      data: {
        status: nextStatus,
        wonReason: nextStatus === "WON" ? reason : null,
        lostReason: nextStatus === "LOST" ? reason : null,
      },
    });

    await tx.artistStageHistory.create({
      data: {
        artistId: id,
        userId: session?.user?.id ?? null,
        fromStatus,
        toStatus: nextStatus,
      },
    });

    await tx.artistActivity.create({
      data: {
        artistId: id,
        userId: session?.user?.id ?? null,
        type: "Stage change",
        detail: `${fromStatus} -> ${nextStatus}`,
      },
    });

    return artist;
  });

  await logAuditEvent({
    action: "artist.status.update",
    userId: session?.user?.id ?? null,
    userEmail: email,
    entityType: "artist",
    entityId: id,
    metadata: {
      fromStatus,
      toStatus: nextStatus,
      reason,
    },
    request,
  });

  return NextResponse.json({ artist: updated });
}
