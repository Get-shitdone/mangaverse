import { getCuratedComics, getTopComicsFromVine } from "@/lib/api/comicvine";
import { CoverCard } from "@/components/CoverCard";
import { topByGenre } from "@/lib/api/anilist";

export const revalidate = 21600;

export default async function ComicsPage() {
  const [curated, recent, classics] = await Promise.all([
    getCuratedComics(),
    getTopComicsFromVine(12),
    topByGenre("Action", 12).catch(() => []),
  ]);

  return (
    <div className="bg-cream pb-20">
      {/* Hero */}
      <header className="relative border-b-2 border-ink-900 bg-ink-900 text-cream overflow-hidden">
        <div className="absolute inset-0 halftone-bg opacity-20" />
        <div className="relative mx-auto max-w-[1600px] px-4 md:px-8 py-12 md:py-28">
          <p className="font-jp text-vermillion-400 text-2xl mb-3">コミック</p>
          <h1 className="display-headline text-5xl sm:text-6xl md:text-9xl text-cream leading-[0.85] mb-4">
            COMICS
          </h1>
          <p className="max-w-xl text-cream/80 text-lg">
            Western comics, graphic novels, and the canon. From Watchmen to Saga,
            from Persepolis to Akira — the books that defined the medium.
          </p>
        </div>

        {/* Speed-line side rail */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden md:block speed-lines opacity-20" />
      </header>

      {/* Curated canon */}
      <section className="mx-auto max-w-[1600px] px-4 md:px-8 mt-16">
        <div className="mb-6 flex items-baseline gap-3">
          <span className="font-jp text-2xl text-vermillion-600 leading-none">名作</span>
          <div>
            <h2 className="display-headline text-3xl md:text-5xl text-ink-900 leading-none">
              The Canon
            </h2>
            <p className="mt-1 text-xs uppercase tracking-widest text-ink-700">
              Hand-picked masterworks of the medium
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {curated.map((m, i) => (
            <CoverCard key={m.id} media={m} rank={i + 1} />
          ))}
        </div>
      </section>

      {/* Latest releases (Comic Vine when key present, otherwise duplicates curated) */}
      {process.env.COMICVINE_API_KEY && recent.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-4 md:px-8 mt-20">
          <div className="mb-6 flex items-baseline gap-3">
            <span className="font-jp text-2xl text-vermillion-600 leading-none">新刊</span>
            <div>
              <h2 className="display-headline text-3xl md:text-5xl text-ink-900 leading-none">
                New Issues
              </h2>
              <p className="mt-1 text-xs uppercase tracking-widest text-ink-700">
                Latest from Comic Vine
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {recent.map((m) => (
              <CoverCard key={m.id} media={m} />
            ))}
          </div>
        </section>
      )}

      {/* Manga-leaning action picks */}
      {classics.length > 0 && (
        <section className="mx-auto max-w-[1600px] px-4 md:px-8 mt-20">
          <div className="mb-6 flex items-baseline gap-3">
            <span className="font-jp text-2xl text-vermillion-600 leading-none">関連</span>
            <div>
              <h2 className="display-headline text-3xl md:text-5xl text-ink-900 leading-none">
                If You Love Comics
              </h2>
              <p className="mt-1 text-xs uppercase tracking-widest text-ink-700">
                Action-driven manga that hits the same beats
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {classics.map((m) => (
              <CoverCard key={m.id} media={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
