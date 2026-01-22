import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import {
  extractSpotifyId,
  normalizeEmailList,
  normalizeUrl,
  parseMonthlyListeners,
} from "@/lib/artist-utils";
import { prisma } from "@/lib/prisma";
import { syncArtistById } from "@/lib/spotify-sync";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email ?? "";
  if (!sessionEmail.endsWith("@losthills.io")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    spotifyUrl?: string | null;
    email?: string | null;
    instagram?: string | null;
    website?: string | null;
    monthlyListeners?: string | null;
    syncNow?: boolean;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const spotifyUrl =
    body.spotifyUrl && body.spotifyUrl.trim()
      ? normalizeUrl(body.spotifyUrl.trim())
      : null;
  if (body.spotifyUrl && !spotifyUrl) {
    return NextResponse.json({ error: "Invalid Spotify URL." }, { status: 400 });
  }

  const contactEmail = normalizeEmailList(body.email?.trim() ?? null);
  if (body.email && !contactEmail) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
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

  const name = body.name.trim();
  const spotifyId = extractSpotifyId(spotifyUrl);
  const duplicateFilters: Array<Record<string, unknown>> = [
    { name: { equals: name, mode: "insensitive" } },
    ...(spotifyId ? [{ spotifyId }] : []),
  ];
  const existing = await prisma.artist.findFirst({
    where: { OR: duplicateFilters },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Artist already exists." }, { status: 409 });
  }
  const artist = await prisma.artist.create({
    data: {
      name,
      spotifyUrl,
      spotifyId,
      email: contactEmail,
      instagram,
      website,
      monthlyListeners: parseMonthlyListeners(body.monthlyListeners ?? null),
      needsSync: true,
    },
  });

  await logAuditEvent({
    action: "artist.create",
    userId: session?.user?.id ?? null,
    userEmail: sessionEmail,
    entityType: "artist",
    entityId: artist.id,
    metadata: {
      name: artist.name,
      spotifyUrl: artist.spotifyUrl,
      syncNow: Boolean(body.syncNow),
    },
    request,
  });

  if (body.syncNow && (artist.spotifyId || artist.spotifyUrl)) {
    try {
      await syncArtistById(artist.id);
    } catch (error) {
      console.error(error);
    }
  }

  return NextResponse.json({ artist });
}
