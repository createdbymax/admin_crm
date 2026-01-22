import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function DELETE(
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

  await prisma.artist.delete({
    where: { id },
  });

  await logAuditEvent({
    action: "artist.delete",
    userId: session?.user?.id ?? null,
    userEmail: email,
    entityType: "artist",
    entityId: id,
    request,
  });

  return NextResponse.json({ ok: true });
}
