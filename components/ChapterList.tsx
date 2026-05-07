"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Chapter } from "@/lib/types";
import { useProgress } from "@/lib/store/progress";
import { ChevronDown, ChevronUp, BookOpen, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChapterList({
  chapters,
  mediaId,
  mangadexId,
}: {
  chapters: Chapter[];
  mediaId: string;
  mangadexId: string;
}) {
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const progress = useProgress((s) => s.progress[mediaId]);

  const sorted = useMemo(() => {
    const arr = [...chapters];
    arr.sort((a, b) => {
      const an = parseFloat(a.number ?? "0") || 0;
      const bn = parseFloat(b.number ?? "0") || 0;
      return order === "asc" ? an - bn : bn - an;
    });
    if (!search) return arr;
    const lo = search.toLowerCase();
    return arr.filter(
      (c) =>
        c.title?.toLowerCase().includes(lo) ||
        c.number?.includes(lo) ||
        c.scanlationGroup?.toLowerCase().includes(lo)
    );
  }, [chapters, order, search]);

  const lastReadChapter = progress?.chapterId;

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="display-headline text-3xl md:text-4xl text-ink-900 flex items-baseline gap-3">
          Chapters
          <span className="font-jp text-base text-vermillion-600">話</span>
          <span className="text-sm font-sans font-normal text-ink-700">
            ({chapters.length})
          </span>
        </h2>
        <button
          type="button"
          onClick={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}
          className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-ink-700 hover:text-vermillion-600"
        >
          {order === "asc" ? "Oldest first" : "Newest first"}
          {order === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      <input
        type="search"
        placeholder="Search chapters…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full border-2 border-ink-900 bg-cream px-4 py-2.5 text-sm font-medium placeholder:text-ink-500 focus:outline-none focus:bg-cream-100"
      />

      <ul className="panel-border-sm divide-y-2 divide-ink-900 bg-cream max-h-[600px] overflow-y-auto">
        {sorted.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-ink-700">
            No chapters match your search.
          </li>
        ) : (
          sorted.map((c) => {
            const isCurrent = c.id === lastReadChapter;
            return (
              <li key={c.id}>
                <Link
                  href={`/read/${encodeURIComponent(mediaId)}/${c.id}?md=${mangadexId}`}
                  className={cn(
                    "flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-vermillion-50",
                    isCurrent && "bg-vermillion-50"
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink-900">
                        Ch. {c.number ?? "—"}
                      </span>
                      {c.title && (
                        <span className="text-sm text-ink-700 line-clamp-1">
                          · {c.title}
                        </span>
                      )}
                      {isCurrent && (
                        <span className="ink-stamp-vermillion border-vermillion-600 bg-vermillion-100">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] uppercase tracking-widest text-ink-500">
                      {c.scanlationGroup && <span>{c.scanlationGroup}</span>}
                      {c.pages > 0 && <span>· {c.pages}p</span>}
                      {c.publishedAt && (
                        <span>
                          · {new Date(c.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <BookOpen className="h-4 w-4 shrink-0 text-ink-700" />
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
