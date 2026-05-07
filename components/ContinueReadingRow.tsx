"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useProgress, recentProgress } from "@/lib/store/progress";
import { useLibrary } from "@/lib/store/library";
import { SectionRow } from "./SectionRow";
import { Play } from "lucide-react";

export function ContinueReadingRow() {
  // Select RAW state — never run a function that builds a new array inside the
  // selector or Zustand will re-render forever.
  const progress = useProgress((s) => s.progress);
  const entries = useLibrary((s) => s.entries);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const recent = useMemo(() => recentProgress(progress, 12), [progress]);

  if (!mounted) return null;
  if (!recent.length) return null;

  return (
    <SectionRow
      title="Continue Reading"
      subtitle="Pick up where you left off"
      kanji="続きを読む"
    >
      {recent.map((p) => {
        const lib = entries[p.mediaId];
        if (!lib) return null;
        return (
          <div key={p.mediaId} className="snap-start shrink-0 w-[280px] md:w-[340px]">
            <div className="relative panel-card aspect-[16/9]">
              {lib.cover ? (
                <Image
                  src={lib.cover}
                  alt={lib.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-ink-100" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="text-cream font-bold line-clamp-1">{lib.title}</h3>
                <p className="text-cream/70 text-xs uppercase tracking-widest mb-3">
                  {p.chapterNumber ? `Chapter ${p.chapterNumber}` : "Continue"}
                  {p.page ? ` · Page ${p.page}` : ""}
                </p>
                <Link
                  href={`/title/${encodeURIComponent(p.mediaId)}`}
                  className="inline-flex items-center gap-2 border-2 border-cream bg-vermillion-600 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-cream hover:bg-cream hover:text-ink-900"
                >
                  <Play className="h-3 w-3 fill-current" /> Resume
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </SectionRow>
  );
}
