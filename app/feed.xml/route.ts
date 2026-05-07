import { NextRequest } from "next/server";
import { chaptersSince, formatPublishSince, findFirstMangaForTitle } from "@/lib/api/mangadex";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = "https://mangaverse-lac.vercel.app";

interface SubItem {
  mediaId: string;
  title: string;
  mangadexId?: string | null;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function parseSubs(param: string | null): SubItem[] {
  if (!param) return [];
  try {
    // Format: base64(JSON([{mediaId, title, mangadexId}, ...]))
    const decoded = Buffer.from(param, "base64url").toString("utf-8");
    const parsed = JSON.parse(decoded);
    if (Array.isArray(parsed)) return parsed.slice(0, 40);
  } catch {}
  // Fallback: simple format `mediaId|mangadexId|title,mediaId|mangadexId|title`
  return param
    .split(",")
    .slice(0, 40)
    .map((entry) => {
      const [mediaId, mangadexId, title] = entry.split("|");
      return { mediaId, mangadexId: mangadexId || null, title: title || mediaId };
    })
    .filter((s) => s.mediaId);
}

export async function GET(req: NextRequest) {
  const subsParam = req.nextUrl.searchParams.get("library");
  const subs = parseSubs(subsParam);
  const language = req.nextUrl.searchParams.get("lang") ?? "en";

  const now = new Date();
  const since = formatPublishSince(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // If no subs, return an empty-but-valid feed with instructions.
  if (subs.length === 0) {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Mangaverse — Personalized Chapter Feed</title>
    <link>${SITE}</link>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Visit ${SITE}/library/settings to copy your personalized RSS feed URL with your library encoded into it.</description>
    <language>en-us</language>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <item>
      <title>How to subscribe</title>
      <link>${SITE}/library/settings</link>
      <description>Open ${SITE}/library/settings to generate a feed URL containing your library. Subscribe to that URL in your reader of choice.</description>
      <pubDate>${now.toUTCString()}</pubDate>
      <guid isPermaLink="false">mangaverse-feed-instructions</guid>
    </item>
  </channel>
</rss>`;
    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  // Fetch latest chapters for each sub. Resolve mangadex id by title if missing.
  const chunks = await Promise.all(
    subs.map(async (s) => {
      try {
        let mdId = s.mangadexId ?? null;
        if (!mdId) {
          const found = await findFirstMangaForTitle(s.title);
          mdId = found?.id ?? null;
        }
        if (!mdId) return [];
        const chapters = await chaptersSince(mdId, since, language, 8);
        return chapters.map((c) => ({
          mediaId: s.mediaId,
          mediaTitle: s.title,
          mangadexId: mdId!,
          ...c,
        }));
      } catch {
        return [];
      }
    })
  );

  const flat = chunks
    .flat()
    .sort(
      (a, b) =>
        new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime()
    )
    .slice(0, 60);

  const items = flat
    .map((c) => {
      const link = `${SITE}/read/${encodeURIComponent(c.mediaId)}/${c.id}?md=${c.mangadexId}`;
      const title = `${c.mediaTitle} · Ch. ${c.number ?? "—"}${c.title ? " · " + c.title : ""}`;
      const desc = `${c.scanlationGroup ?? "Unknown group"} · published ${
        c.publishedAt ? new Date(c.publishedAt).toUTCString() : "recently"
      }`;
      return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <description>${escapeXml(desc)}</description>
      <pubDate>${c.publishedAt ? new Date(c.publishedAt).toUTCString() : now.toUTCString()}</pubDate>
      <guid isPermaLink="false">${escapeXml(c.id)}</guid>
      <category>${escapeXml(c.mediaTitle)}</category>
    </item>`;
    })
    .join("\n");

  const subTitle = subs.length === 1 ? subs[0].title : `${subs.length} titles`;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Mangaverse — ${escapeXml(subTitle)}</title>
    <link>${SITE}/notifications</link>
    <atom:link href="${SITE}/feed.xml${subsParam ? `?library=${encodeURIComponent(subsParam)}` : ""}" rel="self" type="application/rss+xml" />
    <description>New chapters from your Mangaverse library, polled from MangaDex.</description>
    <language>${escapeXml(language)}-us</language>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <ttl>30</ttl>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
