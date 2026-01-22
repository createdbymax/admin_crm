import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { logAuditEvent, truncateAuditValue } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";
  if (!email.endsWith("@losthills.io") || !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { body?: string };
  if (!body.body) {
    return NextResponse.json({ error: "Missing note body." }, { status: 400 });
  }

  const note = await prisma.artistNote.create({
    data: {
      artistId: id,
      userId: session.user.id,
      body: body.body,
    },
  });

  await logAuditEvent({
    action: "artist.note.create",
    userId: session.user.id,
    userEmail: email,
    entityType: "artist",
    entityId: id,
    metadata: {
      noteId: note.id,
      body: truncateAuditValue(body.body),
    },
    request,
  });

  return NextResponse.json({ note });
}
