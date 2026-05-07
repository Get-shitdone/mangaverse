import { getById } from "@/lib/api/anilist";
import { searchGutenberg, getGutenbergBook, fetchBookText, pickTextUrl, splitChapters } from "@/lib/api/gutenberg";
import { searchBooks } from "@/lib/api/books";
import { NovelReader } from "@/components/NovelReader";
import { notFound } from "next/navigation";

export const revalidate = 86400; // 24h

export default async function ReadNovelPage({
  params,
}: {
  params: { mediaId: string };
}) {
  const id = decodeURIComponent(params.mediaId);
  const [source, rawId] = id.split(":");

  let title = "";
  let author = "";

  if (source === "anilist") {
    try {
      const m = await getById(parseInt(rawId, 10));
      title = m.title.english ?? m.title.romaji ?? m.title.display;
      author = m.staff?.[0]?.name ?? "";
    } catch {
      return notFound();
    }
  } else {
    return notFound();
  }

  // Try Project Gutenberg first
  let chapters: { title: string; body: string }[] = [];
  let foundText = false;
  let externalLink: string | null = null;

  const gutenberg = await searchGutenberg(`${title} ${author}`.trim(), 3);
  for (const book of gutenberg) {
    const url = pickTextUrl(book);
    if (!url) continue;
    const text = await fetchBookText(url);
    if (!text || text.length < 5000) continue;
    chapters = splitChapters(text);
    if (chapters.length > 0) {
      foundText = true;
      break;
    }
  }

  // Fall back to Google Books / Open Library description as preview
  if (!foundText) {
    const books = await searchBooks(`${title} ${author}`.trim(), 3);
    if (books[0]) {
      externalLink = books[0].externalUrl ?? books[0].previewLink ?? books[0].infoLink ?? null;
      if (books[0].description) {
        chapters = [
          {
            title: "Preview",
            body:
              books[0].description.replace(/<[^>]+>/g, "") +
              "\n\n— This is a publisher-provided preview. Click 'Read on Publisher' below to access the full text.",
          },
        ];
      }
    }
  }

  return (
    <NovelReader
      mediaId={id}
      bookTitle={title}
      author={author}
      chapters={chapters}
      hasFullText={foundText}
      externalLink={externalLink}
    />
  );
}
