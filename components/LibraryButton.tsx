"use client";

import { useEffect, useState } from "react";
import { Plus, Check, ChevronDown } from "lucide-react";
import type { MediaItem, LibraryStatus } from "@/lib/types";
import { useLibrary } from "@/lib/store/library";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<LibraryStatus, string> = {
  reading: "Reading",
  plan: "Plan to Read",
  completed: "Completed",
  on_hold: "On Hold",
  dropped: "Dropped",
};

export function LibraryButton({ media }: { media: MediaItem }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const entries = useLibrary((s) => s.entries);
  const add = useLibrary((s) => s.add);
  const remove = useLibrary((s) => s.remove);
  const updateStatus = useLibrary((s) => s.updateStatus);

  useEffect(() => setMounted(true), []);

  const inLib = mounted ? Boolean(entries[media.id]) : false;
  const currentStatus = mounted ? entries[media.id]?.status : null;

  if (!mounted) {
    return (
      <button className="btn-ghost w-full" disabled>
        <Plus className="h-4 w-4" /> Add to Library
      </button>
    );
  }

  const handleAdd = (status: LibraryStatus) => {
    add({
      mediaId: media.id,
      type: media.type,
      title: media.title.english ?? media.title.romaji ?? media.title.display,
      cover: media.coverImage.large ?? media.coverImage.medium,
      status,
    });
    setOpen(false);
  };

  return (
    <div className="relative w-full">
      {!inLib ? (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="btn-ghost w-full"
        >
          <Plus className="h-4 w-4" /> Add to Library
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="btn-ink w-full"
        >
          <Check className="h-4 w-4" />
          {currentStatus ? STATUS_LABELS[currentStatus] : "In Library"}
          <ChevronDown className="h-3 w-3" />
        </button>
      )}

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 panel-border bg-cream">
          {(Object.keys(STATUS_LABELS) as LibraryStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                if (inLib) updateStatus(media.id, s);
                else handleAdd(s);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between px-4 py-3 text-left text-xs font-bold uppercase tracking-widest border-b border-ink-200 last:border-b-0 hover:bg-vermillion-50",
                currentStatus === s && "bg-vermillion-600 text-cream hover:bg-vermillion-700"
              )}
            >
              <span>{STATUS_LABELS[s]}</span>
              {currentStatus === s && <Check className="h-3 w-3" />}
            </button>
          ))}
          {inLib && (
            <button
              type="button"
              onClick={() => {
                remove(media.id);
                setOpen(false);
              }}
              className="block w-full border-t-2 border-ink-900 px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-vermillion-600 hover:bg-ink-900 hover:text-cream"
            >
              Remove from Library
            </button>
          )}
        </div>
      )}
    </div>
  );
}
