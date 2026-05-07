import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getById } from "@/lib/api/anilist";
import { findFirstMangaForTitle, getChapters, coverUrl } from "@/lib/api/mangadex";
import { stripHtml, TYPE_LABEL, TYPE_KANJI, formatNumber } from "@/lib/utils";
import { CoverCard } from "@/components/CoverCard";
import { LibraryButton } from "@/components/LibraryButton";
import { ChapterList } from "@/components/ChapterList";
import { Star, Calendar, Globe, Bookmark, Users } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 3600;

async function loadDetail(idParam: string) {
  const id = decodeURIComponent(idParam);
  const [source, rawId] = id.split(":");

  if (source === "anilist") {
    const media = await getById(parseInt(rawId, 10));
    return { media, source };
  }
  if (source === "curated" || source === "comicvine") {
    const { getCuratedComics } = await import("@/lib/api/comicvine");
    const comics = await getCuratedComics();
    const media = comics.find((c) => c.id === id);
    if (!media) return null;
    return { media, source };
  }
  return null;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const r = await loadDetail(params.id);
    if (!r) return {};
    const title = r.media.title.english ?? r.media.title.romaji ?? r.media.title.display;
    const description = stripHtml(r.media.description ?? "").slice(0, 200);
    const cover = r.media.coverImage.large ?? r.media.coverImage.medium ?? "";
    const accent = r.media.coverImage.color ?? "#c1272d";
    const score = r.media.score != null ? (r.media.score / 10).toFixed(1) : "";
    const ogUrl = `/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(description.slice(0, 100))}&cover=${encodeURIComponent(cover)}&accent=${encodeURIComponent(accent)}&type=${encodeURIComponent(TYPE_LABEL[r.media.type] ?? "Manga")}${score ? `&score=${score}` : ""}`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogUrl],
      },
    };
  } catch {
    return {};
  }
}

