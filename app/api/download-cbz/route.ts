import { NextRequest } from "next/server";
import { getAdapter } from "@/lib/sources/aggregator";
import type { SourceId } from "@/lib/sources/types";
import { buildZip } from "@/lib/zip-stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
  const source = (req.nextUrl.searchParams.get("source") ?? "mangadex") as SourceId;
  const srcId = req.nextUrl.searchParams.get("srcId") ?? "";
  const chapterId = req.nextUrl.searchParams.get("chapterId");
  const titleParam = req.nextUrl.searchParams.get("title") ?? `chapter-${chapterId}`;
  if (!chapterId) return new Response("Missing chapterId", { status: 400 });

  const adapter = getAdapter(source);
  if (!adapter) return new Response("Unknown source", { status: 404 });

  const { pages } = await adapter.getPages(srcId, chapterId).catch(() => ({ pages: [] }));
  if (!pages.length) return new Response("No pages", { status: 404 });

  // Fetch each page server-side with the right referer.
  const files: { name: string; data: Uint8Array }[] = [];
  for (let i = 0; i < pages.length; i++) {
    const decoded = decodeProxyUrl(pages[i]);
    if (!decoded) continue;
    try {
      const parsed = new URL(decoded.url);
      const referer = decoded.referer ?? chooseReferer(parsed.hostname);
      const res = await fetch(decoded.url, {
        headers: {
          Referer: referer,
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        },
        cache: "force-cache",
      });
      if (!res.ok) continue;
      const buf = new Uint8Array(await res.arrayBuffer());
      const ct = res.headers.get("content-type") ?? "image/jpeg";
      const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
      files.push({
        name: `${String(i + 1).padStart(3, "0")}.${ext}`,
        data: buf,
      });
    } catch {
      // skip page on error
    }
  }

  if (!files.length) return new Response("No pages downloaded", { status: 502 });

  const safe = titleParam.replace(/[^\w-]/g, "_").slice(0, 80);
  const zip = buildZip(files);
  // Hand back the underlying buffer slice — Response's BodyInit accepts ArrayBuffer.
  const body = zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.comicbook+zip",
      "Content-Disposition": `attachment; filename="${safe}.cbz"`,
      "Content-Length": String(zip.byteLength),
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
