import { withSpotifyRateLimit } from "@/lib/spotify-rate-limit";

type SpotifyTokenResponse = {
  access_token: string;
  expires_in?: number;
};

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
  images: Array<{ url: string; height: number; width: number }>;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function spotifyFetch(
  input: RequestInfo | URL,
  init: RequestInit,
  retries = 3,
) {
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await withSpotifyRateLimit(() => fetch(input, init));
    if (response.status !== 429) {
      return response;
    }
    const retryAfter = Number(response.headers.get("Retry-After"));
    if (attempt >= retries) {
      return response;
    }
    const waitMs = Number.isFinite(retryAfter) ? retryAfter * 1000 : 1000;
    await sleep(waitMs);
  }
  throw new Error("Spotify rate limit exceeded.");
}

const globalForSpotify = globalThis as unknown as {
  spotifyAccessToken?: string;
  spotifyAccessTokenExpiresAt?: number;
};

async function getSpotifyAccessToken() {
  const cachedToken = globalForSpotify.spotifyAccessToken;
  const cachedExpiry = globalForSpotify.spotifyAccessTokenExpiresAt ?? 0;
  if (cachedToken && Date.now() < cachedExpiry - 30_000) {
    return cachedToken;
  }

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

  const data = (await response.json()) as SpotifyTokenResponse;
  globalForSpotify.spotifyAccessToken = data.access_token;
  const expiresInMs = (data.expires_in ?? 3600) * 1000;
  globalForSpotify.spotifyAccessTokenExpiresAt = Date.now() + expiresInMs;
  return data.access_token;
}

export async function fetchSpotifyArtist(spotifyId: string) {
  let token = await getSpotifyAccessToken();
  let response = await spotifyFetch(
    `https://api.spotify.com/v1/artists/${spotifyId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (response.status === 401) {
    globalForSpotify.spotifyAccessToken = undefined;
    globalForSpotify.spotifyAccessTokenExpiresAt = undefined;
    token = await getSpotifyAccessToken();
    response = await spotifyFetch(
      `https://api.spotify.com/v1/artists/${spotifyId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );
  }

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
  let token = await getSpotifyAccessToken();
  let response = await spotifyFetch(
    `https://api.spotify.com/v1/artists/${spotifyId}/albums?include_groups=album,single&market=US&limit=50`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (response.status === 401) {
    globalForSpotify.spotifyAccessToken = undefined;
    globalForSpotify.spotifyAccessTokenExpiresAt = undefined;
    token = await getSpotifyAccessToken();
    response = await spotifyFetch(
      `https://api.spotify.com/v1/artists/${spotifyId}/albums?include_groups=album,single&market=US&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );
  }

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
    image: release.images?.[0]?.url ?? null,
  }));
}
