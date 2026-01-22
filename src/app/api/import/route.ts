import { parse } from "csv-parse/sync";
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

type ImportArtist = {
  name: string;
  spotifyUrl: string | null;
  spotifyId: string | null;
  instagram: string | null;
  monthlyListeners: number | null;
  email: string | null;
  facebook: string | null;
  x: string | null;
  twitter: string | null;
  tiktok: string | null;
  youtube: string | null;
  soundcloud: string | null;
  website: string | null;
};
type ExistingArtist = { id: string; name: string; spotifyId: string | null };

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";
  if (!email.endsWith("@losthills.io")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "Missing CSV file." }, { status: 400 });
  }

  const content = await file.text();
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<Record<string, string>>;

  let invalidRows = 0;
  const normalizeOptionalUrl = (raw: string | null) => {
    if (!raw) {
      return null;
    }
    const normalized = normalizeUrl(raw);
    if (!normalized) {
      return null;
    }
    return normalized;
  };
  const artists = records
    .map((row) => {
      const name = row.Name?.trim();
      if (!name) {
        return null;
      }
      const spotifyUrlRaw = row.spotify?.trim() || null;
      const spotifyUrl = spotifyUrlRaw ? normalizeUrl(spotifyUrlRaw) : null;
      if (spotifyUrlRaw && !spotifyUrl) {
        invalidRows += 1;
        return null;
      }

      const emailRaw = row.Email?.trim() || null;
      const email = normalizeEmailList(emailRaw);
      if (emailRaw && !email) {
        invalidRows += 1;
        return null;
      }

      const instagramRaw = row.Instagram?.trim() || null;
      const instagram = normalizeOptionalUrl(instagramRaw);

      const websiteRaw = row.website?.trim() || null;
      const website = normalizeOptionalUrl(websiteRaw);

      return {
        name,
        spotifyUrl,
        spotifyId: extractSpotifyId(spotifyUrl),
        instagram,
        monthlyListeners: parseMonthlyListeners(row.monthly_listeners),
        email,
        facebook: normalizeOptionalUrl(row.facebook?.trim() || null),
        x: normalizeOptionalUrl(row.x?.trim() || null),
        twitter: normalizeOptionalUrl(row.twitter?.trim() || null),
        tiktok: normalizeOptionalUrl(row.tiktok?.trim() || null),
        youtube: normalizeOptionalUrl(row.youtube?.trim() || null),
        soundcloud: normalizeOptionalUrl(row.soundcloud?.trim() || null),
        website,
      };
    })
    .filter(Boolean) as ImportArtist[];

  const uniqueArtists = new Map<string, ImportArtist>();
  artists.forEach((artist) => {
    const name = String(artist.name ?? "").trim().toLowerCase();
    const spotifyId = (artist.spotifyId as string | null) ?? "";
    const key = `${name}:${spotifyId}`;
    if (!uniqueArtists.has(key)) {
      uniqueArtists.set(key, artist);
    }
  });

  const deduped: ImportArtist[] = Array.from(uniqueArtists.values());

  if (!deduped.length) {
    return NextResponse.json({ error: "No rows to import." }, { status: 400 });
  }

  const nameFilters: Array<Record<string, unknown>> = deduped.map((artist) => ({
    name: { equals: String(artist.name), mode: "insensitive" },
  }));
  const spotifyIds = deduped
    .map((artist) => artist.spotifyId as string | null)
    .filter((id): id is string => Boolean(id));
  const existing = await prisma.artist.findMany({
    where: {
      OR: [
        ...nameFilters,
        ...(spotifyIds.length ? [{ spotifyId: { in: spotifyIds } }] : []),
      ],
    },
    select: { id: true, name: true, spotifyId: true },
  });

  const existingKeys = new Set(
    (existing as ExistingArtist[]).map((artist) => {
      const name = artist.name.trim().toLowerCase();
      const spotifyId = artist.spotifyId ?? "";
      return `${name}:${spotifyId}`;
    }),
  );
  const filtered: ImportArtist[] = deduped.filter((artist) => {
    const name = String(artist.name ?? "").trim().toLowerCase();
    const spotifyId = (artist.spotifyId as string | null) ?? "";
    return !existingKeys.has(`${name}:${spotifyId}`);
  });
  const skippedDuplicates = deduped.length - filtered.length;

  if (!filtered.length) {
    return NextResponse.json({ error: "No new artists to import." }, { status: 409 });
  }

  const result = await prisma.artist.createMany({
    data: filtered,
    skipDuplicates: true,
  });

  const toSync = await prisma.artist.findMany({
    where: {
      needsSync: true,
      OR: [{ spotifyId: { not: null } }, { spotifyUrl: { not: null } }],
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  let synced = 0;
  for (const artist of toSync) {
    try {
      await syncArtistById(artist.id);
      synced += 1;
    } catch (error) {
      console.error(error);
    }
  }

  const response = {
    imported: result.count,
    skippedDuplicates,
    invalidRows,
    autoSynced: synced,
  };

  await logAuditEvent({
    action: "import.csv",
    userId: session?.user?.id ?? null,
    userEmail: email,
    metadata: {
      imported: response.imported,
      skippedDuplicates: response.skippedDuplicates,
      invalidRows: response.invalidRows,
      autoSynced: response.autoSynced,
      rowCount: records.length,
    },
    request,
  });

  return NextResponse.json(response);
}
