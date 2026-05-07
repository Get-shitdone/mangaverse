# Security policy

## Reporting a vulnerability

Email security reports to the GitHub Security Advisories tab on this repo:
**https://github.com/Get-shitdone/mangaverse/security/advisories/new**

We aim to acknowledge within 48 hours and patch high-severity issues within
7 days.

## Threat model

Mangaverse is a static + serverless reading app. Understanding what *isn't* a
real risk here is as important as knowing what is.

### Not applicable to this app

- **SQL injection** — there is no database. All persistent data lives in the
  user's browser localStorage, never on a server.
- **Password / credential storage** — no user accounts exist. Nothing to salt,
  hash, or rotate.
- **Authenticated session hijacking, CSRF** — no auth, no cookies on the
  request side, no write operations targeting user accounts.
- **PII exposure** — we collect none.
- **Encryption at rest** — no data is stored on our servers.

Anyone selling you "anti-SQL injection middleware" or "password salting" for
this codebase is selling security theater. We won't ship it.

### What is in scope

| Risk | Mitigation in this repo |
|---|---|
| **DDoS / abuse via API routes** | Per-IP token-bucket rate limit on every `/api/*` route. Vercel's edge layer also rate-limits at the platform level. |
| **SSRF via image proxy** | `/api/proxy-image` rejects non-HTTPS URLs, embedded credentials, private IPs (10/8, 127/8, 192.168, 169.254, 172.16-31, 0/8), `localhost`, IPv6 literals, and over-length URLs. Hostname is also checked against an allowlist. |
| **Resource exhaustion** | Per-request size caps (25 MB proxy, 8 MB / page in CBZ, 250 pages / archive), 10s upstream timeout, JSON body capped at 32 KB on the chapter-updates POST. |
| **Click-jacking** | `X-Frame-Options: SAMEORIGIN` |
| **MIME sniffing** | `X-Content-Type-Options: nosniff` on every API response |
| **HTTPS downgrade** | `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` |
| **Permission abuse** | `Permissions-Policy` denies camera, microphone, geolocation, payment, USB, motion sensors, FLoC |
| **Reflected info disclosure** | API errors return generic messages — never echo upstream stack traces, hostnames, or our env vars to the client. |
| **`x-powered-by` fingerprinting** | Disabled via `poweredByHeader: false` |
| **Cross-origin hot-linking** | Image proxy returns `Cross-Origin-Resource-Policy: same-origin` |
| **XSS via injected content** | Chapter descriptions stripped of HTML tags before render. Title-page JSON-LD uses serialized data, not user input. React's auto-escaping handles the rest. |
| **OG-image abuse** | `/api/og` validates accent color (hex only), cover URL (HTTPS allowlist), and sanitizes text params (no control chars, capped length). |
| **Cover hot-link bypass** | Cover URLs route through our proxy with proper Referer; we never let a browser request MangaDex's CDN directly. |
| **Service worker poisoning** | SW served with `Cache-Control: no-cache` so updates roll out immediately. Only same-origin URLs are intercepted. Cached chapter pages are content-addressed (URL contains the immutable chapter hash). |

### Not in scope (yet)

- **Content Security Policy** — we plan to ship a report-only CSP soon, but
  rolling out a strict policy is risky for the multi-source reader (images
  come from many CDNs). A misstep there silently breaks chapter rendering.
- **Distributed rate limiting** — current rate limits are per-Vercel-instance
  (in-memory token bucket). For perfect global limits we'd point this at
  Upstash Redis or Vercel KV.
- **WAF rules** — we rely on Vercel's default WAF. We don't ship custom
  Anubis / ModSecurity rules.

### Bug-bounty scope

We're a small project with no money for a bounty program. We will credit
researchers in release notes.

Out of scope:
- Findings on third-party APIs (AniList, MangaDex, Jikan, MangaPlus, etc.) —
  report those to the upstream.
- DoS that requires obvious automation against the platform-level edge.
- Self-XSS requiring the victim to paste hostile JavaScript into devtools.
- Issues only reproducible in obsolete browsers.
- Best-practice complaints without a concrete attack scenario.
