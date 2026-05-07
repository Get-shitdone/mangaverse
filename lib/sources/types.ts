// Unified chapter-source abstraction. Every chapter provider (MangaDex,
// Consumet-aggregated providers, MangaPlus, etc.) conforms to this shape so
// the rest of the app can ask "give me chapters for title X" without caring
// where they come from.

import type { Chapter } from "@/lib/types";

export type SourceId =
  | "mangadex"
  | "consumet-mangakakalot"
  | "consumet-mangapill"
  | "consumet-mangapark"
  | "consumet-mangahere"
  | "consumet-mangareader"
  | "mangaplus";

export interface ChapterPagesResult {
  pages: string[]; // Proxy URLs that the browser can render directly.
  pagesDataSaver?: string[];
}

export interface ResolvedTitle {
  // Source-specific id used to fetch chapters / pages.
  sourceId: string;
  // Source-specific cover URL (proxied through our /api/proxy-image).
  coverUrl?: string | null;
  // The display title returned by the source — useful for fuzzy-match validation.
  title?: string;
}

export interface ChapterSourceAdapter {
  id: SourceId;
  // User-facing label shown in the source picker.
  name: string;
  // Sort weight — lower is higher priority in default aggregation.
  priority: number;
  // Whether the adapter is available given the current env. (e.g., disabled if
  // CONSUMET_API_BASE is unset.)
  available: () => boolean;
  // Look up a title and return the source-native id + cover, if found.
  resolve: (title: string) => Promise<ResolvedTitle | null>;
  // Return chapter list for a previously-resolved sourceId.
  getChapters: (sourceId: string) => Promise<Chapter[]>;
  // Return resolvable image URLs for a given source-specific chapter id.
  getPages: (sourceId: string, chapterId: string) => Promise<ChapterPagesResult>;
  // Optional: link out for chapters we can't embed (MangaPlus official, etc.).
  externalUrl?: (sourceId: string, chapterId: string) => string | null;
}
