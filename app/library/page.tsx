"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLibrary } from "@/lib/store/library";
import { useProgress } from "@/lib/store/progress";
import type { LibraryStatus } from "@/lib/types";
import { TYPE_LABEL, cn } from "@/lib/utils";
import { BookOpen, Trash2, Star } from "lucide-react";

const TABS: { id: LibraryStatus | "all"; label: string; jp: string }[] = [
  { id: "all", label: "All", jp: "全部" },
  { id: "reading", label: "Reading", jp: "読中" },
  { id: "plan", label: "Plan to Read", jp: "予定" },
  { id: "completed", label: "Completed", jp: "完了" },
  { id: "on_hold", label: "On Hold", jp: "保留" },
  { id: "dropped", label: "Dropped", jp: "中断" },
];

export default function LibraryPage() {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<LibraryStatus | "all">("all");
  const entries = useLibrary((s) => s.entries);
  const remove = useLibrary((s) => s.remove);
  const rate = useLibrary((s) => s.rate);
  const progressMap = useProgress((s) => s.progress);

  useEffect(() => setMounted(true), []);

  const list = mounted
    ? Object.values(entries)
        .filter((e) => tab === "all" || e.status === tab)
        .sort((a, b) => b.updatedAt - a.updatedAt)
    : [];

  const counts = mounted
    ? {
        all: Object.keys(entries).length,
        reading: Object.values(entries).filter((e) => e.status === "reading").length,
        plan: Object.values(entries).filter((e) => e.status === "plan").length,
        completed: Object.values(entries).filter((e) => e.status === "completed").length,
        on_hold: Object.values(entries).filter((e) => e.status === "on_hold").length,
        dropped: Object.values(entries).filter((e) => e.status === "dropped").length,
      }
    : { all: 0, reading: 0, plan: 0, completed: 0, on_hold: 0, dropped: 0 };

  if (!mounted) {
    return (
      <div className="bg-cream min-h-screen pb-20">
        <header className="border-b-2 border-ink-900 bg-cream-100 halftone-bg">
          <div className="mx-auto max-w-[1600px] px-4 md:px-8 py-8 md:py-12">
            <p className="font-jp text-vermillion-600 text-lg mb-2">私の図書館</p>
            <h1 className="display-headline text-4xl sm:text-5xl md:text-7xl text-ink-900">
              My Library
            </h1>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen pb-20">
      <header className="border-b-2 border-ink-900 bg-cream-100 halftone-bg">
        <div className="mx-auto max-w-[1600px] px-4 md:px-8 py-8 md:py-12">
          <p className="font-jp text-vermillion-600 text-lg mb-2">私の図書館</p>
          <h1 className="display-headline text-4xl sm:text-5xl md:text-7xl text-ink-900 mb-3">
            My Library
          </h1>
          <p className="text-sm uppercase tracking-widest text-ink-700 mb-4">
            {counts.all} {counts.all === 1 ? "title" : "titles"} saved · localstorage only,
            no account
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/library/stats" className="btn-ghost text-xs">
              My Stats
            </Link>
            <Link href="/library/settings" className="btn-ghost text-xs">
              Settings
            </Link>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b-2 border-ink-900 bg-cream sticky top-[57px] z-30">
        <div className="mx-auto max-w-[1600px] px-4 md:px-8">
          <nav className="flex gap-1 overflow-x-auto scrollbar-none py-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "shrink-0 flex items-center gap-2 border-2 border-ink-900 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors",
                  tab === t.id
                    ? "bg-vermillion-600 text-cream border-vermillion-600"
                    : "bg-cream text-ink-900 hover:bg-ink-900 hover:text-cream"
                )}
              >
                <span>{t.label}</span>
                <span className={cn(
                  "px-1.5 py-0.5 text-[10px] border",
                  tab === t.id
                    ? "border-cream/40 bg-vermillion-700"
                    : "border-ink-300 bg-cream-100"
                )}>
                  {counts[t.id]}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-[1600px] px-4 md:px-8 mt-8">
        {list.length === 0 ? (
          <div className="panel-border bg-cream-100 p-12 text-center max-w-2xl mx-auto">
            <p className="font-jp text-vermillion-600 mb-2">本棚が空っぽ</p>
            <h2 className="display-headline text-3xl mb-3">Your library is empty</h2>
            <p className="text-ink-700 mb-6">
              Browse titles and add them to your library to track reading progress,
              save favorites, and get personalized recommendations.
            </p>
            <Link href="/browse" className="btn-vermillion">
              Browse titles
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {list.map((entry) => {
              const prog = progressMap[entry.mediaId];
              return (
                <div key={entry.mediaId} className="panel-border bg-cream group">
                  <div className="flex gap-4 p-4">
                    <Link
                      href={`/title/${encodeURIComponent(entry.mediaId)}`}
                      className="relative aspect-[2/3] w-[110px] shrink-0 overflow-hidden border-2 border-ink-900 bg-ink-100"
                    >
                      {entry.cover && (
                        <Image
                          src={entry.cover}
                          alt={entry.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      )}
                    </Link>

                    <div className="flex flex-col justify-between min-w-0 flex-1">
                      <div>
                        <Link
                          href={`/title/${encodeURIComponent(entry.mediaId)}`}
                          className="text-sm md:text-base font-bold text-ink-900 hover:text-vermillion-600 line-clamp-2"
                        >
                          {entry.title}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest">
                          <span className="ink-stamp">{TYPE_LABEL[entry.type]}</span>
                          <span className="ink-stamp-vermillion capitalize">
                            {entry.status.replace("_", " ")}
                          </span>
                        </div>
                        {prog && (
                          <p className="mt-2 text-xs text-ink-700">
                            Last read: Ch. {prog.chapterNumber ?? "—"}
                            {prog.page ? ` · p.${prog.page}` : ""}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <button
                              key={i}
                              onClick={() => rate(entry.mediaId, i * 2)}
                              className="text-vermillion-600 hover:scale-110 transition-transform"
                              aria-label={`Rate ${i} stars`}
                            >
                              <Star
                                className={cn(
                                  "h-4 w-4",
                                  (entry.rating ?? 0) >= i * 2
                                    ? "fill-vermillion-600"
                                    : "fill-transparent"
                                )}
                              />
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/title/${encodeURIComponent(entry.mediaId)}`}
                            aria-label="Read"
                            className="flex h-8 w-8 items-center justify-center border-2 border-ink-900 bg-cream hover:bg-ink-900 hover:text-cream"
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => remove(entry.mediaId)}
                            aria-label="Remove"
                            className="flex h-8 w-8 items-center justify-center border-2 border-ink-900 bg-cream hover:bg-vermillion-600 hover:text-cream hover:border-vermillion-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
