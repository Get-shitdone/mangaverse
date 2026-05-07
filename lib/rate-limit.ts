// In-memory token bucket rate limiter, keyed by client IP.
//
// Honest scope: this runs per Vercel serverless instance (so an attacker can
// spread load across cold-started instances), but it's enough to stop the
// most common abuse — a single client hammering the proxy or search routes.
// For absolute global limits you'd point this at Upstash Redis or Vercel KV;
// the in-memory variant is a $0 sensible default.
//
// We back it with a Map sized at MAX_KEYS to avoid unbounded memory growth.

interface Bucket {
  tokens: number;
  updatedAt: number;
}

const MAX_KEYS = 5000; // bounded LRU; oldest dropped on overflow
const buckets = new Map<string, Bucket>();

function tap(key: string): Bucket | null {
  // Touching a key moves it to the end of insertion order (LRU-style).
  const b = buckets.get(key);
  if (!b) return null;
  buckets.delete(key);
  buckets.set(key, b);
  return b;
}

function evictIfNeeded() {
  if (buckets.size <= MAX_KEYS) return;
  const overflow = buckets.size - MAX_KEYS;
  let removed = 0;
  for (const k of buckets.keys()) {
    buckets.delete(k);
    if (++removed >= overflow) break;
  }
}

interface LimitOptions {
  // Maximum tokens in the bucket (= burst size).
  max?: number;
  // Tokens refilled per second (= sustained rate).
  refill?: number;
}

export interface LimitResult {
  ok: boolean;
  retryAfterSeconds?: number;
  remaining: number;
  limit: number;
}

export function rateLimit(key: string, opts: LimitOptions = {}): LimitResult {
  const max = opts.max ?? 60;
  const refill = opts.refill ?? 1; // 1 token / sec
  const now = Date.now();

  let b = tap(key);
  if (!b) {
    b = { tokens: max, updatedAt: now };
    buckets.set(key, b);
    evictIfNeeded();
  } else {
    const elapsedSec = (now - b.updatedAt) / 1000;
    b.tokens = Math.min(max, b.tokens + elapsedSec * refill);
    b.updatedAt = now;
  }

  if (b.tokens < 1) {
    const retry = Math.max(1, Math.ceil((1 - b.tokens) / refill));
    return { ok: false, retryAfterSeconds: retry, remaining: 0, limit: max };
  }

  b.tokens -= 1;
  return { ok: true, remaining: Math.floor(b.tokens), limit: max };
}

// Pull a stable client identifier from request headers. We trust Vercel's
// x-forwarded-for / x-real-ip; behind their edge these are normalized for us.
export function clientKey(req: Request | { headers: Headers }): string {
  const h = req.headers;
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const real = h.get("x-real-ip");
  if (real) return real.trim();
  // Fall back to user-agent if no IP available — better than a single global key.
  return `ua:${(h.get("user-agent") ?? "anon").slice(0, 64)}`;
}

// Convenience: run the limiter and return a Response if the client is over.
// Caller should `if (limited) return limited;` before doing real work.
export function rateLimitOrReject(
  req: Request,
  scope: string,
  opts?: LimitOptions
): Response | null {
  const key = `${scope}:${clientKey(req)}`;
  const result = rateLimit(key, opts);
  if (result.ok) return null;
  return new Response(
    JSON.stringify({
      error: "rate_limited",
      retryAfterSeconds: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds ?? 5),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}
