import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOW_HOSTS = new Set([
  "uploads.mangadex.org",
  "mangadex.network",
  "s4.anilist.co",
  "img.anili.st",
  "covers.openlibrary.org",
  "books.google.com",
  "comicvine.gamespot.com",
  "static.comicvine.com",
  "cdn.myanimelist.net",
  // Consumet aggregated providers
  "img.mghubcdn.com",
  "ww-cdn.mangakakalot.gg",
  "v3.mangakakalot.gg",
  "img.mghubcdn.com",
  "static.mangapill.com",
  "cdn.mangapill.com",
  "mangapark.io",
  "img1.mangapark.net",
  "img2.mangapark.net",
  "img3.mangapark.net",
  "i.mp.kakaocdn.net",
  "comick.pictures",
  "meo.comick.pictures",
  "meo2.comick.pictures",
  "meo3.comick.pictures",
  // MangaPlus
  "mangaplus.shueisha.co.jp",
  "jumpg-assets.tokyo-cdn.com",
]);

const HOSTS_WITH_REFERER: Record<string, string> = {
  // Most CDNs honor a generic referer of their main page.
  "uploads.mangadex.org": "https://mangadex.org/",
  "img.mghubcdn.com": "https://mangahere.cc/",
  "ww-cdn.mangakakalot.gg": "https://mangakakalot.gg/",
  "v3.mangakakalot.gg": "https://mangakakalot.gg/",
  "static.mangapill.com": "https://mangapill.com/",
  "cdn.mangapill.com": "https://mangapill.com/",
  "img1.mangapark.net": "https://mangapark.io/",
  "img2.mangapark.net": "https://mangapark.io/",
  "img3.mangapark.net": "https://mangapark.io/",
  "meo.comick.pictures": "https://comick.io/",
  "meo2.comick.pictures": "https://comick.io/",
  "meo3.comick.pictures": "https://comick.io/",
};

function isAllowed(host: string): boolean {
  if (ALLOW_HOSTS.has(host)) return true;
  if (host.endsWith(".mangadex.network")) return true;
  if (host.endsWith(".mangakakalot.gg")) return true;
  if (host.endsWith(".mangapill.com")) return true;
  if (host.endsWith(".mangapark.io")) return true;
  if (host.endsWith(".mangapark.net")) return true;
  if (host.endsWith(".comick.pictures")) return true;
  if (host.endsWith(".tokyo-cdn.com")) return true;
  return false;
}

// Content-addressed paths: same URL = same bytes, forever. Safe to mark
// `immutable` so browsers skip even conditional revalidation.
function isImmutableContent(url: URL): boolean {
  // MangaDex chapter pages: /data/<hash>/... and /data-saver/<hash>/...
  if (url.hostname.endsWith(".mangadex.network") || url.hostname === "uploads.mangadex.org") {
    if (url.pathname.includes("/data/") || url.pathname.includes("/data-saver/")) return true;
  }
  // Comick chapter pages live under hashed subdomains, all content-addressed.
  if (url.hostname.endsWith(".comick.pictures")) return true;
  // MangaPill chapter pages
  if (url.hostname.endsWith(".mangapill.com") && url.pathname.startsWith("/chapters/")) {
    return true;
  }
  // MangaKakalot chapter pages
  if (
    url.hostname.endsWith(".mangakakalot.gg") &&
    /\/chapters?\//i.test(url.pathname)
  ) {
    return true;
  }
  // MangaPark chapter pages live under img1/img2/img3 with hashed paths
  if (
    /^img\d?\.mangapark\.(io|net)$/.test(url.hostname) &&
    /\/uploads?\//i.test(url.pathname)
  ) {
    return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const refererOverride = req.nextUrl.searchParams.get("referer");
  if (!url) return new Response("Missing url param", { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (!isAllowed(parsed.hostname)) {
    return new Response(`Host not allowed: ${parsed.hostname}`, { status: 403 });
  }

  const referer = refererOverride ?? HOSTS_WITH_REFERER[parsed.hostname] ?? "https://mangadex.org/";

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        Referer: referer,
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      },
      cache: "force-cache",
    });

    if (!upstream.ok) {
      // Cache failed lookups briefly so a single bad URL doesn't hammer the
      // upstream every page-load, but expire fast so transient outages clear.
      return new Response(`Upstream ${upstream.status}`, {
        status: upstream.status,
        headers: { "Cache-Control": "public, max-age=60, s-maxage=60" },
      });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    const upstreamLength = upstream.headers.get("content-length");
    const upstreamEtag = upstream.headers.get("etag");

    // Cache strategy:
    //   Chapter pages (content-addressed: URL contains the chapter hash → same
    //   URL forever serves the same bytes):
    //     - Browser:   1 year, immutable. No conditional requests, ever.
    //     - Edge:      1 year. Stays warm forever; Vercel will GC eventually.
    //   Covers, banners, headers (URL can be re-issued for the same title):
    //     - Browser:   1 day for instant back-navigation.
    //     - Edge:      7 days.
    //     - SWR window: +30 days — the edge keeps serving stale bytes while
    //       it revalidates in the background, so renders never block on
    //       MangaDex slowness.
    //   Vercel-CDN-Cache-Control beats the standard header on their edge, so
    //   we set both for max compatibility.
    const immutable = isImmutableContent(parsed);

    const cacheControl = immutable
      ? "public, max-age=31536000, immutable"
      : "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000";

    const cdnCacheControl = immutable
      ? "public, s-maxage=31536000, immutable"
      : "public, s-maxage=604800, stale-while-revalidate=2592000";

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
      "CDN-Cache-Control": cdnCacheControl,
      "Vercel-CDN-Cache-Control": cdnCacheControl,
    };
    if (upstreamLength) headers["Content-Length"] = upstreamLength;
    if (upstreamEtag) headers.ETag = upstreamEtag;

    return new Response(upstream.body, {
      status: 200,
      headers,
    });
  } catch (e) {
    return new Response(`Proxy error: ${(e as Error).message}`, { status: 500 });
  }
}
