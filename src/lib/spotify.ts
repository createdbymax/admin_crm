import { setSpotifyRateLimitPause, withSpotifyRateLimit } from "@/lib/spotify-rate-limit";

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[Spotify] Aborting request after 10s timeout`);
      controller.abort();
    }, 10000); // 10 second timeout
    
    try {
      console.log(`[Spotify] Making request (attempt ${attempt + 1}/${retries + 1})...`);
      const response = await withSpotifyRateLimit(() => 
        fetch(input, { ...init, signal: controller.signal })
      );
      clearTimeout(timeoutId);
      
      console.log(`[Spotify] Got response: ${response.status}`);
      
      if (response.status !== 429) {
        return response;
      }
      
      // Handle rate limiting
      const retryAfter = Number(response.headers.get("Retry-After"));
      const waitMs = Number.isFinite(retryAfter) ? retryAfter * 1000 : 1000;
      setSpotifyRateLimitPause(waitMs);
      
      // If rate limit is more than 60 seconds, fail immediately
      if (waitMs > 60000) {
        console.error(
          `[Spotify] Rate limited for ${Math.round(waitMs / 1000)}s - too long, pausing requests`,
        );
        throw new Error(`Spotify rate limit: wait ${Math.round(waitMs / 1000)}s`);
      }
      
      if (attempt >= retries) {
        throw new Error(`Spotify rate limit exceeded after ${retries} retries`);
      }
      
      console.log(`[Spotify] Rate limited, waiting ${waitMs}ms...`);
      await sleep(waitMs);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`[Spotify] Request timeout on attempt ${attempt + 1}`);
        if (attempt >= retries) {
          throw new Error('Spotify API timeout after retries');
        }
        await sleep(1000);
      } else {
        console.error(`[Spotify] Request error:`, error);
        throw error;
      }
    }
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

  console.log('[Spotify] Fetching new access token...');
  
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('[Spotify] Missing credentials! SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not set');
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
    const errorText = await response.text().catch(() => 'Unable to read error');
    console.error(`[Spotify] Token fetch failed: ${response.status} - ${errorText}`);
    throw new Error("Failed to fetch Spotify access token.");
  }

  const data = (await response.json()) as SpotifyTokenResponse;
  globalForSpotify.spotifyAccessToken = data.access_token;
  const expiresInMs = (data.expires_in ?? 3600) * 1000;
  globalForSpotify.spotifyAccessTokenExpiresAt = Date.now() + expiresInMs;
  
  console.log(`[Spotify] ✓ Got new access token, expires in ${data.expires_in}s`);
  
  return data.access_token;
}

export async function fetchSpotifyArtist(spotifyId: string) {
  console.log(`[Spotify] Fetching artist ${spotifyId}...`);
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
    console.log(`[Spotify] Token expired, refreshing...`);
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

  console.log(`[Spotify] Artist response status: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unable to read error');
    console.error(`[Spotify] Artist fetch failed: ${response.status} - ${errorText}`);
    throw new Error(`Failed to fetch Spotify artist: ${response.status}`);
  }

  const data = await response.json() as SpotifyArtistResponse;
  console.log(`[Spotify] ✓ Fetched artist ${spotifyId}: ${data.followers?.total || 0} followers`);
  return data;
}

export async function fetchLatestRelease(spotifyId: string) {
  const releases = await fetchArtistReleases(spotifyId);
  if (!releases.length) {
    return null;
  }
  return releases[0];
}

export async function fetchArtistReleases(spotifyId: string) {
  console.log(`[Spotify] Fetching releases for ${spotifyId}...`);
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
    console.log(`[Spotify] Token expired, refreshing...`);
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

  console.log(`[Spotify] Releases response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unable to read error');
    console.error(`[Spotify] Releases fetch failed: ${response.status} - ${errorText}`);
    throw new Error(`Failed to fetch Spotify releases: ${response.status}`);
  }

  const data = (await response.json()) as { items: SpotifyAlbum[] };
  const releases = data.items ?? [];
  
  console.log(`[Spotify] ✓ Fetched ${releases.length} releases for ${spotifyId}`);

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
