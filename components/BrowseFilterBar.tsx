"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { value: "", label: "All" },
  { value: "JP", label: "Manga" },
  { value: "KR", label: "Manhwa" },
  { value: "CN", label: "Manhua" },
];

const FORMATS = [
  { value: "", label: "All Formats" },
  { value: "MANGA", label: "Manga" },
  { value: "NOVEL", label: "Novel" },
  { value: "LIGHT_NOVEL", label: "Light Novel" },
  { value: "ONE_SHOT", label: "One-Shot" },
];

const STATUSES = [
  { value: "", label: "Any Status" },
  { value: "RELEASING", label: "Ongoing" },
  { value: "FINISHED", label: "Completed" },
  { value: "HIATUS", label: "Hiatus" },
  { value: "NOT_YET_RELEASED", label: "Upcoming" },
];

const SORTS = [
  { value: "TRENDING_DESC", label: "Trending" },
  { value: "POPULARITY_DESC", label: "Popularity" },
  { value: "SCORE_DESC", label: "Score" },
  { value: "FAVOURITES_DESC", label: "Favorites" },
  { value: "START_DATE_DESC", label: "Newest" },
  { value: "TITLE_ROMAJI", label: "A — Z" },
];

export function BrowseFilterBar({ genres }: { genres: string[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showGenres, setShowGenres] = useState(false);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    startTransition(() => {
      router.push(`/browse?${next.toString()}`);
    });
  };

  const current = (key: string) => sp.get(key) ?? "";

  return (
    <div className="border-b-2 border-ink-900 bg-cream sticky top-[57px] z-30 backdrop-blur">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8 py-3 md:py-4 space-y-3 md:space-y-4">
        <div className="flex flex-col md:flex-row md:flex-wrap gap-2 md:gap-3 md:items-center">
          <FilterGroup label="Type">
            {COUNTRIES.map((c) => (
              <button
                key={c.value}
                onClick={() => update("country", c.value)}
                className={cn(
                  "chip",
                  current("country") === c.value && "chip-active"
                )}
              >
                {c.label}
              </button>
            ))}
          </FilterGroup>

          <FilterGroup label="Format">
            {FORMATS.map((f) => (
              <button
                key={f.value}
                onClick={() => update("format", f.value)}
                className={cn(
                  "chip",
                  current("format") === f.value && "chip-active"
                )}
              >
                {f.label}
              </button>
            ))}
          </FilterGroup>

          <FilterGroup label="Status">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => update("status", s.value)}
                className={cn(
                  "chip",
                  current("status") === s.value && "chip-active"
                )}
              >
                {s.label}
              </button>
            ))}
          </FilterGroup>

          <FilterGroup label="Sort">
            {SORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => update("sort", s.value)}
                className={cn(
                  "chip",
                  current("sort") === s.value && "chip-active"
                )}
              >
                {s.label}
              </button>
            ))}
          </FilterGroup>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowGenres(!showGenres)}
            className="text-xs uppercase tracking-widest font-bold text-ink-700 hover:text-vermillion-600"
          >
            {showGenres ? "Hide genres −" : "Show genres +"}
          </button>
          {showGenres && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => update("genre", "")}
                className={cn(
                  "chip",
                  current("genre") === "" && "chip-active"
                )}
              >
                All
              </button>
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => update("genre", g)}
                  className={cn("chip", current("genre") === g && "chip-active")}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {isPending && (
        <div className="h-0.5 w-full overflow-hidden">
          <div className="h-full w-1/3 bg-vermillion-600 animate-pulse" />
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto md:flex-wrap scrollbar-none -mx-4 md:mx-0 px-4 md:px-0">
      <span className="text-[10px] uppercase tracking-widest font-bold text-ink-700 mr-1 shrink-0">
        {label}:
      </span>
      {children}
    </div>
  );
}
