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
    type?: string;
    detail?: string | null;
  };
  if (!body.type) {
    return NextResponse.json({ error: "Missing activity type." }, { status: 400 });
  }

  const activity = await prisma.artistActivity.create({
    data: {
      artistId: id,
      userId: session?.user?.id ?? null,
      type: body.type,
      detail: body.detail ?? null,
    },
  });

  await logAuditEvent({
    action: "artist.activity.create",
    userId: session?.user?.id ?? null,
    userEmail: email,
    entityType: "artist",
    entityId: id,
    metadata: {
      type: body.type,
      detail: truncateAuditValue(body.detail ?? null),
      activityId: activity.id,
    },
    request,
  });

  return NextResponse.json({ activity });
}
