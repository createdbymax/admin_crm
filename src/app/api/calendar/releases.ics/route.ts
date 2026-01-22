import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ArtistWhere = Record<string, unknown>;
type ReleaseWhere = Record<string, unknown>;
type ReleaseItem = {
  id: string;
  name: string | null;
  releaseDate: Date;
  releaseUrl: string | null;
  artist: { id: string; name: string };
};
type ArtistFallbackItem = {
  id: string;
  name: string;
  spotifyLatestReleaseDate: Date | null;
  spotifyLatestReleaseName: string | null;
  spotifyLatestReleaseUrl: string | null;
};

const monthParamPattern = /^\d{4}-\d{2}$/;

function getMonthDate(monthParam?: string) {
  const now = new Date();
  if (!monthParam || !monthParamPattern.test(monthParam)) {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  const [yearValue, monthValue] = monthParam.split("-").map(Number);
  if (
    Number.isNaN(yearValue) ||
    Number.isNaN(monthValue) ||
    monthValue < 1 ||
    monthValue > 12
  ) {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  return new Date(Date.UTC(yearValue, monthValue - 1, 1));
}

function formatIcsDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,");
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";
  if (!email.endsWith("@losthills.io")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month") ?? undefined;
  const status = searchParams.get("status") ?? "all";
  const owner = searchParams.get("owner") ?? "all";
  const genre = searchParams.get("genre") ?? "all";

  const monthDate = getMonthDate(monthParam);
  const year = monthDate.getUTCFullYear();
  const monthIndex = monthDate.getUTCMonth();
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));

  const releaseArtistWhere: ArtistWhere = {};
  const where: ReleaseWhere = {
    releaseDate: {
      gte: start,
      lt: end,
    },
  };

  const artistWhere: ArtistWhere = {
    spotifyLatestReleaseDate: {
      gte: start,
      lt: end,
    },
  };

  if (status !== "all") {
    releaseArtistWhere.status = status as never;
    artistWhere.status = status as never;
  }
  if (owner === "unassigned") {
    releaseArtistWhere.ownerId = null;
    artistWhere.ownerId = null;
  } else if (owner !== "all") {
    releaseArtistWhere.ownerId = owner;
    artistWhere.ownerId = owner;
  }
  if (genre !== "all") {
    releaseArtistWhere.spotifyGenres = { has: genre };
    artistWhere.spotifyGenres = { has: genre };
  }
  if (Object.keys(releaseArtistWhere).length > 0) {
    where.artist = releaseArtistWhere;
  }

  const [releases, artistsFallback] = await Promise.all([
    prisma.artistRelease.findMany({
      where,
      orderBy: { releaseDate: "asc" },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    prisma.artist.findMany({
      where: artistWhere,
      orderBy: { spotifyLatestReleaseDate: "asc" },
      select: {
        id: true,
        name: true,
        spotifyLatestReleaseName: true,
        spotifyLatestReleaseDate: true,
        spotifyLatestReleaseUrl: true,
      },
    }),
  ]);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lost Hills//Artist CRM//EN",
    "CALSCALE:GREGORIAN",
  ];

  const releasesByArtist = new Set(
    (releases as ReleaseItem[]).map((release) => release.artist.id),
  );

  (releases as ReleaseItem[]).forEach((release) => {
    const dateStamp = formatIcsDate(release.releaseDate);
    const summary = escapeIcs(
      `${release.artist.name} — ${release.name ?? "Release"}`,
    );
    const description = release.releaseUrl
      ? escapeIcs(release.releaseUrl)
      : "";
    lines.push(
      "BEGIN:VEVENT",
      `UID:${release.id}-${dateStamp}@losthills`,
      `DTSTART;VALUE=DATE:${dateStamp}`,
      `SUMMARY:${summary}`,
      description ? `DESCRIPTION:${description}` : "DESCRIPTION:",
      "END:VEVENT",
    );
  });

  (artistsFallback as ArtistFallbackItem[])
    .filter((artist) => artist.spotifyLatestReleaseDate)
    .filter((artist) => !releasesByArtist.has(artist.id))
    .forEach((artist) => {
      const dateStamp = formatIcsDate(
        artist.spotifyLatestReleaseDate as Date,
      );
      const summary = escapeIcs(
        `${artist.name} — ${artist.spotifyLatestReleaseName ?? "Release"}`,
      );
      const description = artist.spotifyLatestReleaseUrl
        ? escapeIcs(artist.spotifyLatestReleaseUrl)
        : "";
      lines.push(
        "BEGIN:VEVENT",
        `UID:latest-${artist.id}-${dateStamp}@losthills`,
        `DTSTART;VALUE=DATE:${dateStamp}`,
        `SUMMARY:${summary}`,
        description ? `DESCRIPTION:${description}` : "DESCRIPTION:",
        "END:VEVENT",
      );
    });

  lines.push("END:VCALENDAR");

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"releases.ics\"",
    },
  });
}
