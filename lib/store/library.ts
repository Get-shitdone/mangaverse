"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LibraryEntry, LibraryStatus, MediaType } from "@/lib/types";

interface LibraryState {
  entries: Record<string, LibraryEntry>;
  add: (entry: Omit<LibraryEntry, "addedAt" | "updatedAt">) => void;
  remove: (mediaId: string) => void;
  updateStatus: (mediaId: string, status: LibraryStatus) => void;
  rate: (mediaId: string, rating: number) => void;
  setNotes: (mediaId: string, notes: string) => void;
  has: (mediaId: string) => boolean;
  byStatus: (status: LibraryStatus) => LibraryEntry[];
  count: () => number;
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set, get) => ({
      entries: {},
      add: (entry) =>
        set((state) => ({
          entries: {
            ...state.entries,
            [entry.mediaId]: {
              ...entry,
              addedAt: state.entries[entry.mediaId]?.addedAt ?? Date.now(),
              updatedAt: Date.now(),
            },
          },
        })),
      remove: (mediaId) =>
        set((state) => {
          const next = { ...state.entries };
          delete next[mediaId];
          return { entries: next };
        }),
      updateStatus: (mediaId, status) =>
        set((state) => {
          const existing = state.entries[mediaId];
          if (!existing) return state;
          return {
            entries: {
              ...state.entries,
              [mediaId]: { ...existing, status, updatedAt: Date.now() },
            },
          };
        }),
      rate: (mediaId, rating) =>
        set((state) => {
          const existing = state.entries[mediaId];
          if (!existing) return state;
          return {
            entries: {
              ...state.entries,
              [mediaId]: { ...existing, rating, updatedAt: Date.now() },
            },
          };
        }),
      setNotes: (mediaId, notes) =>
        set((state) => {
          const existing = state.entries[mediaId];
          if (!existing) return state;
          return {
            entries: {
              ...state.entries,
              [mediaId]: { ...existing, notes, updatedAt: Date.now() },
            },
          };
        }),
      has: (mediaId) => Boolean(get().entries[mediaId]),
      byStatus: (status) => Object.values(get().entries).filter((e) => e.status === status),
      count: () => Object.keys(get().entries).length,
    }),
    {
      name: "mangaverse:library:v1",
    }
  )
);
