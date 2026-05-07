// Jikan v4 — MyAnimeList unofficial REST API. No key needed. Rate limit ~3/sec, 60/min.

const JIKAN = "https://api.jikan.moe/v4";

interface JikanList<T> {
  data: T[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: { count: number; total: number; per_page: number };
  };
}

async function jk<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const url = new URL(`${JIKAN}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null) url.searchParams.set(k, String(v));
  });
  const res = await fetch(url.toString(), {
    next: { revalidate: 1800 }, // 30m
  });
  if (!res.ok) throw new Error(`Jikan ${res.status}`);
  return res.json();
}

export interface JikanManga {
  mal_id: number;
  url: string;
  images: { jpg: { large_image_url: string; image_url: string }; webp?: { large_image_url: string } };
  title: string;
  title_english?: string | null;
  type: string; // Manga, Manhwa, Manhua, Novel, Light Novel, One-shot
  chapters?: number | null;
  volumes?: number | null;
  status: string;
  publishing: boolean;
  score?: number;
  scored_by?: number;
  rank?: number;
  popularity?: number;
  members?: number;
  favorites?: number;
  synopsis?: string;
  background?: string;
  authors?: { name: string }[];
  genres?: { name: string }[];
  themes?: { name: string }[];
  demographics?: { name: string }[];
}

export async function topMangaByType(
  type: "manga" | "manhwa" | "manhua" | "novel" | "lightnovel" | "oneshot",
  page = 1
): Promise<JikanList<JikanManga>> {
  return jk<JikanList<JikanManga>>("/top/manga", { type, page, limit: 25 });
}

export async function searchManga(q: string, page = 1): Promise<JikanList<JikanManga>> {
  return jk<JikanList<JikanManga>>("/manga", { q, page, limit: 24, order_by: "popularity" });
}

export async function getMangaById(id: number): Promise<JikanManga> {
  const r = await jk<{ data: JikanManga }>(`/manga/${id}`);
  return r.data;
}

export async function recommendations(): Promise<JikanList<{ entry: JikanManga[]; content: string; user: any }>> {
  return jk("/recommendations/manga");
}
