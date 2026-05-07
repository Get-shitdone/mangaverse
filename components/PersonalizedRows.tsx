"use client";

import { useEffect, useMemo, useState } from "react";
import { useLibrary } from "@/lib/store/library";
import { topAnchorTitles } from "@/lib/recommend";
import { SectionRow } from "./SectionRow";
import { CoverCard } from "./CoverCard";
import type { MediaItem } from "@/lib/types";
import { Heart } from "lucide-react";

// Renders "Because you read X" rows on home when user has 2+ library entries.
export function PersonalizedRows() {
  const entries = useLibrary((s) => s.entries);
  const [mounted, setMounted] = useState(false);
  const [recsByAnchor, setRecsByAnchor] = useState<Record<string, MediaItem[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  const anchors = useMemo(() => {
    if (!mounted) return [];
    return topAnchorTitles(entries, 2);
  }, [entries, mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (anchors.length === 0) return;

    let cancelled = false;
    setLoading(true);
    const need = anchors.filter((a) => !recsByAnchor[a.mediaId]);
    if (need.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all(
      need.map(async (a) => {
        const aniId = a.mediaId.split(":")[1];
        try {
          const res = await fetch(`/api/recs?id=${aniId}`);
          if (!res.ok) return [a.mediaId, [] as MediaItem[]] as const;
          const data = await res.json();
          return [a.mediaId, data.results ?? []] as const;
        } catch {
          return [a.mediaId, [] as MediaItem[]] as const;
        }
      })
    ).then((pairs) => {
      if (cancelled) return;
      setRecsByAnchor((prev) => {
        const out = { ...prev };
        for (const [k, v] of pairs) out[k] = v;
        return out;
      });
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [mounted, anchors, recsByAnchor]);

  if (!mounted) return null;
  if (anchors.length === 0) return null;

  return (
    <>
      {anchors.map((anchor) => {
        const recs = recsByAnchor[anchor.mediaId];
        if (!recs || recs.length === 0) return null;
        return (
          <SectionRow
            key={anchor.mediaId}
            title={`Because you read ${anchor.title}`}
            subtitle="Hand-picked from your taste profile"
            kanji="あなたへ"
            rightLabel={<Heart className="h-4 w-4 text-vermillion-600 fill-vermillion-600" />}
          >
            {recs.map((m) => (
              <div key={m.id} className="snap-start">
                <CoverCard media={m} />
              </div>
            ))}
          </SectionRow>
        );
      })}
    </>
  );
}
