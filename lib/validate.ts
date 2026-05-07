// Lightweight input validators for API route handlers. We don't ship Zod or
// Yup because the surface area is tiny and adding 50KB of JSON-Schema overhead
// for ~6 routes is overkill.
//
// Every validator follows the same contract: returns the cleaned/normalized
// value or `null` if the input is malformed. Routes treat null as 400.

export function asTrimmedString(v: unknown, max = 200): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  if (s.length > max) return null;
  // Reject C0 control chars and DEL but allow spaces, tabs, CR/LF in
  // multi-line search descriptions. We do this with an explicit code-point
  // scan to keep intent obvious and avoid linter-confusing regex escapes.
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if ((c < 0x20 && c !== 0x09 && c !== 0x0a && c !== 0x0d) || c === 0x7f) {
      return null;
    }
  }
  return s;
}

export function asPositiveInt(v: unknown, max = 10_000_000): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v > 0 && v <= max) {
    return Math.floor(v);
  }
  if (typeof v === "string") {
    const n = parseInt(v, 10);
    if (Number.isFinite(n) && n > 0 && n <= max) return n;
  }
  return null;
}

export function asEpochMs(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return 0;
  // Reject implausible timestamps: pre-2010 or far-future.
  if (v < 1_262_304_000_000 || v > 4_102_444_800_000) return 0;
  return Math.floor(v);
}

export function asUuid(v: unknown): string | null {
  if (typeof v !== "string") return null;
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(v)) return null;
  return v.toLowerCase();
}

// Source-specific id permits a wider charset (slugs from Mangakakalot etc.)
// but caps length and excludes control chars, slashes, and shell metas.
export function asSourceId(v: unknown, max = 200): string | null {
  if (typeof v !== "string") return null;
  if (v.length === 0 || v.length > max) return null;
  if (!/^[A-Za-z0-9._\-:/]+$/.test(v)) return null;
  return v;
}

// MediaId we use everywhere is "<source>:<rest>" with a known prefix set.
export function asMediaId(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const decoded = decodeURIComponent(v);
  if (decoded.length > 240) return null;
  const [src, rest] = decoded.split(":");
  if (!src || !rest) return null;
  if (!["anilist", "mangadex", "curated", "comicvine", "googlebooks", "openlibrary"].includes(src)) {
    return null;
  }
  if (!/^[A-Za-z0-9._\-]+$/.test(rest)) return null;
  return decoded;
}

// Tighter URL parser used by /api/proxy-image SSRF guard.
const PRIVATE_IPV4 = [
  /^10\./,
  /^127\./,
  /^192\.168\./,
  /^169\.254\./, // link-local
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^0\./,
];

export function isSafeRemoteHttps(urlStr: string): { ok: true; url: URL } | { ok: false; reason: string } {
  if (urlStr.length > 1024) return { ok: false, reason: "url_too_long" };
  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }
  if (u.protocol !== "https:") return { ok: false, reason: "non_https" };
  // Reject userinfo (https://user:pass@host) — no legit upstream uses these
  if (u.username || u.password) return { ok: false, reason: "credentials_in_url" };
  // Reject private/loopback/link-local IP literals — SSRF guard.
  const host = u.hostname;
  if (host === "localhost" || host === "::1") return { ok: false, reason: "loopback" };
  if (PRIVATE_IPV4.some((re) => re.test(host))) return { ok: false, reason: "private_ip" };
  // Block IPv6 literals defensively (we don't use any IPv6-only upstreams)
  if (host.includes(":")) return { ok: false, reason: "ipv6_literal" };
  return { ok: true, url: u };
}
