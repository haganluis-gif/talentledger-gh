// In-memory sliding-window token bucket rate limiter.
// Best-effort per-Vercel-function-instance throttling. Sufficient to
// deter casual brute force and scripted abuse; for globally-consistent
// limits across instances, swap in Upstash/Vercel KV (see audit notes).

const buckets = new Map();

function bucketFor(key, limit) {
  let b = buckets.get(key);
  if (!b) {
    b = { tokens: limit, last: Date.now() };
    buckets.set(key, b);
  }
  return b;
}

/**
 * @param {string} key unique bucket key (e.g. `route:ip`)
 * @param {{limit: number, windowMs: number}} opts max `limit` calls per `windowMs`
 * @returns {{allowed: boolean, retryAfter: number}} retryAfter in seconds (0 when allowed)
 */
export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const b = bucketFor(key, limit);
  const ratePerMs = limit / windowMs;

  b.tokens = Math.min(limit, b.tokens + (now - b.last) * ratePerMs);
  b.last = now;

  if (b.tokens >= 1) {
    b.tokens -= 1;
    return { allowed: true, retryAfter: 0 };
  }

  const waitMs = (1 - b.tokens) / ratePerMs;
  return { allowed: false, retryAfter: Math.max(1, Math.ceil(waitMs / 1000)) };
}

export function clientIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}