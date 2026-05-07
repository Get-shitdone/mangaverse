"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ReadingProgress } from "@/lib/types";

interface ProgressState {
  progress: Record<string, ReadingProgress>;
  setProgress: (p: ReadingProgress) => void;
  get: (mediaId: string) => ReadingProgress | undefined;
  recent: (limit?: number) => ReadingProgress[];
  clear: (mediaId: string) => void;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      progress: {},
      setProgress: (p) =>
        set((state) => ({
          progress: {
            ...state.progress,
            [p.mediaId]: { ...p, updatedAt: Date.now() },
          },
        })),
      get: (mediaId) => get().progress[mediaId],
      recent: (limit = 12) =>
        Object.values(get().progress)
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, limit),
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
