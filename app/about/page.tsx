import Link from "next/link";
import type { Metadata } from "next";
import {
  Github,
  Facebook,
  Code2,
  Heart,
  BookOpen,
  Layers,
  Library,
  Zap,
  WifiOff,
  Lock,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Mangaverse",
  description:
    "About Mangaverse — a premium reading platform for manhwa, manga, comics, and novels. Built by Get-shitdone.",
};

const FEATURES = [
  { icon: BookOpen, title: "Multi-source aggregator", body: "MangaDex, MangaPlus, Mangakakalot, MangaPill, MangaPark, MangaReader, MangaHere — switch sources per title." },
  { icon: Layers, title: "Manhwa, manga, comics & novels", body: "AniList & Jikan power discovery. Project Gutenberg streams public-domain novels. Comic Vine seeds the canon." },
  { icon: WifiOff, title: "Offline reading", body: "A service worker caches chapters as you read. Re-open them with no signal, no buffering." },
  { icon: Zap, title: "Edge-cached & fast", body: "Vercel edge serves chapter images for 1 year (immutable) — covers stale-while-revalidate for 30 days." },
  { icon: Library, title: "Library, ratings, progress", body: "Five status buckets, star ratings, progress tracking, JSON export. All local — no account, no tracking." },
  { icon: Lock, title: "Defensive by default", body: "SSRF guards, per-IP rate limits, sanitised inputs, strict transport security, content-type lockdown." },
];

