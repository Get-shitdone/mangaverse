"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Settings,
  List,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type { Chapter } from "@/lib/types";
import { useProgress } from "@/lib/store/progress";
import { usePreferences } from "@/lib/store/preferences";
import { cn } from "@/lib/utils";

type Mode = "paginated" | "vertical" | "double";

export function Reader({
  mediaId,
  chapterId,
  pages,
  chapters,
  mangadexId,
}: {
  mediaId: string;
  chapterId: string;
  pages: string[];
  chapters: Chapter[];
  mangadexId: string;
}) {
  const router = useRouter();
  const setProgress = useProgress((s) => s.setProgress);
  const savedMode = usePreferences((s) => s.readerMode);
  const setSavedMode = usePreferences((s) => s.setReaderMode);

  const [mode, setMode] = useState<Mode>(savedMode);
  const [page, setPage] = useState(0);
  const [showUI, setShowUI] = useState(true);
  const [showChapters, setShowChapters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const idleTimer = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sortedChapters = useMemo(() => {
    return [...chapters].sort((a, b) => {
      const an = parseFloat(a.number ?? "0") || 0;
      const bn = parseFloat(b.number ?? "0") || 0;
      return an - bn;
    });
  }, [chapters]);

  const currentChapter = chapters.find((c) => c.id === chapterId);
  const currentIdx = sortedChapters.findIndex((c) => c.id === chapterId);
  const prevChapter = currentIdx > 0 ? sortedChapters[currentIdx - 1] : null;
  const nextChapter =
    currentIdx >= 0 && currentIdx < sortedChapters.length - 1
      ? sortedChapters[currentIdx + 1]
      : null;

  const goToChapter = useCallback(
    (chapId: string) => {
      router.push(`/read/${encodeURIComponent(mediaId)}/${chapId}?md=${mangadexId}`);
    },
    [router, mediaId, mangadexId]
  );

  // Track progress
  useEffect(() => {
    setProgress({
      mediaId,
      chapterId,
      chapterNumber: currentChapter?.number ?? undefined,
      page: page + 1,
      updatedAt: Date.now(),
    });
  }, [mediaId, chapterId, page, currentChapter, setProgress]);

  // Persist mode preference
  useEffect(() => {
    setSavedMode(mode);
  }, [mode, setSavedMode]);

  // Idle UI hide
  const resetIdle = useCallback(() => {
    setShowUI(true);
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setShowUI(false), 2500);
  }, []);

  useEffect(() => {
    resetIdle();
    const onMove = () => resetIdle();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchstart", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchstart", onMove);
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
    };
  }, [resetIdle]);

  // Keyboard navigation
  useEffect(() => {
    if (mode === "vertical") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        nextPage();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prevPage();
      } else if (e.key === "Escape") {
        if (showChapters) setShowChapters(false);
        else if (showSettings) setShowSettings(false);
        else router.push(`/title/${encodeURIComponent(mediaId)}`);
      } else if (e.key === "f") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, page, pages.length, showChapters, showSettings]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const step = mode === "double" ? 2 : 1;

  const nextPage = () => {
    if (page + step >= pages.length) {
      if (nextChapter) goToChapter(nextChapter.id);
      return;
    }
    setPage((p) => Math.min(p + step, pages.length - 1));
  };

  const prevPage = () => {
    if (page === 0) {
      if (prevChapter) goToChapter(prevChapter.id);
      return;
    }
    setPage((p) => Math.max(p - step, 0));
  };

  const isFirstPage = page === 0;
  const isLastPage = page >= pages.length - 1;

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full bg-ink-900 text-cream overflow-hidden"
      onClick={() => resetIdle()}
    >
      {/* Top bar */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 transition-transform duration-300",
          showUI ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-cream/10 bg-ink-900/95 px-3 py-2 backdrop-blur md:px-6">
          <Link
            href={`/title/${encodeURIComponent(mediaId)}`}
            className="flex items-center gap-2 text-cream hover:text-vermillion-400"
          >
            <X className="h-5 w-5" />
            <span className="hidden md:block text-xs uppercase tracking-widest font-bold">
              Exit Reader
            </span>
          </Link>

          <div className="text-center min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-cream/60">
              Chapter {currentChapter?.number ?? "—"}
              {currentChapter?.title ? ` · ${currentChapter.title}` : ""}
            </p>
            {mode !== "vertical" && (
              <p className="text-xs font-bold text-cream">
                Page {page + 1} / {pages.length}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChapters(!showChapters)}
              aria-label="Chapters"
              className="flex h-9 w-9 items-center justify-center text-cream hover:text-vermillion-400"
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              aria-label="Settings"
              className="flex h-9 w-9 items-center justify-center text-cream hover:text-vermillion-400"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              aria-label="Fullscreen"
              className="hidden md:flex h-9 w-9 items-center justify-center text-cream hover:text-vermillion-400"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      {mode === "vertical" ? (
        <div className="mx-auto max-w-3xl py-12 px-2 md:px-0">
          {pages.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={`Page ${i + 1}`}
              className="block w-full select-none"
              loading={i < 3 ? "eager" : "lazy"}
              draggable={false}
            />
          ))}
          <div className="mt-8 flex items-center justify-between">
            {prevChapter ? (
              <button onClick={() => goToChapter(prevChapter.id)} className="btn-ghost">
                <ChevronLeft className="h-4 w-4" /> Ch. {prevChapter.number}
              </button>
            ) : (
              <span />
            )}
            {nextChapter ? (
              <button onClick={() => goToChapter(nextChapter.id)} className="btn-vermillion">
                Ch. {nextChapter.number} <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <Link
                href={`/title/${encodeURIComponent(mediaId)}`}
                className="btn-vermillion"
              >
                Last Chapter — Back
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="relative mx-auto flex min-h-screen max-w-screen-xl items-center justify-center px-2 md:px-12">
          <div className="relative flex max-h-[100dvh] w-full justify-center gap-2 py-3">
            {mode === "double" && page + 1 < pages.length ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pages[page + 1]}
                  alt={`Page ${page + 2}`}
                  className="max-h-[90vh] w-auto select-none object-contain"
                  draggable={false}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pages[page]}
                  alt={`Page ${page + 1}`}
                  className="max-h-[90vh] w-auto select-none object-contain"
                  draggable={false}
                />
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pages[page]}
                alt={`Page ${page + 1}`}
                className="max-h-[92vh] w-auto select-none object-contain"
                draggable={false}
              />
            )}
          </div>

          {/* Tap zones */}
          <button
            onClick={prevPage}
            aria-label="Previous"
            className="absolute inset-y-0 left-0 z-10 w-1/3 cursor-w-resize"
          />
          <button
            onClick={nextPage}
            aria-label="Next"
            className="absolute inset-y-0 right-0 z-10 w-1/3 cursor-e-resize"
          />

          {/* Side arrows */}
          <button
            onClick={prevPage}
            aria-label="Previous"
            disabled={isFirstPage && !prevChapter}
            className={cn(
              "absolute left-2 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center border-2 border-cream/40 bg-ink-900/50 text-cream backdrop-blur transition-all hover:bg-vermillion-600 hover:border-vermillion-600 md:flex",
              isFirstPage && !prevChapter && "opacity-30 cursor-not-allowed",
              !showUI && "opacity-0 pointer-events-none"
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextPage}
            aria-label="Next"
            disabled={isLastPage && !nextChapter}
            className={cn(
              "absolute right-2 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center border-2 border-cream/40 bg-ink-900/50 text-cream backdrop-blur transition-all hover:bg-vermillion-600 hover:border-vermillion-600 md:flex",
              isLastPage && !nextChapter && "opacity-30 cursor-not-allowed",
              !showUI && "opacity-0 pointer-events-none"
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Bottom progress bar */}
      {mode !== "vertical" && (
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-30 transition-transform duration-300",
            showUI ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="bg-ink-900/95 backdrop-blur px-4 py-3 border-t border-cream/10">
            <div className="flex items-center gap-3">
              <button
                onClick={prevPage}
                className="text-cream/70 text-xs uppercase tracking-widest font-bold hover:text-vermillion-400"
                disabled={isFirstPage && !prevChapter}
              >
                ← Prev
              </button>
              <input
                type="range"
                min={0}
                max={pages.length - 1}
                value={page}
                onChange={(e) => setPage(parseInt(e.target.value, 10))}
                className="flex-1 accent-vermillion-600"
              />
              <button
                onClick={nextPage}
                className="text-cream/70 text-xs uppercase tracking-widest font-bold hover:text-vermillion-400"
                disabled={isLastPage && !nextChapter}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chapter drawer */}
      {showChapters && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setShowChapters(false)}>
          <div className="ml-auto h-full w-full max-w-md bg-cream text-ink-900 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b-2 border-ink-900 px-4 py-3">
              <h3 className="display-headline text-2xl">All Chapters</h3>
              <button onClick={() => setShowChapters(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto divide-y-2 divide-ink-900">
              {sortedChapters.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      goToChapter(c.id);
                      setShowChapters(false);
                    }}
                    className={cn(
                      "block w-full text-left px-4 py-3 hover:bg-vermillion-50",
                      c.id === chapterId && "bg-vermillion-100 font-bold"
                    )}
                  >
                    <span className="font-bold">Ch. {c.number ?? "—"}</span>
                    {c.title && <span className="text-sm text-ink-700"> · {c.title}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Settings drawer */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setShowSettings(false)}>
          <div className="ml-auto h-full w-full max-w-sm bg-cream text-ink-900 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b-2 border-ink-900 px-4 py-3">
              <h3 className="display-headline text-2xl">Reader Settings</h3>
              <button onClick={() => setShowSettings(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div>
                <h4 className="display-headline text-lg mb-2">Reading Mode</h4>
                <div className="grid grid-cols-3 gap-2">
                  {(["paginated", "double", "vertical"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={cn(
                        "border-2 border-ink-900 px-2 py-3 text-[10px] font-bold uppercase tracking-widest",
                        mode === m
                          ? "bg-ink-900 text-cream"
                          : "bg-cream hover:bg-cream-300"
                      )}
                    >
                      {m === "paginated" ? "Single" : m === "double" ? "Double" : "Webtoon"}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-ink-700">
                  Webtoon mode is best for manhwa and vertical scroll comics.
                </p>
              </div>

              <div className="text-xs text-ink-700 space-y-1">
                <p><kbd className="px-1.5 py-0.5 border border-ink-700 text-[10px]">←</kbd> <kbd className="px-1.5 py-0.5 border border-ink-700 text-[10px]">→</kbd> Navigate pages</p>
                <p><kbd className="px-1.5 py-0.5 border border-ink-700 text-[10px]">Space</kbd> Next page</p>
                <p><kbd className="px-1.5 py-0.5 border border-ink-700 text-[10px]">F</kbd> Toggle fullscreen</p>
                <p><kbd className="px-1.5 py-0.5 border border-ink-700 text-[10px]">Esc</kbd> Exit reader</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
