// Project Gutenberg (Gutendex API) — public-domain novels with full text.
// Free, no key, ~70K+ books with rich metadata.

const GUTENDEX = "https://gutendex.com/books";

export interface GutenbergBook {
  id: number;
  title: string;
  authors: { name: string; birth_year?: number; death_year?: number }[];
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  copyright: boolean;
  download_count: number;
  formats: Record<string, string>; // mime → url
}

export async function searchGutenberg(query: string, limit = 6): Promise<GutenbergBook[]> {
  try {
    const res = await fetch(`${GUTENDEX}?search=${encodeURIComponent(query)}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results ?? []).slice(0, limit);
  } catch {
    return [];
  }
}

export async function getGutenbergBook(id: number): Promise<GutenbergBook | null> {
  try {
    const res = await fetch(`${GUTENDEX}/${id}`, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function pickTextUrl(book: GutenbergBook): string | null {
  const f = book.formats;
  // Prefer plain UTF-8 text, fall back to HTML.
  return (
    f["text/plain; charset=utf-8"] ??
    f["text/plain; charset=us-ascii"] ??
    f["text/plain"] ??
    f["text/html; charset=utf-8"] ??
    f["text/html"] ??
    null
  );
}

export async function fetchBookText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      headers: { "User-Agent": "Mangaverse Reader" },
    });
    if (!res.ok) return null;
    const text = await res.text();
    // Strip Project Gutenberg header / footer if present
    const startIdx = text.indexOf("*** START OF");
    const endIdx = text.indexOf("*** END OF");
    let body = text;
    if (startIdx >= 0) {
      const eol = text.indexOf("\n", startIdx);
      body = text.slice(eol + 1);
    }
    if (endIdx >= 0) {
      body = body.slice(0, body.indexOf("*** END OF"));
    }
    return body.trim();
  } catch {
    return null;
  }
}

// Split book text into chapters using common heuristics.
export function splitChapters(text: string): { title: string; body: string }[] {
  const lines = text.split(/\r?\n/);
  const chapters: { title: string; body: string }[] = [];
  let current = { title: "Beginning", body: "" };

  const chapterRe = /^(CHAPTER|Chapter|PART|Part|BOOK|Book)\s+([IVXLCDM\d]+|[A-Z][A-Za-z]+)/;
  const altRe = /^([IVXLCDM]{1,5})\.?\s*$/;

  for (const line of lines) {
    const trimmed = line.trim();
    const m1 = chapterRe.exec(trimmed);
    const m2 = altRe.exec(trimmed);
    if ((m1 || m2) && current.body.trim().length > 200) {
      chapters.push(current);
      current = { title: trimmed.slice(0, 80), body: "" };
    } else {
      current.body += line + "\n";
    }
  }
  if (current.body.trim().length > 0) chapters.push(current);

  // If no chapters detected, split by ~3000-word chunks
  if (chapters.length <= 1 && text.length > 30000) {
    const words = text.split(/\s+/);
    const chunkSize = 3000;
    const out: { title: string; body: string }[] = [];
    for (let i = 0; i < words.length; i += chunkSize) {
      out.push({
        title: `Part ${out.length + 1}`,
        body: words.slice(i, i + chunkSize).join(" "),
      });
    }
    return out;
  }

  return chapters;
}
