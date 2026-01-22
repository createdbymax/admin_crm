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
    subject?: string | null;
    body?: string | null;
    template?: string | null;
    sentAt?: string | null;
  };

  const subject = body.subject?.trim() || null;
  const content = body.body?.trim() || null;
  if (!subject && !content) {
    return NextResponse.json({ error: "Message content is required." }, { status: 400 });
  }

  const sentAt = body.sentAt ? new Date(body.sentAt) : new Date();

  const message = await prisma.outboundMessage.create({
    data: {
      artistId: id,
      userId: session?.user?.id ?? null,
      channel: "EMAIL",
      subject,
      body: content,
      template: body.template?.trim() || null,
      sentAt,
    },
  });

  await prisma.artist.update({
    where: { id },
    data: { lastContactedAt: sentAt },
  });

  await logAuditEvent({
    action: "artist.outbound.create",
    userId: session?.user?.id ?? null,
    userEmail: email,
    entityType: "artist",
    entityId: id,
    metadata: {
      messageId: message.id,
      subject: truncateAuditValue(subject),
      template: body.template?.trim() || null,
      sentAt: sentAt.toISOString(),
    },
    request,
  });

  return NextResponse.json({ message });
}
