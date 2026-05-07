import { NextRequest } from "next/server";
import { getAdapter } from "@/lib/sources/aggregator";
import type { SourceId } from "@/lib/sources/types";
import { buildZip } from "@/lib/zip-stream";
import { asSourceId, asTrimmedString, isSafeRemoteHttps } from "@/lib/validate";
import { rateLimitOrReject } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED_SOURCES = new Set<SourceId>([
  "mangadex",
  "consumet-mangakakalot",
  "consumet-mangapill",
  "consumet-mangapark",
  "consumet-mangahere",
  "consumet-mangareader",
  "mangaplus",
]);

const PER_PAGE_TIMEOUT_MS = 8_000;
const MAX_PAGES = 250;
const MAX_PAGE_BYTES = 8 * 1024 * 1024; // 8 MB per page hard cap

const PROXY_HOSTS_REFERER: Record<string, string> = {
  "uploads.mangadex.org": "https://mangadex.org/",
  "img.mghubcdn.com": "https://mangahere.cc/",
  "ww-cdn.mangakakalot.gg": "https://mangakakalot.gg/",
  "v3.mangakakalot.gg": "https://mangakakalot.gg/",
  "static.mangapill.com": "https://mangapill.com/",
  "cdn.mangapill.com": "https://mangapill.com/",
};

function chooseReferer(host: string): string {
  if (PROXY_HOSTS_REFERER[host]) return PROXY_HOSTS_REFERER[host];
  if (host.endsWith(".mangadex.network")) return "https://mangadex.org/";
  if (host.endsWith(".mangakakalot.gg")) return "https://mangakakalot.gg/";
  if (host.endsWith(".mangapill.com")) return "https://mangapill.com/";
  if (host.endsWith(".mangapark.io") || host.endsWith(".mangapark.net"))
    return "https://mangapark.io/";
  if (host.endsWith(".comick.pictures")) return "https://comick.io/";
  return "https://mangadex.org/";
}

function decodeProxyUrl(u: string): { url: string; referer?: string } | null {
  try {
    const parsed = new URL(u, "https://example.com");
    if (parsed.pathname === "/api/proxy-image") {
      const wrapped = parsed.searchParams.get("url");
      const ref = parsed.searchParams.get("referer") ?? undefined;
      if (!wrapped) return null;
      return { url: wrapped, referer: ref };
    }
    return { url: u };
  } catch {
    return { url: u };
  }
}

export async function GET(req: NextRequest) {
  // CBZ generation is heavy (fetches dozens of images), so apply a strict
  // per-IP limit. 5 burst, ~1 / 30s sustained.
  const limited = rateLimitOrReject(req, "cbz", { max: 5, refill: 0.033 });
  if (limited) return limited;

  const sourceParam = req.nextUrl.searchParams.get("source") ?? "mangadex";
  if (!ALLOWED_SOURCES.has(sourceParam as SourceId)) {
    return new Response("Unknown source", { status: 400 });
  }
  const source = sourceParam as SourceId;
  const srcId = asSourceId(req.nextUrl.searchParams.get("srcId") ?? "", 200) ?? "";
  const chapterId = asSourceId(req.nextUrl.searchParams.get("chapterId") ?? "", 200);
  if (!chapterId) return new Response("Missing or invalid chapterId", { status: 400 });
  const titleParam =
    asTrimmedString(req.nextUrl.searchParams.get("title") ?? "", 120) ??
    `chapter-${chapterId.slice(0, 8)}`;

  const adapter = getAdapter(source);
  if (!adapter) return new Response("Unknown source", { status: 404 });

  const { pages } = await adapter.getPages(srcId, chapterId).catch(() => ({ pages: [] }));
  if (!pages.length) return new Response("No pages", { status: 404 });

  // Fetch each page server-side with the right referer. Apply size + URL
  // checks to each upstream so a malicious source can't sneak in non-image
  // content or hammer us with multi-GB files.
  const files: { name: string; data: Uint8Array }[] = [];
  let totalBytes = 0;
  for (let i = 0; i < Math.min(pages.length, MAX_PAGES); i++) {
    const decoded = decodeProxyUrl(pages[i]);
    if (!decoded) continue;

    const checked = isSafeRemoteHttps(decoded.url);
    if (!checked.ok) continue;
    const referer = decoded.referer ?? chooseReferer(checked.url.hostname);

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort("page_timeout"), PER_PAGE_TIMEOUT_MS);
    try {
      const res = await fetch(decoded.url, {
        headers: {
          Referer: referer,
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        },
        cache: "force-cache",
        signal: ac.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const ct = res.headers.get("content-type") ?? "image/jpeg";
      // Only accept image bytes — never let a 200-OK HTML page sneak through
      // as a "chapter page" and end up archived as a fake .jpg.
      if (!ct.startsWith("image/")) continue;
      const cl = res.headers.get("content-length");
      if (cl && parseInt(cl, 10) > MAX_PAGE_BYTES) continue;
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.byteLength > MAX_PAGE_BYTES) continue;
      totalBytes += buf.byteLength;
      const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
      files.push({
        name: `${String(i + 1).padStart(3, "0")}.${ext}`,
        data: buf,
      });
    } catch {
      clearTimeout(timer);
      // skip page on error
    }
  }

  if (!files.length) return new Response("No pages downloaded", { status: 502 });

  // Defang the filename so an attacker can't embed CRLF or directory hops in
  // Content-Disposition. Already stripped to alphanumeric + -, but double-cap.
  const safe = titleParam.replace(/[^\w-]/g, "_").slice(0, 80);
  const zip = buildZip(files);
  const body = zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.comicbook+zip",
      "Content-Disposition": `attachment; filename="${safe}.cbz"`,
      "Content-Length": String(zip.byteLength),
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
