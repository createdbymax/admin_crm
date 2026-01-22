import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { logAuditEvent, truncateAuditValue } from "@/lib/audit";
import { normalizeEmailList, normalizeUrl } from "@/lib/artist-utils";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email ?? "";
  if (!sessionEmail.endsWith("@losthills.io")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    contactName?: string | null;
    contactRole?: string | null;
    email?: string | string[] | null;
    instagram?: string | null;
    website?: string | null;
    contactNotes?: string | null;
  };

  const rawEmailInput = Array.isArray(body.email)
    ? body.email.join(",")
    : body.email ?? null;
  const emailHasValue =
    rawEmailInput !== null && rawEmailInput.replace(/[\s,]+/g, "").length > 0;
  const contactEmail = emailHasValue ? normalizeEmailList(rawEmailInput) : null;
  if (emailHasValue && !contactEmail) {
    return NextResponse.json(
      { error: "Invalid email address." },
      { status: 400 },
    );
  }

  const instagram =
    body.instagram && body.instagram.trim()
      ? normalizeUrl(body.instagram.trim())
      : null;
  if (body.instagram && !instagram) {
    return NextResponse.json({ error: "Invalid Instagram URL." }, { status: 400 });
  }

  const website =
    body.website && body.website.trim()
      ? normalizeUrl(body.website.trim())
      : null;
  if (body.website && !website) {
    return NextResponse.json({ error: "Invalid website URL." }, { status: 400 });
  }

  const updated = await prisma.artist.update({
    where: { id },
    data: {
      contactName: body.contactName?.trim() || null,
      contactRole: body.contactRole?.trim() || null,
      email: contactEmail,
      instagram,
      website,
      contactNotes: body.contactNotes?.trim() || null,
    },
  });

  await logAuditEvent({
    action: "artist.contact.update",
    userId: session?.user?.id ?? null,
    userEmail: sessionEmail,
    entityType: "artist",
    entityId: id,
    metadata: {
      contactName: body.contactName?.trim() || null,
      contactRole: body.contactRole?.trim() || null,
      email: contactEmail,
      instagram,
      website,
      contactNotes: truncateAuditValue(body.contactNotes?.trim()),
    },
    request,
  });

  return NextResponse.json({ artist: updated });
}
