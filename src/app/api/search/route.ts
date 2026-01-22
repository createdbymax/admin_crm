import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SearchArtist = {
  id: string;
  name: string;
  spotifyLatestReleaseName: string | null;
  spotifyLatestReleaseDate: Date | null;
  spotifyLatestReleaseType: string | null;
};

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? "";
  if (!email.endsWith("@losthills.io")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim() ?? "";
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const results = await prisma.artist.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        {
          spotifyLatestReleaseName: { contains: query, mode: "insensitive" },
        },
        { notes: { some: { body: { contains: query, mode: "insensitive" } } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
    select: {
      id: true,
      name: true,
      spotifyLatestReleaseName: true,
      spotifyLatestReleaseDate: true,
      spotifyLatestReleaseType: true,
    },
  });

  return NextResponse.json({
    results: (results as SearchArtist[]).map((artist) => ({
      id: artist.id,
      name: artist.name,
      spotifyLatestReleaseName: artist.spotifyLatestReleaseName,
      spotifyLatestReleaseDate: artist.spotifyLatestReleaseDate
        ? artist.spotifyLatestReleaseDate.toISOString()
        : null,
      spotifyLatestReleaseType: artist.spotifyLatestReleaseType,
    })),
  });
}