export default function AboutPage() {
  return (
    <div className="bg-cream pb-20">
      {/* Hero */}
      <header className="relative border-b-2 border-ink-900 bg-ink-900 text-cream overflow-hidden">
        <div className="absolute inset-0 halftone-bg opacity-25" />
        <div className="absolute right-4 top-4 hidden md:block writing-vertical font-jp text-[140px] font-black leading-none text-cream/5">
          漫画宇宙
        </div>

        <div className="relative mx-auto max-w-[1600px] px-4 md:px-8 py-12 md:py-28">
          <p className="font-jp text-vermillion-400 text-2xl mb-3">概要</p>
          <h1 className="display-headline text-5xl sm:text-6xl md:text-9xl text-cream leading-[0.85] mb-4">
            ABOUT
          </h1>
          <p className="max-w-xl text-cream/80 text-base md:text-lg leading-relaxed">
            Mangaverse is a free, ad-free reader that pulls together manhwa,
            manga, comics, and novels from open metadata and chapter sources.
            One library, every format, no account required.
          </p>
        </div>
      </header>

      {/* What it does */}
      <section className="mx-auto max-w-[1200px] px-4 md:px-8 mt-12 md:mt-16">
        <div className="mb-6 flex items-baseline gap-3">
          <span className="font-jp text-xl md:text-2xl text-vermillion-600 leading-none">機能</span>
          <h2 className="display-headline text-3xl md:text-5xl text-ink-900 leading-none">
            What&apos;s inside
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="panel-border bg-cream p-5 relative overflow-hidden">
                <div className="halftone-bg absolute inset-0 opacity-20 pointer-events-none" />
                <div className="relative">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center border-2 border-ink-900 bg-vermillion-600 text-cream">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="display-headline text-xl text-ink-900 mb-1.5">
                    {f.title}
                  </h3>
                  <p className="text-sm text-ink-700 leading-relaxed">{f.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Developer */}
      <section className="mx-auto max-w-[1200px] px-4 md:px-8 mt-16">
        <div className="panel-border-lg bg-cream-100 relative overflow-hidden">
          <div className="halftone-bg absolute inset-0 opacity-30 pointer-events-none" />
          <div className="relative grid md:grid-cols-[200px_1fr] gap-6 md:gap-10 p-6 md:p-10">
            {/* Avatar tile */}
            <div className="flex md:justify-start">
              <div className="relative h-[140px] w-[140px] md:h-[180px] md:w-[180px] panel-border-lg bg-vermillion-600 flex items-center justify-center overflow-hidden">
                <div className="halftone-bg absolute inset-0 opacity-30" />
                <span className="display-headline text-7xl md:text-8xl text-cream relative leading-none">
                  G
                </span>
                <span className="absolute bottom-2 right-2 font-jp text-vermillion-100 text-xs">
                  作者
                </span>
              </div>
            </div>

            <div className="min-w-0">
              <p className="font-jp text-vermillion-600 text-sm md:text-base mb-2">
                開発者
              </p>
              <h2 className="display-headline text-3xl md:text-5xl text-ink-900 leading-none mb-3">
                Get-shitdone
              </h2>
              <p className="text-ink-700 text-sm md:text-base leading-relaxed mb-5 max-w-xl">
                Designed and built solo. Mangaverse is open source under MIT —
                read the code, fork it, send pull requests. If something feels
                off, file an issue.
              </p>

              <div className="flex flex-wrap gap-3">
                <a
                  href="https://www.facebook.com/isDevGit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-vermillion text-xs"
                >
                  <Facebook className="h-4 w-4" /> Facebook
                </a>
                <a
                  href="https://github.com/Get-shitdone"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost text-xs"
                >
                  <Github className="h-4 w-4" /> GitHub
                </a>
                <a
                  href="https://github.com/Get-shitdone/mangaverse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost text-xs"
                >
                  <Code2 className="h-4 w-4" /> View source
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stack & credits */}
      <section className="mx-auto max-w-[1200px] px-4 md:px-8 mt-16 grid md:grid-cols-2 gap-5">
        <div className="panel-border bg-cream p-6 md:p-8">
          <p className="font-jp text-vermillion-600 text-sm mb-1">技術</p>
          <h3 className="display-headline text-2xl md:text-3xl text-ink-900 mb-4">
            Stack
          </h3>
          <ul className="space-y-1.5 text-sm text-ink-700">
            <li>· Next.js 14 · App Router · TypeScript</li>
            <li>· Tailwind CSS · Zustand · @vercel/og</li>
            <li>· Vercel hosting · edge image cache · service worker</li>
            <li>· PWA manifest · iOS / Android installable</li>
          </ul>
        </div>

        <div className="panel-border bg-cream p-6 md:p-8">
          <p className="font-jp text-vermillion-600 text-sm mb-1">出典</p>
          <h3 className="display-headline text-2xl md:text-3xl text-ink-900 mb-4">
            Credits
          </h3>
          <ul className="space-y-1.5 text-sm text-ink-700">
            <li>· Metadata: AniList · MyAnimeList (Jikan) · Open Library</li>
            <li>· Chapters: MangaDex · MangaPlus (official) · Consumet</li>
            <li>· Novels: Project Gutenberg · Google Books</li>
            <li>· Comics: Comic Vine</li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1200px] px-4 md:px-8 mt-16">
        <div className="panel-border-lg bg-vermillion-600 text-cream p-8 md:p-12 relative overflow-hidden text-center">
          <div className="halftone-bg-dark absolute inset-0 opacity-20" />
          <div className="relative">
            <Heart className="h-7 w-7 mx-auto mb-3" />
            <h3 className="display-headline text-3xl md:text-5xl mb-3">
              Made with ink &amp; pixels
            </h3>
            <p className="max-w-xl mx-auto mb-5 text-sm md:text-base text-cream/90">
              Mangaverse is free forever and ad-free forever. If it&apos;s useful
              to you, share it with someone else who reads.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/read-now" className="btn-ghost border-cream bg-cream text-ink-900 text-xs">
                <Sparkles className="h-4 w-4" /> Start reading
              </Link>
              <Link href="/library" className="btn-ghost border-cream bg-transparent text-cream hover:bg-cream hover:text-ink-900 text-xs">
                <Library className="h-4 w-4" /> Open library
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
