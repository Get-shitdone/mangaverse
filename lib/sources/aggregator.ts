// Aggregator — tries each enabled chapter source for a given title and merges
// or falls through their results.

import type { Chapter } from "@/lib/types";
import type { ChapterSourceAdapter, ResolvedTitle, SourceId } from "./types";
import { mangadexAdapter } from "./mangadex-source";
import { consumetAdapters } from "./consumet-source";
import { mangaplusAdapter } from "./mangaplus-source";

export const ALL_ADAPTERS: ChapterSourceAdapter[] = [
  mangadexAdapter,
  mangaplusAdapter,
  ...consumetAdapters,
]
  .filter((a) => a.available())
  .sort((a, b) => a.priority - b.priority);

export function getAdapter(id: SourceId): ChapterSourceAdapter | null {
  return ALL_ADAPTERS.find((a) => a.id === id) ?? null;
}

// For a given title, race-fallback through adapters and return the first one
// that produces a non-empty chapter list. Returns mapping from source → chapters
// so the UI can let the user switch sources.
export interface SourceResolution {
  source: SourceId;
  sourceName: string;
  resolvedId: string;
  chapters: Chapter[];
}

export async function resolveAllSources(
  title: string,
  candidates: string[] = []
): Promise<SourceResolution[]> {
  const titles = [title, ...candidates].filter(Boolean);

  // Run all adapters in parallel for the primary title to maximize speed.
  const results = await Promise.all(
    ALL_ADAPTERS.map(async (adapter) => {
      for (const t of titles) {
        try {
          const resolved = await adapter.resolve(t);
          if (!resolved) continue;
          const chapters = await adapter.getChapters(resolved.sourceId);
          if (chapters.length === 0) continue;
          return {
            source: adapter.id,
            sourceName: adapter.name,
            resolvedId: resolved.sourceId,
            chapters,
          } as SourceResolution;
        } catch {
          // try next title variant
        }
      }
      return null;
    })
  );

  return results.filter((r): r is SourceResolution => r !== null);
}

// Pick the best (highest-priority) source from a list.
export function pickPrimary(resolutions: SourceResolution[]): SourceResolution | null {
  if (resolutions.length === 0) return null;
  const order = new Map(ALL_ADAPTERS.map((a, i) => [a.id, i]));
  return [...resolutions].sort(
    (a, b) => (order.get(a.source) ?? 999) - (order.get(b.source) ?? 999)
  )[0];
}
