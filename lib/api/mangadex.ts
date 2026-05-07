import type { Chapter, ChapterPages, MediaItem } from "@/lib/types";

const MANGADEX_API = "https://api.mangadex.org";
const MANGADEX_UPLOADS = "https://uploads.mangadex.org";

interface MDResp<T> {
  result: string;
  data?: T;
  total?: number;
  limit?: number;
  offset?: number;
}

async function md<T>(path: string, params: Record<string, string | string[] | number | boolean | undefined> = {}, init: RequestInit = {}): Promise<MDResp<T>> {
  const url = new URL(`${MANGADEX_API}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v == null) return;
    if (Array.isArray(v)) {
      // Caller may already have included the [] suffix in the key. Don't double it.
      const baseKey = k.endsWith("[]") ? k : `${k}[]`;
      v.forEach((x) => url.searchParams.append(baseKey, String(x)));
    } else {
      url.searchParams.set(k, String(v));
    }
  });

  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    throw new Error(`MangaDex ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export interface MDManga {
  id: string;
  title: string;
  description: string;
  status: string;
  year: number | null;
  contentRating: string;
  tags: string[];
  altTitles: string[];
  coverFileName?: string;
  authors: string[];
  artists: string[];
}

function pickEnglish(obj: Record<string, string> | null | undefined, fallback = ""): string {
  if (!obj) return fallback;
  return obj.en ?? obj["en-us"] ?? Object.values(obj)[0] ?? fallback;
}

export async function searchManga(title: string, limit = 8): Promise<MDManga[]> {
  const data = await md<any[]>("/manga", {
    title,
    limit,
    "order[relevance]": "desc",
    "includes[]": ["cover_art", "author", "artist"],
    "contentRating[]": ["safe", "suggestive", "erotica"],
  });
  return (data.data ?? []).map((m) => mapManga(m));
}

export async function getManga(id: string): Promise<MDManga | null> {
  try {
    const data = await md<any>(`/manga/${id}`, {
      "includes[]": ["cover_art", "author", "artist"],
    });
    return data.data ? mapManga(data.data) : null;
  } catch {
    return null;
  }
}

function mapManga(m: any): MDManga {
  const attrs = m.attributes;
  const cover = m.relationships?.find((r: any) => r.type === "cover_art");
  const authors = m.relationships?.filter((r: any) => r.type === "author").map((r: any) => r.attributes?.name).filter(Boolean) ?? [];
  const artists = m.relationships?.filter((r: any) => r.type === "artist").map((r: any) => r.attributes?.name).filter(Boolean) ?? [];
  return {
    id: m.id,
    title: pickEnglish(attrs.title, "Untitled"),
    description: pickEnglish(attrs.description, ""),
    status: attrs.status ?? "",
    year: attrs.year ?? null,
    contentRating: attrs.contentRating ?? "safe",
    tags: (attrs.tags ?? []).map((t: any) => pickEnglish(t.attributes?.name, "")).filter(Boolean),
    altTitles: (attrs.altTitles ?? []).map((t: any) => Object.values(t)[0] as string).filter(Boolean),
    coverFileName: cover?.attributes?.fileName,
    authors,
    artists,
  };
}

export function coverUrl(mangaId: string, fileName: string, size: 256 | 512 | "original" = 512): string {
  if (size === "original") return `${MANGADEX_UPLOADS}/covers/${mangaId}/${fileName}`;
  return `${MANGADEX_UPLOADS}/covers/${mangaId}/${fileName}.${size}.jpg`;
}

// Wrap a MangaDex cover URL in our image proxy so browsers don't get the
// "You can read this on MangaDex.org" hotlink-protection placeholder.
export function proxiedCover(mangaId: string, fileName: string, size: 256 | 512 | "original" = 512): string {
  return `/api/proxy-image?url=${encodeURIComponent(coverUrl(mangaId, fileName, size))}`;
}

export async function getChapters(
  mangaId: string,
  language = "en",
  limit = 100,
  offset = 0,
  opts: { hostableOnly?: boolean } = {}
): Promise<{ chapters: Chapter[]; total: number; externalCount: number }> {
  const data = await md<any[]>(`/manga/${mangaId}/feed`, {
    "translatedLanguage[]": [language],
    "order[chapter]": "asc",
    "includes[]": ["scanlation_group"],
    "contentRating[]": ["safe", "suggestive", "erotica"],
    limit,
    offset,
  });

  const all: Chapter[] = (data.data ?? []).map((c: any) => {
    const group = c.relationships?.find((r: any) => r.type === "scanlation_group");
    return {
      id: c.id,
      source: "mangadex" as const,
      number: c.attributes?.chapter ?? null,
      volume: c.attributes?.volume ?? null,
      title: c.attributes?.title ?? null,
      language: c.attributes?.translatedLanguage ?? language,
      pages: c.attributes?.pages ?? 0,
      publishedAt: c.attributes?.publishAt,
      scanlationGroup: group?.attributes?.name,
      externalUrl: c.attributes?.externalUrl ?? null,
    };
  });

  const externalCount = all.filter((c) => c.pages === 0).length;
  const chapters = opts.hostableOnly ? all.filter((c) => c.pages > 0) : all;

  return { chapters, total: data.total ?? all.length, externalCount };
}

export async function getChapterPages(chapterId: string): Promise<ChapterPages> {
  const res = await fetch(`${MANGADEX_API}/at-home/server/${chapterId}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`MangaDex pages ${res.status}`);
  }
  const json = await res.json();
  const baseUrl = json.baseUrl;
  const hash = json.chapter.hash;
  const data: string[] = json.chapter.data ?? [];
  const dataSaver: string[] = json.chapter.dataSaver ?? [];

  // Resolve URLs to a stable proxy path so the browser doesn't need referer manipulation
  const pageUrls = data.map((file) => {
    const direct = `${baseUrl}/data/${hash}/${file}`;
    return `/api/proxy-image?url=${encodeURIComponent(direct)}`;
  });

  return { baseUrl, hash, data, dataSaver, pageUrls };
}

export async function findFirstMangaForTitle(title: string): Promise<MDManga | null> {
  const list = await searchManga(title, 5);
  if (!list.length) return null;
  // Prefer exact case-insensitive match
  const exact = list.find((m) => m.title.toLowerCase() === title.toLowerCase());
  return exact ?? list[0];
}

// Fetch chapters published after a given ISO timestamp. Returns most-recent first.
export async function chaptersSince(
  mangaId: string,
  sinceIso: string,
  language = "en",
  limit = 20
): Promise<Chapter[]> {
  const params: Record<string, string | string[] | number> = {
    "translatedLanguage[]": [language],
    "order[publishAt]": "desc",
    "includes[]": ["scanlation_group"],
    "contentRating[]": ["safe", "suggestive", "erotica"],
    limit,
    publishAtSince: sinceIso,
  };
  try {
    const data = await md<any[]>(`/manga/${mangaId}/feed`, params);
    return (data.data ?? []).map((c: any) => {
      const group = c.relationships?.find((r: any) => r.type === "scanlation_group");
      return {
        id: c.id,
        source: "mangadex" as const,
        number: c.attributes?.chapter ?? null,
        volume: c.attributes?.volume ?? null,
        title: c.attributes?.title ?? null,
        language: c.attributes?.translatedLanguage ?? language,
        pages: c.attributes?.pages ?? 0,
        publishedAt: c.attributes?.publishAt,
        scanlationGroup: group?.attributes?.name,
        externalUrl: c.attributes?.externalUrl ?? null,
      };
    });
  } catch {
    return [];
  }
}

// publishAt format MangaDex expects: YYYY-MM-DDTHH:MM:SS (no milliseconds, no zone)
export function formatPublishSince(epochMs: number): string {
  const d = new Date(epochMs);
  return d.toISOString().split(".")[0];
}

// ---------- MangaDex-native listings (guaranteed-readable titles) ----------

const MD_LIST_FIELDS = {
  "includes[]": ["cover_art", "author", "artist"],
  "contentRating[]": ["safe", "suggestive"],
  "availableTranslatedLanguage[]": ["en"],
  "hasAvailableChapters": "true",
};

export async function listMangaDex(
  sort: "latestUploadedChapter" | "followedCount" | "rating" | "createdAt",
  limit = 18,
  offset = 0
): Promise<MediaItem[]> {
  try {
    const data = await md<any[]>("/manga", {
      ...MD_LIST_FIELDS,
      [`order[${sort}]`]: "desc",
      limit,
      offset,
    });
    return (data.data ?? []).map((m: any) => mediaItemFromMDRaw(m));
  } catch {
    return [];
  }
}

export async function getMangaWithChapters(id: string): Promise<{
  manga: MDManga | null;
  mediaItem: MediaItem | null;
  chapters: Chapter[];
  externalCount: number;
}> {
  try {
    const manga = await getManga(id);
    if (!manga) return { manga: null, mediaItem: null, chapters: [], externalCount: 0 };
    const list = await getChapters(id, "en", 200, 0, { hostableOnly: true });
    return {
      manga,
      mediaItem: mediaItemFromMD(manga),
      chapters: list.chapters,
      externalCount: list.externalCount,
    };
  } catch {
    return { manga: null, mediaItem: null, chapters: [], externalCount: 0 };
  }
}

// Map an MDManga into the unified MediaItem schema for use with CoverCard etc.
export function mediaItemFromMD(m: MDManga): MediaItem {
  const cover = m.coverFileName
    ? proxiedCover(m.id, m.coverFileName, 512)
    : null;
  return {
    id: `mangadex:${m.id}`,
    source: "mangadex",
    type: "manga",
    title: {
      display: m.title,
      english: m.title,
      romaji: m.altTitles[0] ?? null,
      native: m.altTitles.find((t) => /[一-龯ㄱ-ㅎ가-힣]/.test(t)) ?? null,
    },
    description: m.description,
    coverImage: {
      large: cover,
      medium: m.coverFileName ? proxiedCover(m.id, m.coverFileName, 256) : null,
      color: null,
    },
    bannerImage: null,
    genres: m.tags.slice(0, 8),
    tags: m.tags,
    status:
      m.status === "ongoing"
        ? "ongoing"
        : m.status === "completed"
        ? "completed"
        : m.status === "hiatus"
        ? "hiatus"
        : m.status === "cancelled"
        ? "cancelled"
        : null,
    year: m.year,
    score: null,
    popularity: null,
    isAdult: m.contentRating === "erotica" || m.contentRating === "pornographic",
  };
}

// Same conversion but takes raw MD response (skips the intermediate MDManga shape).
function mediaItemFromMDRaw(m: any): MediaItem {
  const attrs = m.attributes ?? {};
  const cover = m.relationships?.find((r: any) => r.type === "cover_art");
  const fileName: string | undefined = cover?.attributes?.fileName;

  const titleObj = attrs.title ?? {};
  const display = titleObj.en ?? titleObj["en-us"] ?? Object.values(titleObj)[0] ?? "Untitled";
  const altList: string[] = (attrs.altTitles ?? [])
    .map((t: Record<string, string>) => Object.values(t)[0] as string)
    .filter(Boolean);

  const tagsList: string[] = (attrs.tags ?? [])
    .map((t: any) => {
      const names = t.attributes?.name ?? {};
      return names.en ?? names["en-us"] ?? Object.values(names)[0];
    })
    .filter(Boolean);

  const desc = attrs.description ?? {};
  const description = desc.en ?? desc["en-us"] ?? Object.values(desc)[0] ?? "";

  return {
    id: `mangadex:${m.id}`,
    source: "mangadex",
    type: "manga",
    title: {
      display: display as string,
      english: (titleObj.en as string) ?? null,
      romaji: altList[0] ?? null,
      native: altList.find((t) => /[一-龯ㄱ-ㅎ가-힣]/.test(t)) ?? null,
    },
    description: description as string,
    coverImage: {
      large: fileName ? proxiedCover(m.id, fileName, 512) : null,
      medium: fileName ? proxiedCover(m.id, fileName, 256) : null,
      color: null,
    },
    bannerImage: null,
    genres: tagsList.slice(0, 8),
    tags: tagsList,
    status:
      attrs.status === "ongoing"
        ? "ongoing"
        : attrs.status === "completed"
        ? "completed"
        : attrs.status === "hiatus"
        ? "hiatus"
        : attrs.status === "cancelled"
        ? "cancelled"
        : null,
    year: attrs.year ?? null,
    score: null,
    popularity: null,
    isAdult: attrs.contentRating === "erotica" || attrs.contentRating === "pornographic",
  };
}
