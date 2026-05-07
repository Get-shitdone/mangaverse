import { getChapterPages, getChapters } from "@/lib/api/mangadex";
import { getAdapter } from "@/lib/sources/aggregator";
import type { SourceId } from "@/lib/sources/types";
import { Reader } from "@/components/Reader";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: { mediaId: string; chapterId: string };
  searchParams: { md?: string; source?: string; srcId?: string };
}) {
  const sourceId = (searchParams.source ?? "mangadex") as SourceId;
  // Backward-compat: older links pass `md=<mangadexId>` instead of source/srcId.
  const sourceMangaId = searchParams.srcId ?? searchParams.md ?? "";
  const adapter = getAdapter(sourceId) ?? getAdapter("mangadex")!;

  // Fetch pages and chapter list in parallel.
  const [pagesResult, chapterListResult] = await Promise.all([
    adapter
      .getPages(sourceMangaId, params.chapterId)
      .catch(() => ({ pages: [] as string[], pagesDataSaver: undefined })),
    sourceId === "mangadex" && sourceMangaId
      ? getChapters(sourceMangaId, "en", 500, 0, { hostableOnly: true })
          .then((r) => r.chapters)
          .catch(() => [])
      : adapter.getChapters(sourceMangaId).catch(() => []),
  ]);

  const externalRedirect = adapter.externalUrl?.(sourceMangaId, params.chapterId);

  // If source returns no embeddable pages but offers an external link, send the
  // user to the publisher's reader (MangaPlus official, etc.).
  if (pagesResult.pages.length === 0 && externalRedirect) {
    redirect(externalRedirect);
  }

  if (pagesResult.pages.length === 0) {
    return (
      <div className="min-h-screen bg-ink-900 text-cream flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <p className="font-jp text-2xl text-vermillion-400 mb-2">エラー</p>
          <h1 className="display-headline text-3xl mb-3">Chapter Not Available</h1>
          <p className="text-sm text-cream/70 mb-6">
            This chapter could not be loaded from <strong>{adapter.name}</strong>.
            It may be license-restricted or marked as external.
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
      pages={pagesResult.pages}
      pagesDataSaver={pagesResult.pagesDataSaver}
      chapters={chapterListResult}
      mangadexId={sourceMangaId}
      sourceId={sourceId}
      sourceName={adapter.name}
    />
  );
}
