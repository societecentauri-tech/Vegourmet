// ─────────────────────────────────────────────────────────────────────────────
// Rate-limit basique en mémoire (fenêtre glissante simple) pour les écritures.
//
// Limite : N requêtes par fenêtre par clé (IP). Suffisant pour amortir les
// soumissions d'avis abusives sur une instance. NB : sur un déploiement
// multi-instance (Vercel serverless), l'état n'est pas partagé entre lambdas —
// c'est un garde-fou « best effort », pas une protection forte. Pour un vrai
// rate-limit distribué : Upstash/Redis (cf. DETTE.md). La modération
// (`status='pending'`) reste le rempart principal contre le spam.
// ─────────────────────────────────────────────────────────────────────────────

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Consomme un jeton pour `key`. Autorise `limit` requêtes par `windowMs`.
 * Nettoie au passage les buckets expirés (pas de fuite mémoire non bornée).
 */
export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();

  // Purge opportuniste des entrées expirées.
  if (buckets.size > 1000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

/** Extrait l'IP cliente depuis les headers d'une requête (proxy-aware). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
