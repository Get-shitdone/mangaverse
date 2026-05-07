// MangaPlus adapter — Shueisha's official free manga reader.
//
// We surface MangaPlus chapters as link-outs (their image cipher is non-trivial
// and copying their bytes would breach the spirit of their TOS). The free
// chapters (first 3 + latest 3 of every Shueisha title) are linked directly
// into the official reader so users get a legit, ad-supported experience.
//
// We use the publicly readable web API:
//   https://jumpg-webapi.tokyo-cdn.com/api/title_list/all_v2  (catalog protobuf)
//   https://jumpg-webapi.tokyo-cdn.com/api/title_detailV3?title_id=<id>
// For now we only implement title-name → MangaPlus id resolution + chapter list,
// using an offline-cached title roster to skip the protobuf parsing step.

import type { ChapterSourceAdapter } from "./types";
import type { Chapter } from "@/lib/types";

const MANGAPLUS_API = "https://jumpg-webapi.tokyo-cdn.com/api";
const MANGAPLUS_WEB = "https://mangaplus.shueisha.co.jp";

// Hand-curated mapping of popular Shueisha titles → MangaPlus title IDs.
// Resolves common search misses (these titles are usually licensed off MangaDex).
const KNOWN_TITLES: Record<string, number> = {
  "one piece": 100020,
  "jujutsu kaisen": 100034,
  "my hero academia": 100017,
  "boku no hero academia": 100017,
  "spy x family": 100056,
  "spy×family": 100056,
  "chainsaw man": 100037,
  "chainsawman": 100037,
  "kaiju no 8": 100191,
  "kaiju no. 8": 100191,
  "blue lock": 100027,
  "dandadan": 100217,
  "dragon ball super": 100018,
  "black clover": 100023,
  "boruto": 100008,
  "bleach": 100210,
  "the elusive samurai": 100202,
  "akane-banashi": 100214,
  "mashle": 100170,
  "mashle: magic and muscles": 100170,
  "sakamoto days": 100222,
  "ichi the witch": 200067,
  "the ichinose family's deadly sins": 200070,
  "shangri-la frontier": 100056,
};

interface MangaPlusChapter {
  chapterId: number;
  name: string; // e.g. "#100"
  subTitle: string;
  startTimeStamp?: number;
  endTimeStamp?: number;
  isVerticalOnly?: boolean;
}

interface MangaPlusDetail {
  success?: {
    titleDetailView?: {
      title?: { titleId: number; name: string };
      titleImageUrl?: string;
      overview?: string;
      firstChapterList?: MangaPlusChapter[];
      lastChapterList?: MangaPlusChapter[];
    };
  };
}

async function fetchTitleDetail(titleId: number): Promise<MangaPlusDetail | null> {
  try {
    const res = await fetch(
      `${MANGAPLUS_API}/title_detailV3?title_id=${titleId}&format=json`,
      {
        headers: {
          "User-Agent": "Mangaverse/1.0",
          Accept: "application/json",
        },
        next: { revalidate: 1800 },
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as MangaPlusDetail;
  } catch {
    return null;
  }
}

function chaptersFrom(detail: MangaPlusDetail): Chapter[] {
  const view = detail.success?.titleDetailView;
  if (!view) return [];
  const all = [...(view.firstChapterList ?? []), ...(view.lastChapterList ?? [])];
  // De-duplicate by chapterId
  const seen = new Set<number>();
  const dedup = all.filter((c) => {
    if (seen.has(c.chapterId)) return false;
    seen.add(c.chapterId);
    return true;
  });
  return dedup.map((c) => ({
    id: String(c.chapterId),
    source: "mangadex" as const, // re-use union value; consumers identify via mediaId prefix
    number: (c.name ?? "").replace(/^#/, "") || null,
    volume: null,
    title: c.subTitle ?? null,
    language: "en",
    pages: 0, // unknown — chapters open in MangaPlus reader
    publishedAt: c.startTimeStamp
      ? new Date(c.startTimeStamp * 1000).toISOString()
      : undefined,
    scanlationGroup: "MangaPlus · Official",
    externalUrl: `${MANGAPLUS_WEB}/viewer/${c.chapterId}`,
  }));
}

export const mangaplusAdapter: ChapterSourceAdapter = {
  id: "mangaplus",
  name: "MangaPlus (Official)",
  priority: 5, // highest — official, free, legal
  available: () => true,

  async resolve(title) {
    const norm = title.toLowerCase().trim();
    const id = KNOWN_TITLES[norm];
    if (!id) return null;
    const detail = await fetchTitleDetail(id);
    if (!detail?.success?.titleDetailView) return null;
    const view = detail.success.titleDetailView;
    return {
      sourceId: String(id),
      title: view.title?.name ?? title,
      coverUrl: view.titleImageUrl
        ? `/api/proxy-image?url=${encodeURIComponent(view.titleImageUrl)}`
        : null,
    };
  },

  async getChapters(sourceId) {
    const detail = await fetchTitleDetail(parseInt(sourceId, 10));
    if (!detail) return [];
    return chaptersFrom(detail);
  },

  async getPages() {
    // Pages aren't extractable without breaking MangaPlus's image cipher.
    // The chapter list emits externalUrl; the reader follows that out.
    return { pages: [] };
  },

  externalUrl(_sourceId, chapterId) {
    return `${MANGAPLUS_WEB}/viewer/${chapterId}`;
  },
};
