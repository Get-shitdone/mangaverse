"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Settings,
  List,
  Type,
  Sun,
  Moon,
  Coffee,
  ExternalLink,
} from "lucide-react";
import { useProgress } from "@/lib/store/progress";
import { usePreferences } from "@/lib/store/preferences";
import { cn } from "@/lib/utils";

interface Chapter {
  title: string;
  body: string;
}

const FONT_FAMILIES = [
  { id: "serif", label: "Serif", className: "font-serif" },
  { id: "sans", label: "Sans", className: "font-sans" },
  { id: "jp", label: "Tsukushi", className: "font-jp" },
];

export function NovelReader({
  mediaId,
  bookTitle,
  author,
  chapters,
  hasFullText,
  externalLink,
}: {
  mediaId: string;
  bookTitle: string;
  author?: string;
  chapters: Chapter[];
  hasFullText: boolean;
  externalLink: string | null;
}) {
  const setProgress = useProgress((s) => s.setProgress);
  const savedProg = useProgress((s) => s.progress[mediaId]);
  const fontSize = usePreferences((s) => s.readerFontSize);
  const setFontSize = usePreferences((s) => s.setReaderFontSize);
  const theme = usePreferences((s) => s.readerTheme);
  const setTheme = usePreferences((s) => s.setReaderTheme);

  const [chapterIdx, setChapterIdx] = useState(() => {
    if (savedProg?.chapterId) {
      const idx = parseInt(savedProg.chapterId.replace("c", ""), 10);
      if (!Number.isNaN(idx) && idx >= 0 && idx < chapters.length) return idx;
    }
    return 0;
  });
  const [lineHeight, setLineHeight] = useState(1.7);
  const [fontFamily, setFontFamily] = useState<"serif" | "sans" | "jp">("serif");
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chapter = chapters[chapterIdx];

  // Save scroll progress
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let ticker: number | null = null;
    const onScroll = () => {
      if (ticker) return;
      ticker = window.setTimeout(() => {
        const pct = el.scrollHeight
          ? (el.scrollTop + el.clientHeight) / el.scrollHeight
          : 0;
        setProgress({
          mediaId,
          chapterId: `c${chapterIdx}`,
          chapterNumber: String(chapterIdx + 1),
          scrollPct: Math.round(pct * 100),
          updatedAt: Date.now(),
        });
        ticker = null;
      }, 600);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (ticker) window.clearTimeout(ticker);
    };
  }, [mediaId, chapterIdx, setProgress]);

  // Restore scroll position when re-opening same chapter
  useEffect(() => {
    if (!savedProg) return;
    if (savedProg.chapterId !== `c${chapterIdx}`) return;
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const target = (savedProg.scrollPct ?? 0) / 100;
      el.scrollTop = Math.max(0, el.scrollHeight * target - el.clientHeight);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterIdx]);

  const themeClass = useMemo(() => {
    switch (theme) {
      case "dark":
        return "bg-ink-900 text-cream";
      case "sepia":
        return "bg-[#f4ecd8] text-ink-900";
      default:
        return "bg-cream text-ink-900";
    }
  }, [theme]);

  const fontClass = useMemo(() => {
    return FONT_FAMILIES.find((f) => f.id === fontFamily)?.className ?? "font-serif";
  }, [fontFamily]);

  const goPrev = useCallback(() => {
    if (chapterIdx === 0) return;
    setChapterIdx((i) => i - 1);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [chapterIdx]);

  const goNext = useCallback(() => {
    if (chapterIdx >= chapters.length - 1) return;
    setChapterIdx((i) => i + 1);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [chapterIdx, chapters.length]);

  if (!chapters.length) {
    return (
      <div className="min-h-screen bg-ink-900 text-cream flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <p className="font-jp text-2xl text-vermillion-400 mb-2">テキストなし</p>
          <h1 className="display-headline text-3xl mb-3">No Text Available</h1>
          <p className="text-sm text-cream/70 mb-6">
            We couldn&apos;t find a public-domain or preview text for this title.
            {externalLink && " Try the publisher's site instead."}
          </p>
          {externalLink ? (
            <a
              href={externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-vermillion"
            >
              Read on Publisher <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <Link
              href={`/title/${encodeURIComponent(mediaId)}`}
              className="btn-vermillion"
            >
              Back to title
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative min-h-screen w-full", themeClass)}>
      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-current/10 backdrop-blur bg-current-90">
        <div className={cn("flex items-center justify-between gap-3 px-3 py-2 md:px-6", themeClass)}>
          <Link
            href={`/title/${encodeURIComponent(mediaId)}`}
            className="flex items-center gap-2 hover:opacity-70"
          >
            <X className="h-5 w-5" />
            <span className="hidden md:block text-xs uppercase tracking-widest font-bold">
              Exit
            </span>
          </Link>

          <div className="text-center min-w-0 flex-1 px-2">
            <p className="text-[10px] uppercase tracking-widest opacity-60 truncate">
              {bookTitle}
              {author && <> · {author}</>}
            </p>
            <p className="text-xs font-bold truncate">
              {chapter.title} · {chapterIdx + 1} / {chapters.length}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSidebar(true)}
              aria-label="Chapters"
              className="flex h-9 w-9 items-center justify-center hover:opacity-70"
            >
              <List className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              aria-label="Settings"
              className="flex h-9 w-9 items-center justify-center hover:opacity-70"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div
        ref={scrollRef}
        className="h-screen overflow-y-auto pt-16 pb-24"
        style={{ scrollbarWidth: "thin" }}
      >
        <article
          className={cn("mx-auto max-w-2xl px-5 md:px-8", fontClass)}
          style={{ fontSize: `${fontSize}px`, lineHeight }}
        >
          <header className="mb-10 mt-4">
            <p className="text-xs uppercase tracking-widest opacity-50 mb-2">
              {hasFullText ? "Full text · Project Gutenberg" : "Preview"}
            </p>
            <h1 className="display-headline text-4xl md:text-6xl leading-none mb-3">
              {chapter.title}
            </h1>
            <p className="font-jp text-sm opacity-50">第{chapterIdx + 1}章</p>
          </header>

          <div className="space-y-5 whitespace-pre-line text-balance">
            {chapter.body.split(/\n\s*\n/).map((para, i) => (
              <p key={i} className="indent-8 first:indent-0 first-letter:text-3xl first-letter:font-serif first-letter:font-bold first:first-letter:float-left first:first-letter:mr-2 first:first-letter:mt-1 first:first-letter:text-6xl first:first-letter:leading-none">
                {para.trim()}
              </p>
            ))}
          </div>

          {/* End-of-chapter nav */}
          <div className="mt-16 mb-8 flex items-center justify-between border-t-2 border-current/20 pt-8">
            {chapterIdx > 0 ? (
              <button
                onClick={goPrev}
                className="inline-flex items-center gap-2 px-4 py-3 border-2 border-current text-sm uppercase tracking-widest font-bold hover:opacity-70"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
            ) : (
              <span />
            )}
            <span className="text-xs uppercase tracking-widest opacity-50">
              {chapterIdx + 1} of {chapters.length}
            </span>
            {chapterIdx < chapters.length - 1 ? (
              <button
                onClick={goNext}
                className="inline-flex items-center gap-2 px-4 py-3 border-2 border-current bg-vermillion-600 text-cream text-sm uppercase tracking-widest font-bold hover:opacity-90"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <Link
                href={`/title/${encodeURIComponent(mediaId)}`}
                className="inline-flex items-center gap-2 px-4 py-3 border-2 border-current bg-vermillion-600 text-cream text-sm uppercase tracking-widest font-bold hover:opacity-90"
              >
                The End
              </Link>
            )}
          </div>

          {externalLink && (
            <a
              href={externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-8 text-center text-xs uppercase tracking-widest opacity-60 hover:opacity-100"
            >
              Continue reading on publisher →
            </a>
          )}
        </article>
      </div>

      {/* Chapter sidebar */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setShowSidebar(false)}>
          <div
            className={cn(
              "ml-auto h-full w-full max-w-md overflow-hidden flex flex-col border-l-2 border-ink-900",
              themeClass
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-2 border-current/30 px-4 py-3">
              <h3 className="display-headline text-2xl">Table of Contents</h3>
              <button onClick={() => setShowSidebar(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <ul className="flex-1 overflow-y-auto divide-y divide-current/10">
              {chapters.map((c, i) => (
                <li key={i}>
                  <button
                    onClick={() => {
                      setChapterIdx(i);
                      setShowSidebar(false);
                      scrollRef.current?.scrollTo({ top: 0 });
                    }}
                    className={cn(
                      "block w-full text-left px-4 py-3 hover:bg-vermillion-600/10",
                      i === chapterIdx && "bg-vermillion-600 text-cream"
                    )}
                  >
                    <span className="text-xs opacity-60">Chapter {i + 1}</span>
                    <p className="font-bold line-clamp-1">{c.title}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Settings sidebar */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setShowSettings(false)}>
          <div
            className={cn(
              "ml-auto h-full w-full max-w-sm overflow-hidden flex flex-col border-l-2 border-ink-900",
              themeClass
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-2 border-current/30 px-4 py-3">
              <h3 className="display-headline text-2xl">Type</h3>
              <button onClick={() => setShowSettings(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Theme */}
              <section>
                <h4 className="text-xs uppercase tracking-widest font-bold mb-3 opacity-70">
                  Theme
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "cream" as const, label: "Cream", icon: <Sun className="h-4 w-4" /> },
                    { id: "sepia" as const, label: "Sepia", icon: <Coffee className="h-4 w-4" /> },
                    { id: "dark" as const, label: "Dark", icon: <Moon className="h-4 w-4" /> },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={cn(
                        "border-2 border-current/40 px-2 py-3 text-[10px] font-bold uppercase tracking-widest flex flex-col items-center gap-1",
                        theme === t.id && "bg-vermillion-600 text-cream border-vermillion-600"
                      )}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Font family */}
              <section>
                <h4 className="text-xs uppercase tracking-widest font-bold mb-3 opacity-70">
                  Typeface
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {FONT_FAMILIES.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFontFamily(f.id as any)}
                      className={cn(
                        "border-2 border-current/40 px-2 py-3 text-xs font-bold",
                        f.className,
                        fontFamily === f.id && "bg-vermillion-600 text-cream border-vermillion-600"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Font size */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs uppercase tracking-widest font-bold opacity-70">
                    Size
                  </h4>
                  <span className="text-xs">{fontSize}px</span>
                </div>
                <div className="flex items-center gap-3">
                  <Type className="h-3 w-3" />
                  <input
                    type="range"
                    min={14}
                    max={28}
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="flex-1 accent-vermillion-600"
                  />
                  <Type className="h-5 w-5" />
                </div>
              </section>

              {/* Line height */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs uppercase tracking-widest font-bold opacity-70">
                    Line Height
                  </h4>
                  <span className="text-xs">{lineHeight.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={1.4}
                  max={2.2}
                  step={0.1}
                  value={lineHeight}
                  onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                  className="w-full accent-vermillion-600"
                />
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
