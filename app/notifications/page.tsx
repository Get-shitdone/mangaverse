"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLibrary } from "@/lib/store/library";
import { useNotifications } from "@/lib/store/notifications";
import { timeAgo, cn } from "@/lib/utils";
import { Bell, BookOpen, Check, RefreshCw } from "lucide-react";
import type { ChapterUpdate } from "@/lib/types";

export default function NotificationsPage() {
  const updates = useNotifications((s) => s.updates);
  const lastPolledAt = useNotifications((s) => s.lastPolledAt);
  const lastSeen = useNotifications((s) => s.lastSeen);
  const markRead = useNotifications((s) => s.markRead);
  const markAllRead = useNotifications((s) => s.markAllRead);
  const setUpdates = useNotifications((s) => s.setUpdates);
  const setPolledAt = useNotifications((s) => s.setPolledAt);
  const entries = useLibrary((s) => s.entries);
  const [mounted, setMounted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => setMounted(true), []);

  const grouped = useMemo(() => {
    const byTitle: Record<string, ChapterUpdate[]> = {};
    for (const u of updates) {
      if (!byTitle[u.mediaId]) byTitle[u.mediaId] = [];
      byTitle[u.mediaId].push(u);
    }
    return byTitle;
  }, [updates]);

  const refresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const list = Object.values(entries)
        .filter((e) => e.status !== "dropped")
        .slice(0, 60)
        .map((e) => ({
          mediaId: e.mediaId,
          title: e.title,
          cover: e.cover,
          mangadexId: e.mangadexId ?? null,
          lastSeen: lastSeen[e.mediaId] ?? e.addedAt,
        }));
      const res = await fetch("/api/chapters/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: list }),
      });
      if (res.ok) {
        const data = await res.json();
        const fresh = (data.updates ?? []).filter((u: ChapterUpdate) => {
          const t = new Date(u.publishedAt).getTime();
          return t > (lastSeen[u.mediaId] ?? 0);
        });
        setUpdates(fresh);
        setPolledAt(Date.now());
      }
    } finally {
      setRefreshing(false);
    }
  };

  if (!mounted) {
    return (
      <div className="bg-cream min-h-screen pb-20">
        <header className="border-b-2 border-ink-900 bg-cream-100 halftone-bg">
          <div className="mx-auto max-w-[1600px] px-4 md:px-8 py-12">
            <p className="font-jp text-vermillion-600 text-lg mb-2">通知</p>
            <h1 className="display-headline text-5xl md:text-7xl text-ink-900">Notifications</h1>
          </div>
        </header>
      </div>
    );
  }

  const totalCount = updates.length;
  const titleCount = Object.keys(grouped).length;

  return (
    <div className="bg-cream min-h-screen pb-20">
      <header className="border-b-2 border-ink-900 bg-cream-100 halftone-bg">
        <div className="mx-auto max-w-[1600px] px-4 md:px-8 py-12">
          <Link
            href="/library"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-widest font-bold text-ink-700 hover:text-vermillion-600 mb-3"
          >
            ← Back to Library
          </Link>
          <p className="font-jp text-vermillion-600 text-lg mb-2">通知</p>
          <h1 className="display-headline text-5xl md:text-7xl text-ink-900 mb-3">
            Notifications
          </h1>
          <p className="text-sm uppercase tracking-widest text-ink-700">
            {totalCount > 0
              ? `${totalCount} new chapter${totalCount === 1 ? "" : "s"} across ${titleCount} title${titleCount === 1 ? "" : "s"}`
              : "Everything is read up"}
            {lastPolledAt > 0 && (
              <>
                {" "}
                · last checked {timeAgo(lastPolledAt)}
              </>
            )}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={refresh} disabled={refreshing} className="btn-ghost text-xs">
              <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
              {refreshing ? "Checking…" : "Check for updates"}
            </button>
            {totalCount > 0 && (
              <button onClick={markAllRead} className="btn-ink text-xs">
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 md:px-8 mt-12">
        {totalCount === 0 ? (
          <div className="panel-border bg-cream-100 p-12 text-center">
            <Bell className="h-10 w-10 text-vermillion-600 mx-auto mb-4" />
            <p className="font-jp text-vermillion-600 mb-2">通知なし</p>
            <h2 className="display-headline text-3xl mb-3">All caught up</h2>
            <p className="text-ink-700 mb-6">
              We&apos;ll automatically check MangaDex every five minutes for new
              chapters in your library and surface them here.
            </p>
            <Link href="/library" className="btn-vermillion">
              View library
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([mediaId, chapters]) => {
              const head = chapters[0];
              return (
                <section key={mediaId} className="panel-border bg-cream overflow-hidden">
                  <div className="flex items-center gap-4 p-4 border-b-2 border-ink-200 bg-cream-100">
                    <Link
                      href={`/title/${encodeURIComponent(mediaId)}`}
                      className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden border-2 border-ink-900"
                    >
                      {head.cover && (
                        <Image src={head.cover} alt="" fill unoptimized className="object-cover" />
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/title/${encodeURIComponent(mediaId)}`}
                        className="text-base font-bold text-ink-900 hover:text-vermillion-600 line-clamp-1"
                      >
                        {head.mediaTitle}
                      </Link>
                      <p className="text-[10px] uppercase tracking-widest text-ink-700">
                        {chapters.length} new chapter{chapters.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <button
                      onClick={() => markRead(mediaId)}
                      className="text-xs uppercase tracking-widest font-bold text-ink-700 hover:text-vermillion-600 px-2"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>

                  <ul className="divide-y divide-ink-200">
                    {chapters.map((c) => (
                      <li key={c.chapterId}>
                        <Link
                          href={`/read/${encodeURIComponent(mediaId)}/${c.chapterId}?md=${c.mangadexId}`}
                          className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-vermillion-50"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-ink-900">
                              Ch. {c.chapterNumber ?? "—"}
                              {c.chapterTitle && (
                                <span className="text-ink-700 font-normal"> · {c.chapterTitle}</span>
                              )}
                            </p>
                            <p className="text-[10px] uppercase tracking-widest text-ink-500 mt-0.5">
                              {c.scanlationGroup ?? "Unknown group"}
                              {" · "}
                              {timeAgo(c.publishedAt)}
                            </p>
                          </div>
                          <BookOpen className="h-4 w-4 shrink-0 text-ink-700" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
