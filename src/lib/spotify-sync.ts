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

  return prisma.$transaction(async (tx) => {
    if (releases.length) {
      for (const release of releases) {
        await tx.artistRelease.upsert({
          where: { spotifyReleaseId: release.id },
          create: {
            artistId: artist.id,
            name: release.name,
            releaseDate: release.releaseDate,
            releaseUrl: release.url,
            releaseType: release.type,
            spotifyReleaseId: release.id,
          },
          update: {
            name: release.name,
            releaseDate: release.releaseDate,
            releaseUrl: release.url,
            releaseType: release.type,
          },
        });
      }
    }

    return tx.artist.update({
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
        spotifyLastSyncedAt: new Date(),
        needsSync: false,
      },
    });
  });
}
