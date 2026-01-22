import { prisma } from "@/lib/prisma";
import { extractSpotifyId } from "@/lib/artist-utils";
import { fetchArtistReleases, fetchSpotifyArtist } from "@/lib/spotify";
import { withSpotifyRateLimit } from "@/lib/spotify-rate-limit";

export async function syncArtistById(artistId: string) {
  const artist = await prisma.artist.findUnique({
    where: { id: artistId },
  });

  if (!artist) {
    throw new Error("Artist not found.");
  }

  const spotifyId = artist.spotifyId ?? extractSpotifyId(artist.spotifyUrl);
  if (!spotifyId) {
    throw new Error("Artist does not have a Spotify ID.");
  }

  const [spotifyArtist, releases] = await withSpotifyRateLimit(() =>
    Promise.all([fetchSpotifyArtist(spotifyId), fetchArtistReleases(spotifyId)]),
  );

  const latestRelease = releases[0] ?? null;

  console.log('Spotify sync data:', {
    artistImage: spotifyArtist.images?.[0]?.url,
    releaseImage: latestRelease?.image,
    releaseName: latestRelease?.name,
  });

  // Batch upsert releases to avoid N+1 queries
  if (releases.length > 0) {
    const releaseIds = releases.map(r => r.id);
    const existing = await prisma.artistRelease.findMany({
      where: { spotifyReleaseId: { in: releaseIds } },
      select: { spotifyReleaseId: true }
    });

    const existingIds = new Set(existing.map(r => r.spotifyReleaseId));
    const toCreate = releases.filter(r => !existingIds.has(r.id));
    const toUpdate = releases.filter(r => existingIds.has(r.id));

    await Promise.all([
      toCreate.length > 0 ? prisma.artistRelease.createMany({
        data: toCreate.map(release => ({
          artistId: artist.id,
          name: release.name,
          releaseDate: release.releaseDate,
          releaseUrl: release.url,
          releaseType: release.type,
          spotifyReleaseId: release.id,
        })),
        skipDuplicates: true
      }) : Promise.resolve(),
      ...toUpdate.map(release => 
        prisma.artistRelease.updateMany({
          where: { 
            spotifyReleaseId: release.id,
            artistId: artist.id 
          },
          data: {
            name: release.name,
            releaseDate: release.releaseDate,
            releaseUrl: release.url,
            releaseType: release.type,
          }
        })
      )
    ]);
  }

  return prisma.artist.update({
    where: { id: artist.id },
    data: {
      spotifyId,
      spotifyFollowers: spotifyArtist.followers?.total ?? null,
      spotifyPopularity: spotifyArtist.popularity ?? null,
      spotifyGenres: spotifyArtist.genres ?? [],
      spotifyImage: spotifyArtist.images?.[0]?.url ?? null,
      spotifyLatestReleaseName: latestRelease?.name ?? null,
      spotifyLatestReleaseDate: latestRelease?.releaseDate ?? null,
      spotifyLatestReleaseUrl: latestRelease?.url ?? null,
      spotifyLatestReleaseType: latestRelease?.type ?? null,
      spotifyLatestReleaseImage: latestRelease?.image ?? null,
      spotifyLastSyncedAt: new Date(),
      needsSync: false,
    },
  });
}
