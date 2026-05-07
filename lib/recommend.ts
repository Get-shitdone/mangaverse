"use client";

import type { LibraryEntry, LibraryStatus } from "@/lib/types";

const STATUS_WEIGHT: Record<LibraryStatus, number> = {
  completed: 3,
  reading: 2.5,
  plan: 1,
  on_hold: 0.7,
  dropped: -0.5,
};

export interface GenreScore {
  genre: string;
  score: number;
  count: number;
}

// Compute affinity scores from a library against a per-entry genre map
// (mediaId -> genres[]). Returns sorted descending by score.
export function genreAffinity(
  entries: Record<string, LibraryEntry>,
  genreMap: Record<string, string[]>
): GenreScore[] {
  const scores: Record<string, { score: number; count: number }> = {};
  for (const e of Object.values(entries)) {
    const g = genreMap[e.mediaId];
    if (!g) continue;
    const w = STATUS_WEIGHT[e.status] ?? 0;
    const ratingBonus = e.rating ? e.rating / 10 : 0;
    for (const genre of g) {
      const key = genre.trim();
      if (!key) continue;
      if (!scores[key]) scores[key] = { score: 0, count: 0 };
      scores[key].score += w + ratingBonus;
      scores[key].count += 1;
    }
  }
  return Object.entries(scores)
    .map(([genre, { score, count }]) => ({ genre, score, count }))
    .sort((a, b) => b.score - a.score);
}

// Top-rated library entries (proxy for "anchor titles" for "Because you read X")
export function topAnchorTitles(
  entries: Record<string, LibraryEntry>,
  limit = 3
): LibraryEntry[] {
  return Object.values(entries)
    .filter((e) => e.status === "reading" || e.status === "completed")
    .sort((a, b) => {
      const ar = a.rating ?? 0;
      const br = b.rating ?? 0;
      if (ar !== br) return br - ar;
      return b.updatedAt - a.updatedAt;
    })
    .slice(0, limit);
}

export function readingHours(entries: Record<string, LibraryEntry>, chaptersRead: number) {
  // Rough estimate: ~3 minutes per chapter
  return Math.round((chaptersRead * 3) / 60 * 10) / 10;
}

export function libraryByStatusBreakdown(entries: Record<string, LibraryEntry>) {
  const out: Record<LibraryStatus, number> = {
    reading: 0,
    plan: 0,
    completed: 0,
    on_hold: 0,
    dropped: 0,
  };
  for (const e of Object.values(entries)) out[e.status]++;
  return out;
}
