// Basit, bellekte tutulan hız sınırı. Vercel'de her sunucu örneği kendi sayacını tutar;
// bu yüzden kesin bir sınır değil, kötüye kullanımı yavaşlatan bir önlemdir.
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();

  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.resetAt <= now) hits.delete(k);
    }
  }

  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfter: 0 };
}

export const getClientIp = (request: Request) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  request.headers.get('x-real-ip') ||
  'unknown';
