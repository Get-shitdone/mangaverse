import { topByGenre, browse, ALL_GENRES } from "@/lib/api/anilist";
import { CoverCard } from "@/components/CoverCard";
import { SectionRow } from "@/components/SectionRow";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 3600;

const KANJI: Record<string, string> = {
  Action: "アクション",
  Adventure: "冒険",
  Comedy: "コメディ",
  Drama: "ドラマ",
  Fantasy: "ファンタジー",
  Horror: "ホラー",
  Mystery: "ミステリー",
  Romance: "恋愛",
  "Sci-Fi": "SF",
  "Slice of Life": "日常",
  Sports: "スポーツ",
  Supernatural: "超自然",
  Thriller: "スリラー",
  Psychological: "心理",
  Mecha: "メカ",
};

const RELATED: Record<string, string[]> = {
  Action: ["Adventure", "Sci-Fi", "Supernatural"],
  Adventure: ["Action", "Fantasy", "Comedy"],
  Romance: ["Drama", "Slice of Life", "Comedy"],
  Comedy: ["Slice of Life", "Romance", "Action"],
  Drama: ["Romance", "Psychological", "Slice of Life"],
  Fantasy: ["Adventure", "Action", "Supernatural"],
  Horror: ["Thriller", "Psychological", "Mystery"],
  Mystery: ["Thriller", "Horror", "Psychological"],
  "Sci-Fi": ["Action", "Mecha", "Adventure"],
  "Slice of Life": ["Romance", "Comedy", "Drama"],
  Sports: ["Drama", "Comedy", "Action"],
  Supernatural: ["Fantasy", "Horror", "Action"],
  Thriller: ["Mystery", "Horror", "Psychological"],
  Psychological: ["Thriller", "Drama", "Mystery"],
  Mecha: ["Sci-Fi", "Action", "Adventure"],
};

export async function generateMetadata({ params }: { params: { name: string } }): Promise<Metadata> {
  const name = decodeURIComponent(params.name);
  return {
    title: `${name} Manhwa, Manga, Comics & Novels`,
    description: `The best ${name.toLowerCase()} titles across manhwa, manga, comics and novels — handpicked and trending now.`,
  };
}

export default async function GenrePage({ params }: { params: { name: string } }) {
  const name = decodeURIComponent(params.name);
  const knownGenre = ALL_GENRES.find((g) => g.toLowerCase() === name.toLowerCase());
  if (!knownGenre) return notFound();

  const [topInGenre, freshInGenre, manhwaInGenre, novelsInGenre] = await Promise.all([
    topByGenre(knownGenre, 24).catch(() => []),
    browse({ genre_in: [knownGenre], sort: ["START_DATE_DESC"], perPage: 18 }).then((r) => r.results).catch(() => []),
    browse({ genre_in: [knownGenre], countryOfOrigin: "KR", sort: ["POPULARITY_DESC"], perPage: 18 }).then((r) => r.results).catch(() => []),
    browse({ genre_in: [knownGenre], format_in: ["NOVEL", "LIGHT_NOVEL"], sort: ["POPULARITY_DESC"], perPage: 18 }).then((r) => r.results).catch(() => []),
  ]);

  const related = RELATED[knownGenre] ?? [];
  const kanji = KANJI[knownGenre] ?? "ジャンル";

  return (
    <div className="bg-cream pb-20">
      {/* Hero */}
      <header className="relative border-b-2 border-ink-900 bg-ink-900 text-cream overflow-hidden">
        <div className="absolute inset-0 halftone-bg opacity-20" />
        {topInGenre[0]?.bannerImage && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${topInGenre[0].bannerImage})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/80 to-transparent" />

        <div className="relative mx-auto max-w-[1600px] px-4 md:px-8 py-12 md:py-28">
          <p className="font-jp text-vermillion-400 text-2xl mb-3">{kanji}</p>
          <h1 className="display-headline text-5xl sm:text-6xl md:text-9xl text-cream leading-[0.85] mb-4">
            {knownGenre}
          </h1>
          <p className="max-w-xl text-cream/80 text-lg mb-6">
            The best {knownGenre.toLowerCase()} titles across manhwa, manga, comics
            and novels — sorted by what readers can&apos;t put down.
          </p>

          {related.length > 0 && (
            <div className="flex flex-wrap gap-2 max-w-2xl">
              <span className="text-xs uppercase tracking-widest text-cream/60 mr-2 self-center">
                Related:
              </span>
              {related.map((r) => (
                <Link
                  key={r}
                  href={`/genre/${encodeURIComponent(r)}`}
                  className="ink-stamp border-cream/30 bg-cream/5 text-cream hover:bg-cream hover:text-ink-900"
                >
                  {r}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Speed-line side rail */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden md:block speed-lines opacity-15" />
      </header>

      {/* Top */}
      <section className="mx-auto max-w-[1600px] px-4 md:px-8 mt-16">
        <div className="mb-6 flex items-baseline gap-3">
          <span className="font-jp text-2xl text-vermillion-600 leading-none">人気</span>
          <h2 className="display-headline text-3xl md:text-5xl text-ink-900 leading-none">
            Top {knownGenre}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {topInGenre.map((m, i) => (
            <CoverCard key={m.id} media={m} rank={i + 1} />
          ))}
        </div>
      </section>

      {manhwaInGenre.length > 0 && (
        <SectionRow
          title={`${knownGenre} Manhwa`}
          subtitle={`Korean comics in ${knownGenre.toLowerCase()}`}
          kanji="만화"
        >
          {manhwaInGenre.map((m) => (
            <div key={m.id} className="snap-start">
              <CoverCard media={m} />
            </div>
          ))}
        </SectionRow>
      )}

      {freshInGenre.length > 0 && (
        <SectionRow
          title={`Fresh ${knownGenre}`}
          subtitle="Just released"
          kanji="新刊"
        >
          {freshInGenre.map((m) => (
            <div key={m.id} className="snap-start">
              <CoverCard media={m} />
            </div>
          ))}
        </SectionRow>
      )}

      {novelsInGenre.length > 0 && (
        <SectionRow
          title={`${knownGenre} Novels`}
          subtitle="Long-form storytelling"
          kanji="小説"
        >
          {novelsInGenre.map((m) => (
            <div key={m.id} className="snap-start">
              <CoverCard media={m} />
            </div>
          ))}
        </SectionRow>
      )}
    </div>
  );
}
