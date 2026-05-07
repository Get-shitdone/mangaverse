import { browse, ALL_GENRES, type BrowseFilters } from "@/lib/api/anilist";
import { CoverCard } from "@/components/CoverCard";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BrowseFilterBar } from "@/components/BrowseFilterBar";

export const revalidate = 600;

interface SearchParams {
  q?: string;
  country?: string; // KR / JP / CN
  format?: string; // MANGA / NOVEL / LIGHT_NOVEL / ONE_SHOT
  status?: string; // RELEASING / FINISHED / etc.
  genre?: string;
  sort?: string;
  page?: string;
}

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const page = parseInt(searchParams.page ?? "1", 10);
  const filters: BrowseFilters = {
    page,
    perPage: 28,
    type: "MANGA",
    search: searchParams.q,
    countryOfOrigin: searchParams.country as any,
    format_in: searchParams.format ? [searchParams.format] : undefined,
    status: searchParams.status as any,
    genre_in: searchParams.genre ? [searchParams.genre] : undefined,
    sort: searchParams.sort
      ? [searchParams.sort as any]
      : ["TRENDING_DESC", "POPULARITY_DESC"],
  };

  const { results, pageInfo } = await browse(filters);

  const heading = (() => {
    if (searchParams.q) return `Results for "${searchParams.q}"`;
    if (searchParams.country === "KR") return "Manhwa";
    if (searchParams.country === "JP") return "Manga";
    if (searchParams.country === "CN") return "Manhua";
    if (searchParams.format === "NOVEL" || searchParams.format === "LIGHT_NOVEL")
      return "Novels";
    if (searchParams.genre) return searchParams.genre;
    return "Browse";
  })();

  // Cleaner subtitle: just the total count for searches and the running page
  // tally otherwise. Avoids the awkward "Showing 28 of 5,000 titles" string.
  const subtitle = (() => {
    if (searchParams.q) {
      return `${pageInfo.total.toLocaleString()} ${
        pageInfo.total === 1 ? "match" : "matches"
      }`;
    }
    return `${pageInfo.total.toLocaleString()} titles · page ${page} of ${pageInfo.lastPage.toLocaleString()}`;
  })();

  const buildHref = (newPage: number) => {
    const sp = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== "page") sp.set(k, v);
    });
    sp.set("page", String(newPage));
    return `/browse?${sp.toString()}`;
  };

  return (
    <div className="bg-cream pb-20">
      {/* Header */}
      <header className="border-b-2 border-ink-900 bg-cream-100 halftone-bg">
        <div className="mx-auto max-w-[1600px] px-4 md:px-8 py-8 md:py-12">
          <p className="font-jp text-vermillion-600 text-lg mb-2">図書館</p>
          <h1 className="display-headline text-4xl sm:text-5xl md:text-7xl text-ink-900 mb-3">{heading}</h1>
          <p className="text-sm uppercase tracking-widest text-ink-700">{subtitle}</p>
        </div>
      </header>

      <BrowseFilterBar genres={ALL_GENRES} />

      {/* Results */}
      <div className="mx-auto max-w-[1600px] px-4 md:px-8 mt-8">
        {results.length === 0 ? (
          <div className="panel-border bg-cream-100 p-12 text-center">
            <h2 className="display-headline text-3xl mb-2">Nothing here</h2>
            <p className="text-ink-700">
              Try adjusting your filters or searching for something else.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {results.map((m, i) => (
              <CoverCard key={m.id} media={m} rank={(page - 1) * 28 + i + 1} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pageInfo.lastPage > 1 && (
          <nav className="mt-16 flex items-center justify-center gap-3">
            {page > 1 && (
              <Link
                href={buildHref(page - 1)}
                className="btn-ghost"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Link>
            )}
            <span className="text-sm uppercase tracking-widest font-bold text-ink-700">
              Page {page} of {pageInfo.lastPage}
            </span>
            {pageInfo.hasNextPage && (
              <Link
                href={buildHref(page + 1)}
                className="btn-vermillion"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}
