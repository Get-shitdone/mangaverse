// Open Library + Google Books unified novel/comic catalog

const OPEN_LIBRARY = "https://openlibrary.org";
const GOOGLE_BOOKS = "https://www.googleapis.com/books/v1";

export interface BookItem {
  id: string;
  source: "openlibrary" | "googlebooks";
  title: string;
  authors: string[];
  description?: string;
  cover?: string | null;
  year?: number | null;
  publisher?: string;
  isbn?: string;
  pageCount?: number;
  categories?: string[];
  rating?: number;
  ratingsCount?: number;
  previewLink?: string;
  infoLink?: string;
  externalUrl?: string;
}

export async function searchBooks(query: string, limit = 12): Promise<BookItem[]> {
  // Prefer Google Books for richer metadata, fall back to Open Library
  try {
    const url = new URL(`${GOOGLE_BOOKS}/volumes`);
    url.searchParams.set("q", query);
    url.searchParams.set("maxResults", String(limit));
    if (process.env.GOOGLE_BOOKS_API_KEY) {
      url.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);
    }
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      return (json.items ?? []).map(mapGoogleBook);
    }
  } catch {
    // fall through
  }

  // Open Library fallback
  const ol = await fetch(
    `${OPEN_LIBRARY}/search.json?q=${encodeURIComponent(query)}&limit=${limit}`,
    { next: { revalidate: 3600 } }
  );
  if (!ol.ok) return [];
  const data = await ol.json();
  return (data.docs ?? []).slice(0, limit).map(mapOpenLibrary);
}

function mapGoogleBook(v: any): BookItem {
  const info = v.volumeInfo ?? {};
  return {
    id: `googlebooks:${v.id}`,
    source: "googlebooks",
    title: info.title ?? "Untitled",
    authors: info.authors ?? [],
    description: info.description,
    cover:
      info.imageLinks?.extraLarge ??
      info.imageLinks?.large ??
      info.imageLinks?.thumbnail?.replace("http:", "https:") ??
      null,
    year: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) : null,
    publisher: info.publisher,
    pageCount: info.pageCount,
    categories: info.categories ?? [],
    rating: info.averageRating,
    ratingsCount: info.ratingsCount,
    previewLink: info.previewLink,
    infoLink: info.infoLink,
    externalUrl: info.canonicalVolumeLink ?? info.infoLink,
    isbn: info.industryIdentifiers?.find((i: any) => i.type === "ISBN_13")?.identifier,
  };
}

function mapOpenLibrary(d: any): BookItem {
  return {
    id: `openlibrary:${d.key?.replace("/works/", "") ?? d.cover_edition_key ?? Math.random()}`,
    source: "openlibrary",
    title: d.title ?? "Untitled",
    authors: d.author_name ?? [],
    description: d.first_sentence?.[0],
    cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : null,
    year: d.first_publish_year ?? null,
    publisher: d.publisher?.[0],
    pageCount: d.number_of_pages_median,
    categories: d.subject?.slice(0, 6),
    isbn: d.isbn?.[0],
    externalUrl: `https://openlibrary.org${d.key}`,
  };
}

export async function getBookById(id: string): Promise<BookItem | null> {
  const [source, rest] = id.split(":");
  if (source === "googlebooks") {
    const url = new URL(`${GOOGLE_BOOKS}/volumes/${rest}`);
    if (process.env.GOOGLE_BOOKS_API_KEY) url.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return mapGoogleBook(await res.json());
  }
  if (source === "openlibrary") {
    const res = await fetch(`${OPEN_LIBRARY}/works/${rest}.json`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const d = await res.json();
    return {
      id,
      source: "openlibrary",
      title: d.title ?? "Untitled",
      authors: [],
      description: typeof d.description === "string" ? d.description : d.description?.value,
      cover: d.covers?.[0] ? `https://covers.openlibrary.org/b/id/${d.covers[0]}-L.jpg` : null,
      year: null,
      categories: d.subjects?.slice(0, 6),
      externalUrl: `${OPEN_LIBRARY}/works/${rest}`,
    };
  }
  return null;
}

// Curated novel and classic literature picks for the home page when search is empty
export const CURATED_NOVELS = [
  "Frankenstein",
  "Dune",
  "Norwegian Wood Murakami",
  "1984 Orwell",
  "Beloved Toni Morrison",
  "The Stranger Camus",
  "Kafka on the Shore",
  "Pachinko Min Jin Lee",
  "The Three-Body Problem",
  "The Handmaid's Tale",
  "Crime and Punishment",
  "Pride and Prejudice",
];

export const CURATED_LIGHT_NOVELS = [
  "Re:Zero light novel",
  "Overlord light novel",
  "Mushoku Tensei light novel",
  "Sword Art Online light novel",
  "Spice and Wolf light novel",
  "Konosuba light novel",
];

export const CURATED_COMICS = [
  "Watchmen Alan Moore",
  "Saga Brian K Vaughan",
  "Sandman Neil Gaiman",
  "Maus Spiegelman",
  "Persepolis",
  "Y The Last Man",
  "Invincible comic",
  "Daredevil Frank Miller",
  "Batman Year One",
  "Akira manga",
];
