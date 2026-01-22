import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

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

  const body = (await request.json()) as { ownerId?: string | null };
  const updated = await prisma.artist.update({
    where: { id },
    data: {
      ownerId: body.ownerId || null,
    },
  });

  await logAuditEvent({
    action: "artist.owner.update",
    userId: session?.user?.id ?? null,
    userEmail: email,
    entityType: "artist",
    entityId: id,
    metadata: {
      ownerId: body.ownerId || null,
    },
    request,
  });

  return NextResponse.json({ artist: updated });
}
