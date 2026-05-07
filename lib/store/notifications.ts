"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChapterUpdate } from "@/lib/types";

interface NotificationsState {
  // Per-title last-seen chapter publish time. Anything newer than this is "new".
  lastSeen: Record<string, number>; // mediaId -> epoch ms
  // Cached list of currently-unread updates (refreshed by the poller).
  updates: ChapterUpdate[];
  // The last time we successfully polled MangaDex.
  lastPolledAt: number;

  // Replace the cached updates payload (called by NotificationBell).
  setUpdates: (updates: ChapterUpdate[]) => void;
  // Mark a specific media as caught up — clears its updates and bumps lastSeen.
  markRead: (mediaId: string, timestamp?: number) => void;
  // Mark all visible updates as read.
  markAllRead: () => void;
  setPolledAt: (t: number) => void;
}

export const useNotifications = create<NotificationsState>()(
  persist(
    (set, get) => ({
      lastSeen: {},
      updates: [],
      lastPolledAt: 0,
      setUpdates: (updates) => set({ updates }),
      markRead: (mediaId, timestamp) =>
        set((state) => {
          const ts = timestamp ?? Date.now();
          return {
            lastSeen: { ...state.lastSeen, [mediaId]: ts },
            updates: state.updates.filter((u) => u.mediaId !== mediaId),
          };
        }),
      markAllRead: () =>
        set((state) => {
          const now = Date.now();
          const next = { ...state.lastSeen };
          for (const u of state.updates) {
            const t = new Date(u.publishedAt).getTime();
            next[u.mediaId] = Math.max(next[u.mediaId] ?? 0, t || now);
          }
          return { lastSeen: next, updates: [] };
        }),
      setPolledAt: (lastPolledAt) => set({ lastPolledAt }),
    }),
    { name: "mangaverse:notifications:v1" }
  )
);
