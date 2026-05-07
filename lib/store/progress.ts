"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ReadingProgress } from "@/lib/types";

// IMPORTANT: derived helpers (recent, byStatus, etc.) are NOT safe to use as
// Zustand selectors because they return new array/object references on every
// call. Always select raw state (e.g., useProgress((s) => s.progress)) and
// derive lists with useMemo at the call site. Helpers below are utility
// functions, not selectors.

interface ProgressState {
  progress: Record<string, ReadingProgress>;
  setProgress: (p: ReadingProgress) => void;
  clear: (mediaId: string) => void;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      progress: {},
      setProgress: (p) =>
        set((state) => ({
          progress: {
            ...state.progress,
            [p.mediaId]: { ...p, updatedAt: Date.now() },
          },
        })),
      clear: (mediaId) =>
        set((state) => {
          const next = { ...state.progress };
          delete next[mediaId];
          return { progress: next };
        }),
    }),
    { name: "mangaverse:progress:v1" }
  )
);

// Derive helpers — pass result of useProgress((s) => s.progress) into these.
export function recentProgress(
  progress: Record<string, ReadingProgress>,
  limit = 12
): ReadingProgress[] {
  return Object.values(progress)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, limit);
}
