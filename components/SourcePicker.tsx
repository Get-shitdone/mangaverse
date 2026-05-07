"use client";

import { useState } from "react";
import Link from "next/link";
import { Layers, ChevronDown, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceOption {
  source: string;
  sourceName: string;
  resolvedId: string;
  chapterCount: number;
  firstChapterId?: string;
}

export function SourcePicker({
  mediaId,
  options,
  current,
}: {
  mediaId: string;
  options: SourceOption[];
  current: string;
}) {
  const [open, setOpen] = useState(false);
  if (options.length <= 1) return null;

  const currentLabel = options.find((o) => o.source === current)?.sourceName ?? options[0].sourceName;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 border-2 border-ink-900 bg-cream px-3 py-2 text-xs font-bold uppercase tracking-widest hover:bg-ink-900 hover:text-cream"
      >
        <Layers className="h-3 w-3" />
        Source: {currentLabel}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-72 panel-border bg-cream">
          <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-widest font-bold text-ink-700 border-b border-ink-200">
            Switch reading source
          </p>
          <ul className="divide-y divide-ink-200">
            {options.map((opt) => {
              const isMangaPlus = opt.source === "mangaplus";
              const href = opt.firstChapterId
                ? `/read/${encodeURIComponent(mediaId)}/${opt.firstChapterId}?source=${opt.source}&srcId=${opt.resolvedId}`
                : "#";
              return (
                <li key={opt.source}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3 py-2.5 text-xs hover:bg-vermillion-50",
                      current === opt.source && "bg-vermillion-50 font-bold"
                    )}
                  >
                    <div>
                      <p className="font-bold uppercase tracking-widest flex items-center gap-1">
                        {opt.sourceName}
                        {isMangaPlus && <ExternalLink className="h-3 w-3" />}
                        {current === opt.source && <Check className="h-3 w-3 text-vermillion-600" />}
                      </p>
                      <p className="text-[10px] text-ink-700 normal-case tracking-normal">
                        {opt.chapterCount} chapter{opt.chapterCount === 1 ? "" : "s"}
                        {isMangaPlus && " · official Shueisha reader"}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