export default async function TitlePage({ params }: { params: { id: string } }) {
  const r = await loadDetail(params.id);
  if (!r) return notFound();
  const m = r.media;
  const accent = m.coverImage.color ?? "#c1272d";

  // Try to find this title on MangaDex for actual chapters
  let mangadexId: string | null = null;
  let chapters: Awaited<ReturnType<typeof getChapters>>["chapters"] = [];
  let mdCoverFallback: string | null = null;

  if (m.type !== "novel" && m.type !== "light_novel" && m.type !== "comic") {
    try {
      const md = await findFirstMangaForTitle(m.title.english ?? m.title.romaji ?? m.title.display);
      if (md) {
        mangadexId = md.id;
        if (md.coverFileName) mdCoverFallback = coverUrl(md.id, md.coverFileName, 512);
        const list = await getChapters(md.id, "en", 200);
        chapters = list.chapters;
      }
    } catch {
      // ignore — graceful fallback to "external" view
    }
  }

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": m.type === "comic" ? "ComicSeries" : "Book",
    name: m.title.english ?? m.title.display,
    alternateName: [m.title.romaji, m.title.native].filter(Boolean),
    description: stripHtml(m.description ?? "").slice(0, 500),
    image: m.coverImage.large,
    genre: m.genres,
    inLanguage: m.countryOfOrigin === "JP" ? "ja" : m.countryOfOrigin === "KR" ? "ko" : m.countryOfOrigin === "CN" ? "zh" : "en",
    aggregateRating:
      m.score != null
        ? {
            "@type": "AggregateRating",
            ratingValue: (m.score / 10).toFixed(1),
            bestRating: 10,
            worstRating: 0,
            ratingCount: m.popularity ?? 1000,
          }
        : undefined,
    datePublished: m.startDate,
    numberOfEpisodes: m.chapters,
  };

  return (
    <article className="bg-cream">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero */}
      <div
        className="relative overflow-hidden border-b-2 border-ink-900 bg-ink-900"
        style={{ backgroundColor: accent + "30" }}
      >
        <div className="relative h-[420px] md:h-[480px]">
          {m.bannerImage && (
            <Image
              src={m.bannerImage}
              alt=""
              fill
              priority
              unoptimized
              className="object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/80 to-ink-900/30" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-cream to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto max-w-[1600px] px-4 md:px-8 pb-10">
            <div className="grid items-end gap-8 md:grid-cols-[260px_1fr] md:gap-10">
              {/* Cover */}
              {(m.coverImage.large || mdCoverFallback) && (
                <div className="relative -mb-16 md:-mb-24 aspect-[2/3] w-[180px] md:w-[260px] shrink-0 overflow-hidden border-[3px] border-ink-900 bg-ink-900 shadow-panel-lg">
                  <Image
                    src={m.coverImage.large ?? mdCoverFallback!}
                    alt={m.title.display}
                    fill
                    priority
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}

              {/* Title block */}
              <div className="text-cream md:pb-2">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="ink-stamp-vermillion border-vermillion-400 bg-vermillion-600 text-cream">
                    {TYPE_LABEL[m.type] ?? "Manga"}
                  </span>
                  {m.status && (
                    <span className="ink-stamp border-cream/30 bg-cream/10 text-cream/90 capitalize">
                      {m.status}
                    </span>
                  )}
                  {m.year && (
                    <span className="text-xs uppercase tracking-widest text-cream/70">
                      {m.year}
                    </span>
                  )}
                </div>

                <h1 className="display-headline text-4xl md:text-6xl lg:text-7xl text-cream leading-[0.9] mb-2 text-balance">
                  {m.title.english ?? m.title.romaji ?? m.title.display}
                </h1>
                {m.title.native && (
                  <p className="font-jp text-xl text-vermillion-400 mb-1">
                    {m.title.native}
                  </p>
                )}
                {m.title.romaji && m.title.romaji !== m.title.english && (
                  <p className="text-sm italic text-cream/70 mb-3">{m.title.romaji}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail body */}
      <div className="mx-auto max-w-[1600px] px-4 md:px-8 pt-24 md:pt-32">
        <div className="grid gap-12 md:grid-cols-[260px_1fr] md:gap-10">
          <aside className="space-y-6">
            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              {chapters.length > 0 && mangadexId && (
                <Link
                  href={`/read/${encodeURIComponent(m.id)}/${chapters[0].id}?md=${mangadexId}`}
                  className="btn-vermillion w-full"
                >
                  <Bookmark className="h-4 w-4" /> Start Reading
                </Link>
              )}
              {(m.type === "novel" || m.type === "light_novel") && (
                <Link
                  href={`/read-novel/${encodeURIComponent(m.id)}`}
                  className="btn-vermillion w-full"
                >
                  <Bookmark className="h-4 w-4" /> Open Novel Reader
                </Link>
              )}
              <LibraryButton media={m} mangadexId={mangadexId} />
            </div>

            {/* Stats */}
            <div className="panel-border bg-cream p-5 space-y-4">
              <h3 className="display-headline text-2xl text-ink-900 border-b-2 border-ink-900 pb-2">
                Stats
              </h3>
              <Stat
                icon={<Star className="h-4 w-4 text-vermillion-600" />}
                label="Score"
                value={m.score != null ? `${(m.score / 10).toFixed(1)} / 10` : "—"}
              />
              <Stat
                icon={<Users className="h-4 w-4 text-vermillion-600" />}
                label="Popularity"
                value={m.popularity != null ? formatNumber(m.popularity) : "—"}
              />
              <Stat
                icon={<Calendar className="h-4 w-4 text-vermillion-600" />}
                label="Year"
                value={m.year != null ? String(m.year) : "—"}
              />
              <Stat
                icon={<Globe className="h-4 w-4 text-vermillion-600" />}
                label="Origin"
                value={m.countryOfOrigin ?? "—"}
              />
              {m.chapters != null && (
                <Stat label="Chapters" value={String(m.chapters)} />
              )}
              {m.volumes != null && (
                <Stat label="Volumes" value={String(m.volumes)} />
              )}
            </div>

            {/* Genres */}
            {m.genres.length > 0 && (
              <div className="panel-border bg-cream p-5">
                <h3 className="display-headline text-2xl text-ink-900 border-b-2 border-ink-900 pb-2 mb-3">
                  Genres
                </h3>
                <div className="flex flex-wrap gap-2">
                  {m.genres.map((g) => (
                    <Link
                      key={g}
                      href={`/genre/${encodeURIComponent(g)}`}
                      className="ink-stamp hover:bg-vermillion-600 hover:text-cream hover:border-vermillion-600"
                    >
                      {g}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main column */}
          <div className="space-y-12 min-w-0">
            <section>
              <h2 className="display-headline text-3xl md:text-4xl text-ink-900 mb-4 flex items-baseline gap-3">
                Synopsis
                <span className="font-jp text-base text-vermillion-600">あらすじ</span>
              </h2>
              <p className="text-pretty text-base leading-relaxed text-ink-800 whitespace-pre-line">
                {stripHtml(m.description ?? "No synopsis available.")}
              </p>

              {m.tags && m.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {m.tags.slice(0, 18).map((t) => (
                    <span key={t} className="ink-stamp bg-cream-100">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Characters */}
            {m.characters && m.characters.length > 0 && (
              <section>
                <h2 className="display-headline text-3xl md:text-4xl text-ink-900 mb-5 flex items-baseline gap-3">
                  Characters
                  <span className="font-jp text-base text-vermillion-600">登場人物</span>
                </h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {m.characters.slice(0, 8).map((c, i) => (
                    <div key={i} className="panel-border-sm overflow-hidden bg-cream">
                      <div className="relative aspect-[3/4] bg-ink-100">
                        {c.image && (
                          <Image
                            src={c.image}
                            alt={c.name}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        )}
                      </div>
                      <p className="px-3 py-2 text-sm font-bold border-t-2 border-ink-900 text-ink-900 line-clamp-1">
                        {c.name}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Chapters */}
            {chapters.length > 0 && mangadexId && (
              <section id="chapters">
                <ChapterList
                  chapters={chapters}
                  mediaId={m.id}
                  mangadexId={mangadexId}
                />
              </section>
            )}

            {chapters.length === 0 && mangadexId === null && m.type !== "novel" && m.type !== "light_novel" && (
              <section className="panel-border bg-cream-100 p-6">
                <h3 className="display-headline text-2xl text-ink-900 mb-2">
                  Chapters Not Available Here
                </h3>
                <p className="text-sm text-ink-700 mb-3">
                  We couldn&apos;t find this title on our reader source. You can read
                  it on official sources:
                </p>
                <a
                  href={`https://anilist.co/manga/${m.id.split(":")[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                >
                  View on AniList
                </a>
              </section>
            )}

            {(m.type === "novel" || m.type === "light_novel") && (
              <section className="panel-border bg-cream-100 p-6">
                <h3 className="display-headline text-2xl text-ink-900 mb-2">
                  Read this Novel
                </h3>
                <p className="text-sm text-ink-700 mb-4">
                  Open the novel reader. We&apos;ll surface full text from
                  Project Gutenberg when available, otherwise a publisher
                  preview with link-out for purchase.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/read-novel/${encodeURIComponent(m.id)}`}
                    className="btn-vermillion"
                  >
                    Open Reader
                  </Link>
                  <a
                    href={`https://anilist.co/manga/${m.id.split(":")[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                  >
                    View on AniList
                  </a>
                </div>
              </section>
            )}

            {/* Recommendations */}
            {m.recommendations && m.recommendations.length > 0 && (
              <section>
                <h2 className="display-headline text-3xl md:text-4xl text-ink-900 mb-5 flex items-baseline gap-3">
                  You Might Also Like
                  <span className="font-jp text-base text-vermillion-600">おすすめ</span>
                </h2>
                <div className="scrollbar-none flex gap-5 overflow-x-auto pb-4">
                  {m.recommendations.map((rec) => (
                    <div key={rec.id} className="snap-start">
                      <CoverCard media={rec} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-ink-700 uppercase tracking-widest text-xs">
        {icon}
        {label}
      </span>
      <span className="font-bold text-ink-900">{value}</span>
    </div>
  );
}
