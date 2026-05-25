const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return false;
  }

  entry.count++;
  if (entry.count > limit) return true;
  return false;
}

// Cleanup stale entries every 60s
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now > entry.reset) hits.delete(key);
    }
  }, 60_000);
}
