"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { MediaItem } from "@/lib/types";
import { stripHtml, truncate, TYPE_LABEL, TYPE_KANJI } from "@/lib/utils";
import { ChevronLeft, ChevronRight, BookOpen, Plus, Star } from "lucide-react";

export function Hero({ items }: { items: MediaItem[] }) {
  const [idx, setIdx] = useState(0);
  const featured = items.slice(0, 5);

  useEffect(() => {
    if (featured.length === 0) return;
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % featured.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, [featured.length]);

  if (!featured.length) return null;

  const current = featured[idx];
  const accent = current.coverImage.color ?? "#c1272d";

  return (
    <section className="relative w-full overflow-hidden border-b-2 border-ink-900 bg-ink-900">
      <div
        className="relative h-[68vh] min-h-[520px] w-full"
        style={{ backgroundColor: accent + "20" }}
      >
        {/* Banner */}
        {current.bannerImage ? (
          <Image
            src={current.bannerImage}
            alt=""
            fill
            priority
            unoptimized
            className="object-cover opacity-50"
          />
        ) : current.coverImage.large ? (
          <Image
            src={current.coverImage.large}
            alt=""
            fill
            priority
            unoptimized
            className="object-cover opacity-30 blur-2xl"
          />
        ) : null}

        {/* Halftone overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(245,241,232,0.08)_1px,transparent_1px)] bg-[length:6px_6px]" />
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/85 to-ink-900/30" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-900 to-transparent" />

        {/* Vertical kanji watermark */}
        <div className="pointer-events-none absolute right-8 top-12 hidden md:block">
          <p className="writing-vertical font-jp text-[140px] font-black leading-none text-cream/8">
            {TYPE_KANJI[current.type] ?? "漫画"}
          </p>
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto flex h-full max-w-[1600px] items-center px-4 md:px-8">
          <div className="grid w-full gap-8 md:grid-cols-[260px_1fr] md:gap-12">
            {/* Cover */}
            {current.coverImage.large && (
              <Link
                href={`/title/${encodeURIComponent(current.id)}`}
                className="hidden md:block group relative aspect-[2/3] w-[260px] shrink-0 overflow-hidden border-[3px] border-cream shadow-[6px_6px_0_0_rgba(193,39,45,1)] transition-transform hover:translate-x-[-3px] hover:translate-y-[-3px]"
              >
                <Image
                  src={current.coverImage.large}
                  alt={current.title.display}
                  fill
                  priority
                  unoptimized
                  className="object-cover"
                />
              </Link>
            )}

            {/* Text */}
            <div className="max-w-2xl text-cream animate-fade-up">
              <div className="mb-4 flex items-center gap-3">
                <span className="ink-stamp-vermillion border-vermillion-400 bg-vermillion-600 text-cream">
                  Featured #{idx + 1}
                </span>
                <span className="ink-stamp border-cream/30 bg-cream/10 text-cream/90">
                  {TYPE_LABEL[current.type] ?? "Manga"}
                </span>
                {current.score != null && (
                  <span className="flex items-center gap-1 text-xs">
                    <Star className="h-3 w-3 fill-gold text-gold" />
                    {(current.score / 10).toFixed(1)}
                  </span>
                )}
                {current.year && (
                  <span className="text-xs uppercase tracking-widest text-cream/60">
                    {current.year}
                  </span>
                )}
              </div>

              <h1 className="display-headline text-5xl md:text-7xl lg:text-8xl text-cream leading-[0.85] mb-3 text-balance">
                {current.title.english ?? current.title.romaji ?? current.title.display}
              </h1>
              {current.title.native && (
                <p className="font-jp text-xl text-vermillion-400 mb-5">
                  {current.title.native}
                </p>
              )}

              <p className="mb-6 max-w-xl text-base leading-relaxed text-cream/80">
                {truncate(stripHtml(current.description ?? ""), 240)}
              </p>

              <div className="mb-7 flex flex-wrap gap-2">
                {(current.genres ?? []).slice(0, 5).map((g) => (
                  <span
                    key={g}
                    className="ink-stamp border-cream/30 bg-cream/5 text-cream/80"
                  >
                    {g}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/title/${encodeURIComponent(current.id)}`}
                  className="btn-vermillion border-vermillion-600"
                >
                  <BookOpen className="h-4 w-4" /> Start Reading
                </Link>
                <Link
                  href={`/title/${encodeURIComponent(current.id)}`}
                  className="btn-ink border-cream bg-transparent text-cream hover:bg-cream hover:text-ink-900"
                >
                  <Plus className="h-4 w-4" /> More Info
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={() => setIdx((i) => (i - 1 + featured.length) % featured.length)}
          aria-label="Previous"
          className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 h-12 w-12 items-center justify-center border-2 border-cream bg-ink-900/40 text-cream backdrop-blur-sm transition-all hover:bg-cream hover:text-ink-900 md:flex"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>
        <button
          onClick={() => setIdx((i) => (i + 1) % featured.length)}
          aria-label="Next"
          className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 h-12 w-12 items-center justify-center border-2 border-cream bg-ink-900/40 text-cream backdrop-blur-sm transition-all hover:bg-cream hover:text-ink-900 md:flex"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
        </button>

        {/* Pagination */}
        <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {featured.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 transition-all ${
                i === idx ? "w-12 bg-vermillion-500" : "w-6 bg-cream/40"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
