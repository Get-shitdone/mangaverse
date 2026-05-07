// Unified type system across all sources

export type MediaType =
  | "manga"
  | "manhwa"
  | "manhua"
  | "comic"
  | "novel"
  | "light_novel"
  | "one_shot";

export type MediaStatus =
  | "ongoing"
  | "completed"
  | "hiatus"
  | "cancelled"
  | "upcoming";

export interface Title {
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
  display: string;
}

export interface MediaItem {
  id: string; // unified id like "anilist:30013" or "mangadex:abc-123"
  source: "anilist" | "mangadex" | "openlibrary" | "googlebooks" | "comicvine";
  type: MediaType;
  title: Title;
  description?: string | null;
  coverImage: {
    large?: string | null;
    medium?: string | null;
    color?: string | null;
  };
  bannerImage?: string | null;
  genres: string[];
  tags?: string[];
  status?: MediaStatus | null;
  chapters?: number | null;
  volumes?: number | null;
  year?: number | null;
  score?: number | null; // 0-100
  popularity?: number | null;
  isAdult?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  countryOfOrigin?: string | null;
  staff?: { name: string; role: string }[];
  characters?: { name: string; image?: string | null }[];
  recommendations?: MediaItem[];
}

export interface Chapter {
  id: string;
  source: "mangadex";
  number: string | null;
  volume?: string | null;
  title: string | null;
  language: string;
  pages: number;
  publishedAt?: string;
  scanlationGroup?: string;
  externalUrl?: string | null;
}

export interface ChapterPages {
  baseUrl: string;
  hash: string;
  data: string[]; // page filenames
  dataSaver: string[];
  pageUrls: string[]; // resolved full URLs
}

export interface ReadingProgress {
  mediaId: string;
  chapterId?: string;
  chapterNumber?: string;
  page?: number;
  scrollPct?: number; // for novels
  updatedAt: number;
}

export type LibraryStatus =
  | "reading"
  | "plan"
  | "completed"
  | "on_hold"
  | "dropped";

export interface LibraryEntry {
  mediaId: string;
  type: MediaType;
  title: string;
  cover?: string | null;
  status: LibraryStatus;
  rating?: number; // 0-10
  notes?: string;
  addedAt: number;
  updatedAt: number;
}
