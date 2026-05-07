import { NextRequest, NextResponse } from "next/server";
import { chaptersSince, findFirstMangaForTitle, formatPublishSince } from "@/lib/api/mangadex";
import type { ChapterUpdate } from "@/lib/types";
import { asTrimmedString, asEpochMs, asUuid } from "@/lib/validate";
import { rateLimitOrReject } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PollEntry {
  mediaId: string;
  title: string;
  cover?: string | null;
  mangadexId?: string | null;
  lastSeen?: number;
}

const DEFAULT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const MAX_ENTRIES = 60;
const MAX_PER_TITLE = 10;
const MAX_BODY_BYTES = 32 * 1024; // 32 KB — enough for ~60 entries

export async function POST(req: NextRequest) {
  // Hourly poller burst-friendly limit: 6 burst, ~1/30s sustained.
  const limited = rateLimitOrReject(req, "chapter-updates", { max: 6, refill: 0.033 });
  if (limited) return limited;

  // Reject oversize payloads up front using the Content-Length advertised
  // by the client; saves us from streaming a megabyte before bailing.
  const cl = req.headers.get("content-length");
  if (cl && parseInt(cl, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ updates: [], error: "body_too_large" }, { status: 413 });
  }

  let body: { entries?: unknown; language?: unknown; perTitle?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ updates: [], error: "invalid_json" }, { status: 400 });
  }

  const language = asTrimmedString(body.language ?? "en", 10) ?? "en";
  // Defensive cap on perTitle and entries[]
  const rawList = Array.isArray(body.entries) ? body.entries : [];
  const perTitle = Math.min(MAX_PER_TITLE, Math.max(1, Number(body.perTitle) || 5));

  // Validate each entry; skip invalid rather than failing the whole request.
  const entries: PollEntry[] = [];
  for (const e of rawList.slice(0, MAX_ENTRIES)) {
    if (!e || typeof e !== "object") continue;
    const o = e as Record<string, unknown>;
    const mediaId = asTrimmedString(o.mediaId, 240);
    const title = asTrimmedString(o.title, 240);
    if (!mediaId || !title) continue;
    const mangadexId = asUuid(o.mangadexId);
    const lastSeen = asEpochMs(o.lastSeen) ?? 0;
    const cover = typeof o.cover === "string" && o.cover.length < 500 ? o.cover : null;
    entries.push({ mediaId, title, cover, mangadexId, lastSeen });
  }

  if (entries.length === 0) {
    return NextResponse.json({ updates: [] });
  }

  const resolved = await Promise.all(
    entries.map(async (e) => {
      try {
        let mdId = e.mangadexId ?? null;
        if (!mdId) {
          const found = await findFirstMangaForTitle(e.title);
          mdId = found?.id ?? null;
        }
        if (!mdId) return { entry: e, mdId: null, chapters: [] as any[] };

        const since = formatPublishSince(
          e.lastSeen && e.lastSeen > 0 ? e.lastSeen : Date.now() - DEFAULT_WINDOW_MS
        );
        const chapters = await chaptersSince(mdId, since, language, perTitle);
        return { entry: e, mdId, chapters };
      } catch {
        return { entry: e, mdId: null, chapters: [] as any[] };
      }
    })
  );

  const updates: ChapterUpdate[] = [];
  const resolvedMap: Record<string, string | null> = {};
  for (const r of resolved) {
    resolvedMap[r.entry.mediaId] = r.mdId;
    if (!r.mdId) continue;
    for (const c of r.chapters) {
      updates.push({
        mediaId: r.entry.mediaId,
        mediaTitle: r.entry.title,
        cover: r.entry.cover ?? null,
        chapterId: c.id,
        chapterNumber: c.number,
        chapterTitle: c.title,
        publishedAt: c.publishedAt ?? new Date().toISOString(),
        scanlationGroup: c.scanlationGroup ?? null,
        language: c.language,
        mangadexId: r.mdId,
      });
    }
  }

  updates.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return NextResponse.json(
    { updates: updates.slice(0, 100), resolvedMap, polledAt: Date.now() },
    {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    }
  );
}
