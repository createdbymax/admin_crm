import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

function normalizeTags(input: string | string[] | undefined) {
  const list = Array.isArray(input) ? input : input?.split(",") ?? [];
  return list
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
}

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

  const body = (await request.json()) as { tags?: string | string[] };
  const tagNames = normalizeTags(body.tags);

  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({
        where: { name },
        create: { name },
        update: {},
      }),
    ),
  );

  const artist = await prisma.artist.update({
    where: { id },
    data: {
      tags: {
        set: [],
        connect: tags.map((tag: { id: string }) => ({ id: tag.id })),
      },
    },
    include: { tags: true },
  });

  await logAuditEvent({
    action: "artist.tags.update",
    userId: session?.user?.id ?? null,
    userEmail: email,
    entityType: "artist",
    entityId: id,
    metadata: { tags: tagNames },
    request,
  });

  return NextResponse.json({ tags: artist.tags });
}
