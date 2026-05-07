import type { MediaItem, MediaType, MediaStatus, Title } from "@/lib/types";

const ANILIST_URL = "https://graphql.anilist.co";

const MEDIA_FIELDS = `
  id
  title { romaji english native userPreferred }
  description(asHtml: false)
  format
  status
  startDate { year month day }
  endDate { year month day }
  chapters
  volumes
  countryOfOrigin
  source
  averageScore
  meanScore
  popularity
  trending
  favourites
  genres
  tags { name rank isMediaSpoiler }
  isAdult
  bannerImage
  coverImage { extraLarge large medium color }
  type
  staff(perPage: 6) {
    edges { role node { name { full } } }
  }
  characters(perPage: 8, sort: ROLE) {
    edges { role node { name { full } image { medium } } }
  }
  recommendations(perPage: 10, sort: RATING_DESC) {
    edges { node { mediaRecommendation {
      id
      title { romaji english userPreferred }
      coverImage { large color }
      averageScore
      countryOfOrigin
      format
      type
      isAdult
    } } }
  }
`;

const TRENDING_FIELDS = `
  id
  title { romaji english userPreferred native }
  coverImage { extraLarge large medium color }
  bannerImage
  averageScore
  popularity
  trending
  format
  status
  countryOfOrigin
  genres
  isAdult
  description(asHtml: false)
  chapters
  startDate { year }
`;

interface AniListResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 }, // 1h ISR
  });

  if (!res.ok) {
    throw new Error(`AniList ${res.status}: ${res.statusText}`);
  }

  const json: AniListResponse<T> = await res.json();
  if (json.errors?.length) {
    throw new Error(`AniList: ${json.errors[0].message}`);
  }
  if (!json.data) throw new Error("AniList: empty response");
  return json.data;
}

// ---- Mapping helpers ----

function mapType(format: string | null, country: string | null): MediaType {
  if (format === "NOVEL") return "novel";
  if (format === "LIGHT_NOVEL") return "light_novel";
  if (format === "ONE_SHOT") return "one_shot";
  if (country === "KR") return "manhwa";
  if (country === "CN" || country === "TW") return "manhua";
  return "manga";
}

function mapStatus(s: string | null): MediaStatus | null {
  switch (s) {
    case "RELEASING":
      return "ongoing";
    case "FINISHED":
      return "completed";
    case "HIATUS":
      return "hiatus";
    case "CANCELLED":
      return "cancelled";
    case "NOT_YET_RELEASED":
      return "upcoming";
    default:
      return null;
  }
}

function mapTitle(t: any): Title {
  return {
    romaji: t?.romaji ?? null,
    english: t?.english ?? null,
    native: t?.native ?? null,
    display: t?.userPreferred ?? t?.english ?? t?.romaji ?? t?.native ?? "Untitled",
  };
}

function mapMedia(m: any): MediaItem {
  return {
    id: `anilist:${m.id}`,
    source: "anilist",
    type: mapType(m.format, m.countryOfOrigin),
    title: mapTitle(m.title),
    description: m.description ?? null,
    coverImage: {
      large: m.coverImage?.extraLarge ?? m.coverImage?.large ?? null,
      medium: m.coverImage?.medium ?? null,
      color: m.coverImage?.color ?? null,
    },
    bannerImage: m.bannerImage ?? null,
    genres: m.genres ?? [],
    tags: (m.tags ?? [])
      .filter((t: any) => !t.isMediaSpoiler)
      .map((t: any) => t.name),
    status: mapStatus(m.status),
    chapters: m.chapters ?? null,
    volumes: m.volumes ?? null,
    year: m.startDate?.year ?? null,
    score: m.averageScore ?? m.meanScore ?? null,
    popularity: m.popularity ?? null,
    isAdult: m.isAdult ?? false,
    countryOfOrigin: m.countryOfOrigin ?? null,
    staff:
      m.staff?.edges?.map((e: any) => ({
        name: e.node?.name?.full ?? "",
        role: e.role ?? "",
      })) ?? [],
    characters:
      m.characters?.edges?.map((e: any) => ({
        name: e.node?.name?.full ?? "",
        image: e.node?.image?.medium ?? null,
      })) ?? [],
    recommendations:
      m.recommendations?.edges
        ?.map((e: any) => e.node?.mediaRecommendation)
        ?.filter(Boolean)
        ?.map(mapMedia) ?? [],
    startDate: m.startDate?.year
      ? `${m.startDate.year}-${m.startDate.month ?? 1}-${m.startDate.day ?? 1}`
      : null,
    endDate: m.endDate?.year
      ? `${m.endDate.year}-${m.endDate.month ?? 1}-${m.endDate.day ?? 1}`
      : null,
  };
}

