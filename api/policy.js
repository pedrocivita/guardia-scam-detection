const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const hits = new Map();

export const LIMITS = {
  windowMs: WINDOW_MS,
  maxRequests: MAX_REQUESTS,
  maxBodyBytes: 16 * 1024,
  maxTranscriptChars: 8000,
};

export function resetLimits() {
  hits.clear();
}

export function rateLimit(ip, now = Date.now()) {
  const key = ip || 'unknown';
  const recent = (hits.get(key) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    const retryAfterSec = Math.max(1, Math.ceil((WINDOW_MS - (now - recent[0])) / 1000));
    hits.set(key, recent);
    return { allowed: false, retryAfterSec };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [entryIp, stamps] of hits) {
      if (!stamps.some((stamp) => now - stamp < WINDOW_MS)) hits.delete(entryIp);
    }
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first.slice(0, 80);
  }
  const real = request.headers.get('x-real-ip');
  if (real && real.trim()) return real.trim().slice(0, 80);
  return 'unknown';
}

export function resolveModel(value) {
  if (typeof value === 'string' && /^[A-Za-z0-9._-]{1,80}$/.test(value)) return value;
  return 'gemini-3-flash-preview';
}

export function levelForScore(score) {
  if (score >= 8) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}
