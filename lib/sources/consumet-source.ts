// Consumet adapter — wraps the public Consumet API (or a self-hosted instance
// configured via CONSUMET_API_BASE) so we can pull chapters from any of these
// providers as a fallback when MangaDex is missing the title:
// mangakakalot, mangapill, mangapark, mangareader, mangasee123, mangahere.
//
// We expose ONE adapter per provider so the source-picker UI can show them
// individually and let the user choose.

import type { Chapter } from "@/lib/types";
import type { ChapterSourceAdapter, SourceId } from "./types";

const DEFAULT_BASE = "https://api.consumet.org";

function getBase(): string {
  return (process.env.CONSUMET_API_BASE ?? DEFAULT_BASE).replace(/\/$/, "");
}

interface ConsumetSearchResp {
  results: Array<{
    id: string; // provider-specific id / slug
    title: string;
    image?: string;
    headerForImage?: { Referer?: string };
  }>;
  hasNextPage?: boolean;
}

interface ConsumetInfoResp {
  id: string;
  title: string;
  image?: string;
  description?: string;
  headerForImage?: { Referer?: string };
  chapters?: Array<{
    id: string;
    title?: string;
    chapter?: string;
    chapterNumber?: string;
    volume?: string;
    releasedDate?: string;
  }>;
}

interface ConsumetPagesResp {
  pages?: Array<{ img?: string; url?: string; page?: number }>;
  // Some providers wrap differently
  page?: Array<{ img?: string; url?: string }>;
  headerForImage?: { Referer?: string };
}

async function consumetGet<T>(path: string): Promise<T | null> {
  try {
    const url = `${getBase()}${path}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function makeAdapter(
  provider: "mangakakalot" | "mangapill" | "mangapark" | "mangahere" | "mangareader",
  prettyName: string,
  priority: number
): ChapterSourceAdapter {
  const id: SourceId = `consumet-${provider}` as SourceId;
  return {
    id,
    name: prettyName,
    priority,
    available: () => true,

    async resolve(title) {
      const search = await consumetGet<ConsumetSearchResp>(
        `/manga/${provider}/${encodeURIComponent(title)}`
      );
      if (!search?.results?.length) return null;
      // Best-match heuristic: exact case-insensitive match first, then closest length.
      const lo = title.toLowerCase().trim();
      const exact = search.results.find((r) => r.title.toLowerCase() === lo);
      const head = exact ?? search.results[0];
      return {
        sourceId: head.id,
        title: head.title,
        coverUrl: head.image
          ? `/api/proxy-image?url=${encodeURIComponent(head.image)}`
          : null,
      };
    },

    async getChapters(sourceId) {
      const info = await consumetGet<ConsumetInfoResp>(
        `/manga/${provider}/info?id=${encodeURIComponent(sourceId)}`
      );
      if (!info?.chapters) return [];
      return info.chapters.map<Chapter>((c) => ({
        id: c.id,
        source: "mangadex" as const, // we keep "mangadex" union value for now; caller knows the actual source via mediaId prefix
        number: c.chapter ?? c.chapterNumber ?? null,
        volume: c.volume ?? null,
        title: c.title ?? null,
        language: "en",
        pages: 0, // unknown until we fetch
        publishedAt: c.releasedDate,
        scanlationGroup: prettyName,
        externalUrl: null,
      }));
    },

    async getPages(_sourceId, chapterId) {
      const data = await consumetGet<ConsumetPagesResp>(
        `/manga/${provider}/read?chapterId=${encodeURIComponent(chapterId)}`
      );
      if (!data) return { pages: [] };
      const list = data.pages ?? data.page ?? [];
      const referer = data.headerForImage?.Referer;
      const pages = list
        .map((p) => p.img ?? p.url)
        .filter((u): u is string => Boolean(u))
        .map(
          (img) =>
            `/api/proxy-image?url=${encodeURIComponent(img)}${
              referer ? `&referer=${encodeURIComponent(referer)}` : ""
            }`
        );
      return { pages };
    },
  };
}

export const consumetAdapters: ChapterSourceAdapter[] = [
  makeAdapter("mangakakalot", "MangaKakalot", 20),
  makeAdapter("mangapill", "MangaPill", 25),
  makeAdapter("mangapark", "MangaPark", 30),
  makeAdapter("mangareader", "MangaReader", 35),
  makeAdapter("mangahere", "MangaHere", 40),
];
