import {
  trendingManga,
  topManhwa,
  topManhua,
  topRated,
  newReleases,
  topNovels,
  topByGenre,
} from "@/lib/api/anilist";
import { listMangaDex } from "@/lib/api/mangadex";
import { getCuratedComics } from "@/lib/api/comicvine";
import { Hero } from "@/components/Hero";
import { SectionRow } from "@/components/SectionRow";
import { CoverCard } from "@/components/CoverCard";
import { ContinueReadingRow } from "@/components/ContinueReadingRow";
import { PersonalizedRows } from "@/components/PersonalizedRows";
import Link from "next/link";
import { ChevronRight, Flame, Award, Sparkles, BookOpen } from "lucide-react";

export const revalidate = 1800; // 30m ISR

export default async function HomePage() {
  // Run all featured queries in parallel.
  // Note: AniList provides metadata but many titles aren't on MangaDex due to
  // licensing — those return empty chapter lists. To guarantee readability, we
  // also pull listings DIRECTLY from MangaDex (mdLatest / mdPopular) so the
  // "Read Now" row is always immediately readable.
  const [
    trending,
    manhwa,
    manhua,
    top,
    fresh,
    novels,
    romance,
    action,
    comics,
    mdLatest,
    mdPopular,
  ] = await Promise.all([
    trendingManga(20).catch(() => []),
    topManhwa(18).catch(() => []),
    topManhua(18).catch(() => []),
    topRated(18).catch(() => []),
    newReleases(18).catch(() => []),
    topNovels(18).catch(() => []),
    topByGenre("Romance", 18).catch(() => []),
    topByGenre("Action", 18).catch(() => []),
    getCuratedComics().catch(() => []),
    listMangaDex("latestUploadedChapter", 24).catch(() => []),
    listMangaDex("followedCount", 24).catch(() => []),
  ]);

  return (
    <>
      <Hero items={trending} />

      <ContinueReadingRow />

      <PersonalizedRows />

      {/* Read Now — direct from MangaDex (always readable) */}
      <SectionRow
        title="Read Now"
        subtitle="Just-updated chapters · click to start reading"
        kanji="今すぐ読む"
        rightLabel={
          <span className="hidden md:inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-vermillion-600">
            <BookOpen className="h-3 w-3" /> Live from MangaDex
          </span>
        }
      >
        {mdLatest.map((m) => (
          <div key={m.id} className="snap-start">
            <CoverCard media={m} />
          </div>
        ))}
      </SectionRow>

      <SectionRow
        title="Most Followed"
        subtitle="The titles readers are obsessed with"
        kanji="人気作"
      >
        {mdPopular.map((m, i) => (
          <div key={m.id} className="snap-start">
            <CoverCard media={m} rank={i + 1} />
          </div>
        ))}
      </SectionRow>

      {/* Editorial value props */}
      <section className="border-b-2 border-ink-900 bg-ink-900 text-cream overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap py-4">
          {Array(2).fill(0).map((_, i) => (
            <div key={i} className="flex shrink-0 items-center gap-12 px-12">
              <span className="display-headline text-3xl">FREE TO READ</span>
              <span className="text-vermillion-400 font-jp text-xl">★</span>
              <span className="display-headline text-3xl">NO ADS, NO SIGN-UP</span>
              <span className="text-vermillion-400 font-jp text-xl">★</span>
              <span className="display-headline text-3xl">100K+ TITLES</span>
              <span className="text-vermillion-400 font-jp text-xl">★</span>
              <span className="display-headline text-3xl">MANHWA · MANGA · COMICS · NOVELS</span>
              <span className="text-vermillion-400 font-jp text-xl">★</span>
              <span className="display-headline text-3xl">UPDATED DAILY</span>
              <span className="text-vermillion-400 font-jp text-xl">★</span>
            </div>
          ))}
        </div>
      </section>

      <SectionRow
        title="Trending Now"
        subtitle="What everyone is reading this week"
        kanji="人気"
        rightLabel={
          <Link
            href="/browse?sort=TRENDING_DESC"
            className="hidden md:inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-ink-700 hover:text-vermillion-600"
          >
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        }
      >
        {trending.map((m, i) => (
          <div key={m.id} className="snap-start">
            <CoverCard media={m} rank={i + 1} />
          </div>
        ))}
      </SectionRow>

      <SectionRow
        title="Top Manhwa"
        subtitle="Korean comics worth your time"
        kanji="만화"
        rightLabel={
          <Link
            href="/browse?country=KR"
            className="hidden md:inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-ink-700 hover:text-vermillion-600"
          >
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        }
      >
        {manhwa.map((m) => (
          <div key={m.id} className="snap-start">
            <CoverCard media={m} />
          </div>
        ))}
      </SectionRow>

      {/* Editorial split feature */}
      <section className="my-20">
        <div className="mx-auto max-w-[1600px] px-4 md:px-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="panel-border bg-vermillion-600 p-8 md:p-12 text-cream">
              <div className="mb-6 flex items-center gap-3">
                <Flame className="h-6 w-6" />
                <span className="text-xs font-bold uppercase tracking-widest">Editor&apos;s Pick</span>
              </div>
              <h3 className="display-headline text-4xl md:text-5xl mb-4">
                Action &amp; Adventure
              </h3>
              <p className="mb-6 max-w-md text-cream/90">
                Sword fights, ancient prophecies, and impossible quests. The most
                heart-pounding stories from every genre, every region.
              </p>
              <Link
                href="/browse?genre=Action"
                className="inline-flex items-center gap-2 border-2 border-cream bg-cream px-5 py-3 text-xs font-bold uppercase tracking-widest text-vermillion-600 hover:bg-vermillion-700 hover:text-cream"
              >
                Explore Action <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="panel-border bg-ink-900 p-8 md:p-12 text-cream">
              <div className="mb-6 flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-gold" />
                <span className="text-xs font-bold uppercase tracking-widest text-gold">Hidden Gems</span>
              </div>
              <h3 className="display-headline text-4xl md:text-5xl mb-4">
                Romance &amp; Drama
              </h3>
              <p className="mb-6 max-w-md text-cream/80">
                Quiet love stories, slow burns, and emotional rollercoasters that
                will stay with you long after the last page.
              </p>
              <Link
                href="/browse?genre=Romance"
                className="inline-flex items-center gap-2 border-2 border-cream bg-cream px-5 py-3 text-xs font-bold uppercase tracking-widest text-ink-900 hover:bg-gold hover:border-gold"
              >
                Explore Romance <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SectionRow
        title="Highest Rated"
        subtitle="Critic and reader favorites"
        kanji="名作"
        rightLabel={
          <Link
            href="/browse?sort=SCORE_DESC"
            className="hidden md:inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-ink-700 hover:text-vermillion-600"
          >
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        }
      >
        {top.map((m, i) => (
          <div key={m.id} className="snap-start">
            <CoverCard media={m} rank={i + 1} />
          </div>
        ))}
      </SectionRow>

      <SectionRow
        title="Top Manhua"
        subtitle="Chinese comics breaking through"
        kanji="漫画"
      >
        {manhua.map((m) => (
          <div key={m.id} className="snap-start">
            <CoverCard media={m} />
          </div>
        ))}
      </SectionRow>

      <SectionRow
        title="Action"
        subtitle="Fight scenes, power systems, epic arcs"
        kanji="アクション"
      >
        {action.map((m) => (
          <div key={m.id} className="snap-start">
            <CoverCard media={m} />
          </div>
        ))}
      </SectionRow>

      <SectionRow
        title="Romance"
        subtitle="Love stories that linger"
        kanji="恋愛"
      >
        {romance.map((m) => (
          <div key={m.id} className="snap-start">
            <CoverCard media={m} />
          </div>
        ))}
      </SectionRow>

      <SectionRow
        title="New Releases"
        subtitle="Just hit the shelves"
        kanji="新刊"
      >
        {fresh.map((m) => (
          <div key={m.id} className="snap-start">
            <CoverCard media={m} />
          </div>
        ))}
      </SectionRow>

      <SectionRow
        title="Novels &amp; Light Novels"
        subtitle="For when you crave the long form"
        kanji="小説"
      >
        {novels.map((m) => (
          <div key={m.id} className="snap-start">
            <CoverCard media={m} />
          </div>
        ))}
      </SectionRow>

      <SectionRow
        title="The Comic Canon"
        subtitle="Western comics &amp; graphic novels"
        kanji="コミック"
        rightLabel={
          <Link
            href="/comics"
            className="hidden md:inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-ink-700 hover:text-vermillion-600"
          >
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        }
      >
        {comics.map((m, i) => (
          <div key={m.id} className="snap-start">
            <CoverCard media={m} rank={i + 1} />
          </div>
        ))}
      </SectionRow>

      {/* Bottom CTA */}
      <section className="my-32">
        <div className="mx-auto max-w-[1600px] px-4 md:px-8">
          <div className="panel-border-lg relative overflow-hidden bg-cream-100 p-12 md:p-20 text-center">
            <div className="absolute inset-0 halftone-bg opacity-30" />
            <div className="relative">
              <p className="font-jp text-sm text-vermillion-600 mb-2 tracking-widest">
                あなたの図書館
              </p>
              <h2 className="display-headline text-5xl md:text-7xl text-ink-900 mb-4">
                Build Your Library
              </h2>
              <p className="mx-auto max-w-xl mb-8 text-ink-700 text-lg">
                Track what you&apos;re reading, save titles for later, rate the
                ones that move you. Your library lives in your browser — no
                account required.
              </p>
              <Link href="/library" className="btn-vermillion text-base">
                <Award className="h-4 w-4" /> Open My Library
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
