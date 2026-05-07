"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useLibrary } from "@/lib/store/library";
import { useNotifications } from "@/lib/store/notifications";
import { cn } from "@/lib/utils";
import type { ChapterUpdate } from "@/lib/types";

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 min when active
const MIN_GAP_MS = 90 * 1000; // back-off floor between polls

export function NotificationBell() {
  const entries = useLibrary((s) => s.entries);
  const updates = useNotifications((s) => s.updates);
  const lastSeen = useNotifications((s) => s.lastSeen);
  const lastPolledAt = useNotifications((s) => s.lastPolledAt);
  const setUpdates = useNotifications((s) => s.setUpdates);
  const setPolledAt = useNotifications((s) => s.setPolledAt);
  const inFlightRef = useRef(false);

  const libraryEntries = useMemo(() => Object.values(entries), [entries]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (libraryEntries.length === 0) return;

    const poll = async () => {
      if (inFlightRef.current) return;
      if (document.visibilityState !== "visible") return;
      // Throttle aggressive re-renders
      if (Date.now() - lastPolledAt < MIN_GAP_MS) return;

      inFlightRef.current = true;
      try {
        const payload = libraryEntries
          .filter((e) => e.status !== "dropped")
          .slice(0, 40)
          .map((e) => ({
            mediaId: e.mediaId,
            title: e.title,
            cover: e.cover,
            mangadexId: e.mangadexId ?? null,
            lastSeen: lastSeen[e.mediaId] ?? e.addedAt,
          }));

        const res = await fetch("/api/chapters/updates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: payload }),
        });
        if (!res.ok) return;
        const data = await res.json();
        const fresh: ChapterUpdate[] = (data.updates ?? []).filter((u: ChapterUpdate) => {
          const t = new Date(u.publishedAt).getTime();
          return t > (lastSeen[u.mediaId] ?? 0);
        });
        setUpdates(fresh);
        setPolledAt(Date.now());
      } catch {
        // ignore — try again next interval
      } finally {
        inFlightRef.current = false;
      }
    };

    // Run immediately on mount, then every POLL_INTERVAL_MS while tab is visible.
    poll();
    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryEntries.length]);

  const count = updates.length;

  return (
    <Link
      href="/notifications"
      aria-label={count > 0 ? `${count} new chapters` : "Notifications"}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-2 border-ink-900 bg-cream transition-all",
        count > 0
          ? "hover:bg-vermillion-600 hover:text-cream"
          : "hover:bg-ink-900 hover:text-cream"
      )}
    >
      <Bell className={cn("h-4 w-4", count > 0 && "fill-current")} strokeWidth={2.5} />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 min-w-[20px] items-center justify-center border-2 border-ink-900 bg-vermillion-600 px-1 text-[10px] font-bold leading-none text-cream tabular-nums">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
