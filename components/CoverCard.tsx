"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { MediaItem } from "@/lib/types";
import { TYPE_LABEL, TYPE_KANJI, formatNumber, cn } from "@/lib/utils";
import { Star, EyeOff } from "lucide-react";
import { usePreferences } from "@/lib/store/preferences";
import { HoverBadge } from "./HoverBadge";

export function CoverCard({
  media,
  rank,
  size = "default",
}: {
  media: MediaItem;
  rank?: number;
  size?: "small" | "default" | "large";
}) {
  const [revealed, setRevealed] = useState(false);
  const nsfwEnabled = usePreferences((s) => s.nsfwEnabled);
  const showAdult = !media.isAdult || nsfwEnabled || revealed;

  const ratio = "aspect-[2/3]";
  const widthCls =
    size === "small"
      ? "w-[120px] sm:w-[140px]"
      : size === "large"
      ? "w-[180px] sm:w-[220px] md:w-[260px]"
      : "w-[140px] sm:w-[170px] md:w-[200px]";

  const cover = media.coverImage.large ?? media.coverImage.medium;
  const accent = media.coverImage.color ?? "#c1272d";

  return (
    <div
      className={cn(
        "group relative shrink-0",
        widthCls
      )}
    >
      <HoverBadge seed={media.id} />
      <Link
        href={`/title/${encodeURIComponent(media.id)}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-vermillion-600 focus-visible:ring-offset-2"
      >
        <div
          className={cn(
            "relative overflow-hidden border-2 border-ink-900 bg-ink-900 transition-all duration-300",
            ratio,
            "group-hover:translate-x-[-3px] group-hover:translate-y-[-3px] group-hover:shadow-panel"
          )}
          style={{ backgroundColor: accent + "30" }}
        >
          {cover && showAdult ? (
            <Image
              src={cover}
              alt={media.title.display}
              fill
              sizes="(max-width: 640px) 200px, 260px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
          ) : null}

          {media.isAdult && !showAdult && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setRevealed(true);
              }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink-900 text-cream"
            >
              <EyeOff className="h-6 w-6" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                NSFW &mdash; Tap to view
              </span>
            </button>
          )}

          {/* Type badge */}
          <div className="absolute top-2 left-2 z-10">
            <span className="ink-stamp-vermillion bg-vermillion-600 text-cream border-vermillion-600">
              {TYPE_LABEL[media.type] ?? "Manga"}
            </span>
          </div>

          {/* Rank */}
          {rank != null && (
            <div className="absolute top-2 right-2 z-10 flex h-9 w-9 items-center justify-center border-2 border-cream bg-ink-900/90 text-cream">
              <span className="display-headline text-lg leading-none">
                #{rank}
              </span>
            </div>
          )}

          {/* Score badge */}
          {media.score != null && (
            <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 border border-ink-900 bg-cream px-1.5 py-0.5 text-[11px] font-bold">
              <Star className="h-3 w-3 fill-vermillion-600 text-vermillion-600" strokeWidth={2.5} />
              <span>{(media.score / 10).toFixed(1)}</span>
            </div>
          )}

          {/* Hover gradient */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink-900/90 via-ink-900/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Hover content */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <p className="line-clamp-2 text-[11px] leading-snug text-cream">
              {media.description?.replace(/<[^>]*>/g, "").slice(0, 140)}
              {media.description && media.description.length > 140 ? "…" : ""}
            </p>
          </div>
        </div>
      </Link>

      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-2 text-sm font-bold leading-tight text-ink-900 group-hover:text-vermillion-600 transition-colors">
          {media.title.english ?? media.title.display}
        </h3>
        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-ink-700">
          <span className="font-jp text-ink-500 not-italic">
            {TYPE_KANJI[media.type] ?? "漫画"}
          </span>
          {media.popularity != null && (
            <span>{formatNumber(media.popularity)} fans</span>
          )}
        </div>
      </div>
    </div>
  );
}
