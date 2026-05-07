import { NextRequest, NextResponse } from "next/server";
import { chaptersSince, findFirstMangaForTitle, formatPublishSince } from "@/lib/api/mangadex";
import type { ChapterUpdate } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PollEntry {
  mediaId: string;
  title: string;
  cover?: string | null;
  mangadexId?: string | null;
  lastSeen?: number; // epoch ms
}

interface PollPayload {
  entries: PollEntry[];
  language?: string;
  perTitle?: number;
}

// Default look-back window when the user has never polled this title.
const DEFAULT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export async function POST(req: NextRequest) {
  let body: PollPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ updates: [], error: "invalid_json" }, { status: 400 });
  }

  const { entries = [], language = "en", perTitle = 5 } = body;
  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ updates: [] });
  }

  // Resolve missing MangaDex IDs and fetch chapters in parallel, with concurrency cap.
  const resolved = await Promise.all(
    entries.slice(0, 60).map(async (e) => {
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

  // Sort newest first, cap to 100 to keep response light.
  updates.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return NextResponse.json(
    { updates: updates.slice(0, 100), resolvedMap, polledAt: Date.now() },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
