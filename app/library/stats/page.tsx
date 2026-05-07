"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLibrary } from "@/lib/store/library";
import { useProgress } from "@/lib/store/progress";
import { libraryByStatusBreakdown, readingHours } from "@/lib/recommend";
import { TYPE_LABEL } from "@/lib/utils";
import { ChevronLeft, BookOpen, Clock, Award, TrendingUp } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  reading: "bg-vermillion-600",
  plan: "bg-gold-500",
  completed: "bg-accent-mint",
  on_hold: "bg-ink-400",
  dropped: "bg-ink-700",
};

const STATUS_LABELS: Record<string, string> = {
  reading: "Reading",
  plan: "Plan to Read",
  completed: "Completed",
  on_hold: "On Hold",
  dropped: "Dropped",
};

export default function StatsPage() {
  const entries = useLibrary((s) => s.entries);
  const progressMap = useProgress((s) => s.progress);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const stats = useMemo(() => {
    if (!mounted) return null;
    const list = Object.values(entries);
    const breakdown = libraryByStatusBreakdown(entries);

    // Total chapters read from progress map
    const chaptersRead = Object.values(progressMap).reduce((sum, p) => {
      const n = parseFloat(p.chapterNumber ?? "0");
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);

    const hours = readingHours(entries, chaptersRead);

    // By type
    const byType: Record<string, number> = {};
    list.forEach((e) => {
      byType[e.type] = (byType[e.type] ?? 0) + 1;
    });

    // By genre — we don't store genres on entries, so this is 0 unless we extend the schema. Skip for v1.

    // Average rating
    const rated = list.filter((e) => e.rating != null);
    const avgRating =
      rated.length > 0
        ? rated.reduce((s, e) => s + (e.rating ?? 0), 0) / rated.length
        : 0;

    // Completion rate
    const total = list.length;
    const completionRate = total > 0 ? (breakdown.completed / total) * 100 : 0;

    return {
      total,
      breakdown,
      chaptersRead: Math.round(chaptersRead),
      hours,
      byType,
      avgRating,
      completionRate,
      ratedCount: rated.length,
    };
  }, [entries, progressMap, mounted]);

  if (!mounted) {
    return (
      <div className="bg-cream min-h-screen pb-20">
        <header className="border-b-2 border-ink-900 bg-cream-100 halftone-bg">
          <div className="mx-auto max-w-[1600px] px-4 md:px-8 py-8 md:py-12">
            <p className="font-jp text-vermillion-600 text-lg mb-2">統計</p>
            <h1 className="display-headline text-4xl sm:text-5xl md:text-7xl text-ink-900">Reading Stats</h1>
          </div>
        </header>
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="bg-cream min-h-screen pb-20">
        <header className="border-b-2 border-ink-900 bg-cream-100 halftone-bg">
          <div className="mx-auto max-w-[1600px] px-4 md:px-8 py-8 md:py-12">
            <p className="font-jp text-vermillion-600 text-lg mb-2">統計</p>
            <h1 className="display-headline text-4xl sm:text-5xl md:text-7xl text-ink-900">Reading Stats</h1>
          </div>
        </header>
        <div className="mx-auto max-w-2xl px-4 mt-16">
          <div className="panel-border bg-cream-100 p-12 text-center">
            <h2 className="display-headline text-3xl mb-3">No data yet</h2>
            <p className="text-ink-700 mb-6">
              Add a few titles to your library and start reading. Your stats
              dashboard will populate as you go.
            </p>
            <Link href="/browse" className="btn-vermillion">
              Browse titles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const maxBreakdown = Math.max(...Object.values(stats.breakdown), 1);

  return (
    <div className="bg-cream min-h-screen pb-20">
      <header className="border-b-2 border-ink-900 bg-cream-100 halftone-bg">
        <div className="mx-auto max-w-[1600px] px-4 md:px-8 py-8 md:py-12">
          <Link
            href="/library"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-widest font-bold text-ink-700 hover:text-vermillion-600 mb-3"
          >
            <ChevronLeft className="h-3 w-3" /> Back to Library
          </Link>
          <p className="font-jp text-vermillion-600 text-lg mb-2">統計</p>
          <h1 className="display-headline text-4xl sm:text-5xl md:text-7xl text-ink-900">
            Reading Stats
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 md:px-8 mt-12">
        {/* Headline numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <BigStat
            icon={<BookOpen className="h-5 w-5" />}
            kanji="書"
            value={stats.total}
            label="Titles in library"
          />
          <BigStat
            icon={<TrendingUp className="h-5 w-5" />}
            kanji="話"
            value={stats.chaptersRead}
            label="Chapters read"
          />
          <BigStat
            icon={<Clock className="h-5 w-5" />}
            kanji="時"
            value={`${stats.hours}h`}
            label="Estimated hours"
          />
          <BigStat
            icon={<Award className="h-5 w-5" />}
            kanji="評"
            value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"}
            label={`Avg rating (${stats.ratedCount} rated)`}
          />
        </div>

        {/* Status breakdown bar chart */}
        <div className="mt-12 panel-border bg-cream p-6 md:p-8">
          <h2 className="display-headline text-2xl md:text-3xl text-ink-900 mb-6 flex items-baseline gap-3">
            Status Breakdown
            <span className="font-jp text-base text-vermillion-600">分布</span>
          </h2>

          <div className="space-y-4">
            {Object.entries(stats.breakdown).map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between text-sm font-bold mb-1">
                  <span className="uppercase tracking-widest text-ink-900">
                    {STATUS_LABELS[status]}
                  </span>
                  <span className="text-ink-700">{count}</span>
                </div>
                <div className="h-3 w-full border-2 border-ink-900 bg-cream-100 overflow-hidden">
                  <div
                    className={`h-full ${STATUS_COLORS[status]} halftone-bg`}
                    style={{
                      width: `${(count / maxBreakdown) * 100}%`,
                      transition: "width 600ms cubic-bezier(.16,1,.3,1)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t-2 border-ink-200">
            <div className="flex items-center justify-between text-sm">
              <span className="uppercase tracking-widest font-bold">Completion Rate</span>
              <span className="display-headline text-2xl text-vermillion-600">
                {stats.completionRate.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* By type */}
        <div className="mt-8 panel-border bg-cream p-6 md:p-8">
          <h2 className="display-headline text-2xl md:text-3xl text-ink-900 mb-6 flex items-baseline gap-3">
            By Format
            <span className="font-jp text-base text-vermillion-600">種類</span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.byType)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} className="border-2 border-ink-900 bg-cream-100 p-4 text-center">
                  <p className="display-headline text-4xl text-vermillion-600">{count}</p>
                  <p className="text-xs uppercase tracking-widest font-bold mt-1">
                    {TYPE_LABEL[type] ?? type}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* Settings link */}
        <div className="mt-12 flex flex-wrap gap-3 justify-center">
          <Link href="/library" className="btn-ghost">
            ← Back to Library
          </Link>
          <Link href="/library/settings" className="btn-ink">
            Export / Import
          </Link>
        </div>
      </div>
    </div>
  );
}

function BigStat({
  icon,
  kanji,
  value,
  label,
}: {
  icon: React.ReactNode;
  kanji: string;
  value: number | string;
  label: string;
}) {
  return (
    <div className="panel-border bg-cream relative p-5 overflow-hidden">
      <div className="absolute top-2 right-2 font-jp text-2xl text-vermillion-600/30">
        {kanji}
      </div>
      <div className="flex items-center gap-2 text-vermillion-600 mb-3">{icon}</div>
      <p className="display-headline text-4xl md:text-5xl text-ink-900 leading-none">
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-widest font-bold text-ink-700 mt-2">
        {label}
      </p>
    </div>
  );
}
