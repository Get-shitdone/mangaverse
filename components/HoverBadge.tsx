"use client";

import { useMemo } from "react";

const BADGES = ["BAM!", "POW!", "WHAM!", "ZAP!", "BOOM!", "WOOSH!", "KAPOW!", "SLASH!", "SNAP!"];
const COLORS = [
  { bg: "bg-vermillion-600", text: "text-cream" },
  { bg: "bg-gold-500", text: "text-ink-900" },
  { bg: "bg-ink-900", text: "text-gold-500" },
  { bg: "bg-cream", text: "text-vermillion-600" },
  { bg: "bg-accent-mint", text: "text-ink-900" },
];

export function HoverBadge({ seed }: { seed: string }) {
  const { word, palette, rotation } = useMemo(() => {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const wIdx = h % BADGES.length;
    const pIdx = (h >>> 4) % COLORS.length;
    const rRaw = (h >>> 8) % 21; // 0..20
    return {
      word: BADGES[wIdx],
      palette: COLORS[pIdx],
      rotation: rRaw - 10, // -10 to +10 deg
    };
  }, [seed]);

  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute -top-2 -right-2 z-20 hidden md:block opacity-0 group-hover:opacity-100 transition-all duration-200 ${palette.bg} ${palette.text} px-2 py-1 border-2 border-ink-900 shadow-panel-sm font-display text-xs tracking-tight uppercase`}
      style={{
        transform: `rotate(${rotation}deg) scale(0.8)`,
        animation: "panel-pop 0.2s ease-out forwards",
      }}
    >
      {word}
    </span>
  );
}
