"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import type { MediaItem } from "@/lib/types";
import { TYPE_LABEL } from "@/lib/utils";

export function SearchBar({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(initial);
  const [results, setResults] = useState<MediaItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results ?? []);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [q]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl">
      <form onSubmit={submit} className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-700" />
        <input
          type="search"
          autoFocus
          placeholder="Search manhwa, manga, comics, novels…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full border-2 border-ink-900 bg-cream pl-11 pr-12 py-4 text-base font-medium placeholder:text-ink-500 focus:outline-none focus:bg-cream-100 shadow-panel-sm"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="Clear"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-700 hover:text-vermillion-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {open && q.trim().length >= 2 && (results.length > 0 || loading) && (
        <div className="absolute left-0 right-0 top-full mt-2 z-30 panel-border bg-cream max-h-[480px] overflow-y-auto">
          {loading && (
            <div className="px-4 py-3 text-xs uppercase tracking-widest text-ink-700">
              Searching…
            </div>
          )}
          {results.map((m) => (
            <Link
              key={m.id}
              href={`/title/${encodeURIComponent(m.id)}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 border-b border-ink-200 last:border-b-0 hover:bg-vermillion-50"
            >
              <div className="relative aspect-[2/3] w-10 shrink-0 overflow-hidden border border-ink-900 bg-ink-100">
                {m.coverImage.medium && (
                  <Image
                    src={m.coverImage.medium}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-ink-900 line-clamp-1">
                  {m.title.english ?? m.title.romaji ?? m.title.display}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-ink-700">
                  {TYPE_LABEL[m.type]} · {m.year ?? "—"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
