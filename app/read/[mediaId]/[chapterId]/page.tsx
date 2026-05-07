import { getChapterPages, getChapters } from "@/lib/api/mangadex";
import { Reader } from "@/components/Reader";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: { mediaId: string; chapterId: string };
  searchParams: { md?: string };
}) {
  const mangadexId = searchParams.md;
  if (!mangadexId) return notFound();

  const [pages, chapterList] = await Promise.all([
    getChapterPages(params.chapterId).catch(() => null),
    getChapters(mangadexId, "en", 500).catch(() => ({ chapters: [], total: 0 })),
  ]);

  if (!pages || pages.pageUrls.length === 0) {
    return (
      <div className="min-h-screen bg-ink-900 text-cream flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <p className="font-jp text-2xl text-vermillion-400 mb-2">エラー</p>
          <h1 className="display-headline text-3xl mb-3">Chapter Not Available</h1>
          <p className="text-sm text-cream/70 mb-6">
            This chapter could not be loaded. It may be license-restricted in your
            region or marked as external. Try another chapter.
          </p>
          <a href={`/title/${encodeURIComponent(params.mediaId)}`} className="btn-vermillion">
            Back to title
          </a>
        </div>
      </div>
    );
  }

  return (
    <Reader
      mediaId={decodeURIComponent(params.mediaId)}
      chapterId={params.chapterId}
      pages={pages.pageUrls}
      chapters={chapterList.chapters}
      mangadexId={mangadexId}
    />
  );
}
