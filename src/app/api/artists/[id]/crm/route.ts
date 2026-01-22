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
  if (!email.endsWith("@losthills.io")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    campaignNotes?: string | null;
    nextStepAt?: string | null;
    nextStepNote?: string | null;
    reminderAt?: string | null;
  };

  const updated = await prisma.artist.update({
    where: { id },
    data: {
      campaignNotes:
        typeof body.campaignNotes === "string"
          ? body.campaignNotes
          : null,
      nextStepNote:
        typeof body.nextStepNote === "string" ? body.nextStepNote : null,
      nextStepAt: body.nextStepAt ? new Date(body.nextStepAt) : null,
      reminderAt: body.reminderAt ? new Date(body.reminderAt) : null,
    },
  });

  await logAuditEvent({
    action: "artist.crm.update",
    userId: session?.user?.id ?? null,
    userEmail: email,
    entityType: "artist",
    entityId: id,
    metadata: {
      campaignNotes: truncateAuditValue(body.campaignNotes),
      nextStepNote: truncateAuditValue(body.nextStepNote),
      nextStepAt: body.nextStepAt ?? null,
      reminderAt: body.reminderAt ?? null,
    },
    request,
  });

  return NextResponse.json({ artist: updated });
}
