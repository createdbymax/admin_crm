export function extractSpotifyId(spotifyUrl?: string | null) {
  if (!spotifyUrl) {
    return null;
  }
  const match = spotifyUrl.match(/open\.spotify\.com\/artist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export function normalizeUrl(value?: string | null) {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function isValidEmail(value?: string | null) {
  if (!value) {
    return false;
  }
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value.trim());
}

export function normalizeEmailList(value?: string | null) {
  if (!value) {
    return null;
  }
  const matches = value.match(
    /[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+/g,
  );
  return matches && matches.length ? matches.join(", ") : null;
}

export function parseMonthlyListeners(value?: string | null) {
  if (!value) {
    return null;
  }
  const normalized = value.replace(/,/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
