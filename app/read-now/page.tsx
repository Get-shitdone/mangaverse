import { listMangaDex } from "@/lib/api/mangadex";
import { CoverCard } from "@/components/CoverCard";
import { SectionRow } from "@/components/SectionRow";

export const revalidate = 600; // 10 min

export default async function ReadNowPage({
  searchParams,
}: {
  searchParams: { sort?: string; page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const sort =
    searchParams.sort === "followedCount" ||
    searchParams.sort === "rating" ||
    searchParams.sort === "createdAt"
      ? searchParams.sort
      : "latestUploadedChapter";

  const offset = (page - 1) * 28;
  const [list, popular, fresh] = await Promise.all([
    listMangaDex(sort, 28, offset).catch(() => []),
    page === 1 ? listMangaDex("followedCount", 14).catch(() => []) : Promise.resolve([]),
    page === 1 ? listMangaDex("createdAt", 14).catch(() => []) : Promise.resolve([]),
  ]);

  const sortLabel: Record<string, string> = {
    latestUploadedChapter: "Just Updated",
    followedCount: "Most Followed",
    rating: "Highest Rated",
    createdAt: "Newly Added",
  };

  return (
    <div className="bg-cream pb-20">
      {/* Hero */}
      <header className="relative border-b-2 border-ink-900 bg-ink-900 text-cream overflow-hidden">
        <div className="absolute inset-0 halftone-bg opacity-20" />
        <div className="relative mx-auto max-w-[1600px] px-4 md:px-8 py-20 md:py-28">
          <p className="font-jp text-vermillion-400 text-2xl mb-3">今すぐ読む</p>
          <h1 className="display-headline text-6xl md:text-9xl text-cream leading-[0.85] mb-4">
            READ NOW
          </h1>
          <p className="max-w-xl text-cream/80 text-lg">
            Every title here streams chapters live from MangaDex. Click any cover
            to start reading immediately — no licensing dead-ends.
          </p>

          {/* Sort tabs */}
          <div className="mt-7 flex flex-wrap gap-2">
            {Object.entries(sortLabel).map(([key, label]) => (
              <a
                key={key}
                href={`/read-now?sort=${key}`}
                className={`inline-flex items-center border-2 px-4 py-2 text-xs font-bold uppercase tracking-widest transition ${
                  sort === key
                    ? "border-vermillion-400 bg-vermillion-600 text-cream"
                    : "border-cream/40 bg-cream/5 text-cream hover:bg-cream hover:text-ink-900"
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden md:block speed-lines opacity-15" />
      </header>

      {/* Main grid */}
      <section className="mx-auto max-w-[1600px] px-4 md:px-8 mt-12">
        <div className="mb-6 flex items-baseline gap-3">
          <span className="font-jp text-2xl text-vermillion-600 leading-none">読む</span>
          <h2 className="display-headline text-3xl md:text-5xl text-ink-900 leading-none">
            {sortLabel[sort]}
          </h2>
        </div>

        {list.length === 0 ? (
          <div className="panel-border bg-cream-100 p-12 text-center">
            <h3 className="display-headline text-2xl mb-2">Nothing here</h3>
            <p className="text-ink-700">Try a different sort.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {list.map((m, i) => (
              <CoverCard key={m.id} media={m} rank={offset + i + 1} />
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-12 flex items-center justify-center gap-3">
          {page > 1 && (
            <a
              href={`/read-now?sort=${sort}&page=${page - 1}`}
              className="btn-ghost"
            >
              ← Prev
            </a>
          )}
          <span className="text-sm uppercase tracking-widest font-bold text-ink-700">
            Page {page}
          </span>
          {list.length === 28 && (
            <a
              href={`/read-now?sort=${sort}&page=${page + 1}`}
              className="btn-vermillion"
            >
              Next →
            </a>
          )}
        </div>
      </section>

      {/* Featured rails on first page */}
      {page === 1 && popular.length > 0 && (
        <SectionRow
          title="Reader Favorites"
          subtitle="Most-followed titles on MangaDex"
          kanji="お気に入り"
        >
          {popular.map((m) => (
            <div key={m.id} className="snap-start">
              <CoverCard media={m} />
            </div>
          ))}
        </SectionRow>
      )}

      {page === 1 && fresh.length > 0 && (
        <SectionRow
          title="Just Added"
          subtitle="New to the catalog"
          kanji="新規追加"
        >
          {fresh.map((m) => (
            <div key={m.id} className="snap-start">
              <CoverCard media={m} />
            </div>
          ))}
        </SectionRow>
      )}
    </div>
  );
}