// ---- Public queries ----

export interface BrowseFilters {
  type?: "MANGA" | "ANIME";
  format_in?: string[];
  countryOfOrigin?: string;
  genre_in?: string[];
  status?: string;
  search?: string;
  isAdult?: boolean;
  sort?: string[];
  page?: number;
  perPage?: number;
  seasonYear?: number;
  startDate_greater?: number;
  startDate_lesser?: number;
}

export async function browse(filters: BrowseFilters = {}): Promise<{
  results: MediaItem[];
  pageInfo: { total: number; hasNextPage: boolean; currentPage: number; lastPage: number };
}> {
  const query = `
    query Browse(
      $type: MediaType,
      $format_in: [MediaFormat],
      $countryOfOrigin: CountryCode,
      $genre_in: [String],
      $status: MediaStatus,
      $search: String,
      $isAdult: Boolean,
      $sort: [MediaSort],
      $page: Int,
      $perPage: Int,
      $startDate_greater: FuzzyDateInt,
      $startDate_lesser: FuzzyDateInt
    ) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total currentPage lastPage hasNextPage perPage }
        media(
          type: $type,
          format_in: $format_in,
          countryOfOrigin: $countryOfOrigin,
          genre_in: $genre_in,
          status: $status,
          search: $search,
          isAdult: $isAdult,
          sort: $sort,
          startDate_greater: $startDate_greater,
          startDate_lesser: $startDate_lesser
        ) {
          ${TRENDING_FIELDS}
        }
      }
    }
  `;

  const variables = {
    type: filters.type ?? "MANGA",
    page: filters.page ?? 1,
    perPage: filters.perPage ?? 24,
    sort: filters.sort ?? ["TRENDING_DESC", "POPULARITY_DESC"],
    isAdult: filters.isAdult,
    format_in: filters.format_in,
    countryOfOrigin: filters.countryOfOrigin,
    genre_in: filters.genre_in,
    status: filters.status,
    search: filters.search,
    startDate_greater: filters.startDate_greater,
    startDate_lesser: filters.startDate_lesser,
  };

  const data: any = await gql(query, variables);
  return {
    results: (data.Page.media ?? []).map(mapMedia),
    pageInfo: data.Page.pageInfo,
  };
}

export async function getById(id: number): Promise<MediaItem> {
  const query = `query Detail($id: Int) { Media(id: $id) { ${MEDIA_FIELDS} } }`;
  const data: any = await gql(query, { id });
  return mapMedia(data.Media);
}

export async function search(term: string, limit = 12): Promise<MediaItem[]> {
  const { results } = await browse({
    search: term,
    perPage: limit,
    sort: ["SEARCH_MATCH", "POPULARITY_DESC"],
  });
  return results;
}

export async function trendingManga(limit = 18): Promise<MediaItem[]> {
  const { results } = await browse({
    sort: ["TRENDING_DESC"],
    perPage: limit,
  });
  return results;
}

export async function topManhwa(limit = 18): Promise<MediaItem[]> {
  const { results } = await browse({
    countryOfOrigin: "KR",
    sort: ["POPULARITY_DESC"],
    perPage: limit,
  });
  return results;
}

export async function topManhua(limit = 18): Promise<MediaItem[]> {
  const { results } = await browse({
    countryOfOrigin: "CN",
    sort: ["POPULARITY_DESC"],
    perPage: limit,
  });
  return results;
}

export async function topRated(limit = 18): Promise<MediaItem[]> {
  const { results } = await browse({
    sort: ["SCORE_DESC"],
    perPage: limit,
  });
  return results;
}

export async function newReleases(limit = 18): Promise<MediaItem[]> {
  const year = new Date().getFullYear();
  const { results } = await browse({
    sort: ["START_DATE_DESC", "POPULARITY_DESC"],
    perPage: limit,
    startDate_greater: parseInt(`${year}0101`, 10),
  });
  return results;
}

export async function topNovels(limit = 18): Promise<MediaItem[]> {
  const { results } = await browse({
    format_in: ["NOVEL", "LIGHT_NOVEL"],
    sort: ["POPULARITY_DESC"],
    perPage: limit,
  });
  return results;
}

export async function topByGenre(genre: string, limit = 18): Promise<MediaItem[]> {
  const { results } = await browse({
    genre_in: [genre],
    sort: ["POPULARITY_DESC"],
    perPage: limit,
  });
  return results;
}

// All AniList genres
export const ALL_GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Ecchi",
  "Fantasy",
  "Hentai",
  "Horror",
  "Mahou Shoujo",
  "Mecha",
  "Music",
  "Mystery",
  "Psychological",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];
