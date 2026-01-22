const globalForSpotify = globalThis as unknown as {
  spotifyQueue?: Promise<void>;
  spotifyLastRun?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withSpotifyRateLimit<T>(task: () => Promise<T>) {
  const queue = globalForSpotify.spotifyQueue ?? Promise.resolve();
  const next = queue.then(async () => {
    const now = Date.now();
    const last = globalForSpotify.spotifyLastRun ?? 0;
    const wait = Math.max(0, 100 - (now - last)); // Reduced from 600ms to 100ms
    if (wait) {
      await sleep(wait);
    }
    globalForSpotify.spotifyLastRun = Date.now();
  });

  globalForSpotify.spotifyQueue = next.catch(() => {});
  await next;

  return task();
}
