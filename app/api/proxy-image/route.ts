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
]);

function isAllowed(host: string): boolean {
  if (ALLOW_HOSTS.has(host)) return true;
  // mangadex content delivery uses subdomains like mt1.mangadex.network
  if (host.endsWith(".mangadex.network")) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new Response("Missing url param", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (!isAllowed(parsed.hostname)) {
    return new Response(`Host not allowed: ${parsed.hostname}`, { status: 403 });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        // MangaDex requires this referer or none. Setting empty referrer policy is safer than browser default.
        Referer: "https://mangadex.org/",
        "User-Agent": "Mangaverse/1.0",
      },
      cache: "force-cache",
    });

    if (!upstream.ok) {
      return new Response(`Upstream ${upstream.status}`, { status: upstream.status });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/jpeg";
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
      },
    });
  } catch (e) {
    return new Response(`Proxy error: ${(e as Error).message}`, { status: 500 });
  }
}
