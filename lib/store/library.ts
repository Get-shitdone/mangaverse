"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LibraryEntry, LibraryStatus } from "@/lib/types";

// IMPORTANT: derived helpers (byStatus, count, etc.) are NOT safe to use as
// Zustand selectors because they return new arrays on every call. Always
// select raw `entries` and derive lists with useMemo at the call site.

interface LibraryState {
  entries: Record<string, LibraryEntry>;
  add: (entry: Omit<LibraryEntry, "addedAt" | "updatedAt">) => void;
  remove: (mediaId: string) => void;
  updateStatus: (mediaId: string, status: LibraryStatus) => void;
  rate: (mediaId: string, rating: number) => void;
  setNotes: (mediaId: string, notes: string) => void;
  hydrate: (entries: Record<string, LibraryEntry>) => void;
}

export const useLibrary = create<LibraryState>()(
  persist(
    (set) => ({
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
      hydrate: (entries) => set({ entries }),
    }),
    {
      name: "mangaverse:library:v1",
    }
  )
);

// Derived helpers — call with the result of useLibrary((s) => s.entries).
export function libraryByStatus(
  entries: Record<string, LibraryEntry>,
  status: LibraryStatus
): LibraryEntry[] {
  return Object.values(entries).filter((e) => e.status === status);
}

export function libraryCount(entries: Record<string, LibraryEntry>): number {
  return Object.keys(entries).length;
}
