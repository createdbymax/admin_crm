type SpotifyArtistResponse = {
  followers: { total: number };
  popularity: number;
  genres: string[];
  images: Array<{ url: string }>;
};

type SpotifyAlbum = {
  id: string;
  name: string;
  release_date: string;
  release_date_precision: "year" | "month" | "day";
  external_urls: { spotify: string };
  album_type: string;
};

function parseSpotifyDate(
  releaseDate: string,
  precision: SpotifyAlbum["release_date_precision"],
) {
  if (precision === "year") {
    return new Date(`${releaseDate}-01-01`);
  }
  if (precision === "month") {
    return new Date(`${releaseDate}-01`);
  }
  return new Date(releaseDate);
}

async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Spotify credentials.");
  }

  const authToken = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch Spotify access token.");
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

export async function fetchSpotifyArtist(spotifyId: string) {
  const token = await getSpotifyAccessToken();
  const response = await fetch(
    `https://api.spotify.com/v1/artists/${spotifyId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Spotify artist.");
  }

  return (await response.json()) as SpotifyArtistResponse;
}

export async function fetchLatestRelease(spotifyId: string) {
  const releases = await fetchArtistReleases(spotifyId);
  if (!releases.length) {
    return null;
  }
  return releases[0];
}

export async function fetchArtistReleases(spotifyId: string) {
  const token = await getSpotifyAccessToken();
  const response = await fetch(
    `https://api.spotify.com/v1/artists/${spotifyId}/albums?include_groups=album,single&market=US&limit=50`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch Spotify releases.");
  }

  const data = (await response.json()) as { items: SpotifyAlbum[] };
  const releases = data.items ?? [];

  if (!releases.length) {
    return [];
  }

  const sorted = [...releases].sort((a, b) => {
    const dateA = parseSpotifyDate(a.release_date, a.release_date_precision);
    const dateB = parseSpotifyDate(b.release_date, b.release_date_precision);
    return dateB.getTime() - dateA.getTime();
  });

  return sorted.map((release) => ({
    id: release.id,
    name: release.name,
    releaseDate: parseSpotifyDate(
      release.release_date,
      release.release_date_precision,
    ),
    url: release.external_urls.spotify,
    type: release.album_type,
  }));
}
