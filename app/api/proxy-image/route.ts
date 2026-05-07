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
    //   - Browser keeps it for 1 day (max-age) so navigating back is instant.
    //   - Vercel edge keeps it for 7 days (s-maxage=604800).
    //   - For 30 more days after expiry, edge serves stale bytes while it
    //     revalidates upstream in the background — covers never block a page
    //     render even when MangaDex is slow.
    //   - Vercel's CDN-Cache-Control beats the standard header on their edge,
    //     so we set both for max compatibility.
    const cacheControl =
      "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000";

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
      "CDN-Cache-Control": "public, s-maxage=604800, stale-while-revalidate=2592000",
      "Vercel-CDN-Cache-Control":
        "public, s-maxage=604800, stale-while-revalidate=2592000",
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
