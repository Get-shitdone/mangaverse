"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionRow({
  title,
  subtitle,
  kanji,
  rightLabel,
  children,
  numbered = false,
}: {
  title: string;
  subtitle?: string;
  kanji?: string;
  rightLabel?: React.ReactNode;
  children: React.ReactNode;
  numbered?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(true);

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scroll = (dir: "l" | "r") => {
    const el = ref.current;
    if (!el) return;
    const w = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "l" ? -w : w, behavior: "smooth" });
  };

  return (
    <section className="my-8 md:my-12">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8">
        <div className="mb-4 md:mb-5 flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-2 md:gap-3 min-w-0">
            {kanji && (
              <span className="font-jp text-lg md:text-2xl text-vermillion-600 leading-none shrink-0">
                {kanji}
              </span>
            )}
            <div className="min-w-0">
              <h2 className="display-headline text-2xl sm:text-3xl md:text-5xl text-ink-900 leading-none truncate">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1 text-[10px] md:text-xs uppercase tracking-widest text-ink-700 line-clamp-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {rightLabel}
            <button
              onClick={() => scroll("l")}
              disabled={!canL}
              aria-label="Scroll left"
              className={cn(
                "hidden md:flex h-10 w-10 items-center justify-center border-2 border-ink-900 bg-cream transition",
                !canL && "opacity-30 cursor-not-allowed",
                canL && "hover:bg-ink-900 hover:text-cream"
              )}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => scroll("r")}
              disabled={!canR}
              aria-label="Scroll right"
              className={cn(
                "hidden md:flex h-10 w-10 items-center justify-center border-2 border-ink-900 bg-cream transition",
                !canR && "opacity-30 cursor-not-allowed",
                canR && "hover:bg-ink-900 hover:text-cream"
              )}
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      <div className="relative">
        <div
          ref={ref}
          className="scrollbar-none flex snap-x gap-5 overflow-x-auto px-4 md:px-8 pb-4"
        >
          {children}
        </div>
      </div>
    </section>
  );
}
