import { search as anilistSearch, trendingManga } from "@/lib/api/anilist";
import { CoverCard } from "@/components/CoverCard";
import { SearchBar } from "@/components/SearchBar";
import { Sparkles } from "lucide-react";

export const revalidate = 60;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim() ?? "";

  const [results, suggestions] = await Promise.all([
    q ? anilistSearch(q, 30).catch(() => []) : Promise.resolve([]),
    !q ? trendingManga(12).catch(() => []) : Promise.resolve([]),
  ]);

  return (
    <div className="bg-cream pb-20">
      <header className="border-b-2 border-ink-900 bg-cream-100 halftone-bg">
        <div className="mx-auto max-w-[1600px] px-4 md:px-8 py-12">
          <p className="font-jp text-vermillion-600 text-lg mb-2">検索</p>
          <h1 className="display-headline text-5xl md:text-7xl text-ink-900 mb-6">
            Search
          </h1>
          <SearchBar initial={q} />
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 md:px-8 mt-8">
        {q ? (
          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-ink-700 mb-6">
              {results.length} results for &ldquo;{q}&rdquo;
            </p>
            {results.length === 0 ? (
              <div className="panel-border bg-cream-100 p-12 text-center max-w-2xl mx-auto">
                <h2 className="display-headline text-3xl mb-2">No matches</h2>
                <p className="text-ink-700">
                  Try a different spelling, or remove some words.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {results.map((m) => (
                  <CoverCard key={m.id} media={m} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="display-headline text-2xl text-ink-900 mb-5 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-vermillion-600" />
              Trending Right Now
            </h2>
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {suggestions.map((m, i) => (
                <CoverCard key={m.id} media={m} rank={i + 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
