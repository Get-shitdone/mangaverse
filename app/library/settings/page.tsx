"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLibrary } from "@/lib/store/library";
import { useProgress } from "@/lib/store/progress";
import { ChevronLeft, Download, Upload, Trash2, Check, AlertTriangle, WifiOff } from "lucide-react";
import { getOfflineCacheInfo, clearOfflineCache } from "@/lib/offline-cache";
import { cn } from "@/lib/utils";

interface ExportPayload {
  schema: "mangaverse-library-v1";
  exportedAt: string;
  library: ReturnType<typeof useLibrary.getState>["entries"];
  progress: ReturnType<typeof useProgress.getState>["progress"];
}

export default function SettingsPage() {
  const entries = useLibrary((s) => s.entries);
  const hydrate = useLibrary((s) => s.hydrate);
  const progress = useProgress((s) => s.progress);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<{ entries: number; max: number } | null>(null);
  const [confirmClearCache, setConfirmClearCache] = useState(false);

  useEffect(() => setMounted(true), []);

  // Poll the SW for cache stats on mount so we can show "X of 800 pages cached".
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    const refresh = async () => {
      const info = await getOfflineCacheInfo();
      if (!cancelled) setCacheInfo(info);
    };
    refresh();
    const interval = window.setInterval(refresh, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [mounted]);

  const exportLibrary = () => {
    const payload: ExportPayload = {
      schema: "mangaverse-library-v1",
      exportedAt: new Date().toISOString(),
      library: entries,
      progress,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mangaverse-library-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus({ type: "success", msg: `Saved ${Object.keys(entries).length} titles to file` });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportPayload;

      if (data.schema !== "mangaverse-library-v1") {
        setStatus({ type: "error", msg: "That doesn't look like a Mangaverse backup file." });
        return;
      }

      const merged = { ...entries, ...data.library };
      hydrate(merged);

      const progStore = useProgress.getState();
      Object.values(data.progress ?? {}).forEach((p) => progStore.setProgress(p));

      setStatus({
        type: "success",
        msg: `Restored ${Object.keys(data.library).length} titles`,
      });
    } catch (err) {
      setStatus({ type: "error", msg: "Couldn't read that file. Make sure it's a valid backup." });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetAll = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      window.setTimeout(() => setConfirmReset(false), 5000);
      return;
    }
    hydrate({});
    const progStore = useProgress.getState();
    Object.keys(progStore.progress).forEach((id) => progStore.clear(id));
    setStatus({ type: "success", msg: "Library cleared" });
    setConfirmReset(false);
  };

  return (
    <div className="bg-cream min-h-screen pb-20">
      <header className="border-b-2 border-ink-900 bg-cream-100 halftone-bg">
        <div className="mx-auto max-w-[1600px] px-4 md:px-8 py-8 md:py-12">
          <Link
            href="/library"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-widest font-bold text-ink-700 hover:text-vermillion-600 mb-3"
          >
            <ChevronLeft className="h-3 w-3" /> Back to Library
          </Link>
          <p className="font-jp text-vermillion-600 text-lg mb-2">設定</p>
          <h1 className="display-headline text-4xl sm:text-5xl md:text-7xl text-ink-900">
            Library Settings
          </h1>
          <p className="mt-3 text-sm uppercase tracking-widest text-ink-700">
            Back up or clear your reading list
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 md:px-8 mt-12 space-y-6">
        {status && (
          <div
            className={`panel-border-sm flex items-center gap-3 p-4 ${
              status.type === "success"
                ? "bg-accent-mint/30 text-ink-900"
                : "bg-vermillion-50 text-vermillion-700 border-vermillion-600"
            }`}
          >
            {status.type === "success" ? (
              <Check className="h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0" />
            )}
            <p className="text-sm font-bold">{status.msg}</p>
          </div>
        )}

        {/* Backup */}
        <section className="panel-border bg-cream p-6 md:p-8">
          <h2 className="display-headline text-2xl md:text-3xl text-ink-900 mb-2">
            Back up
          </h2>
          <p className="text-sm text-ink-700 mb-5">
            {mounted
              ? `Save a copy of your ${Object.keys(entries).length} title${
                  Object.keys(entries).length === 1 ? "" : "s"
                } and reading progress to a file you can restore later or share between devices.`
              : "Save a copy of your library to a file."}
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={exportLibrary} className="btn-vermillion">
              <Download className="h-4 w-4" /> Save backup
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImport}
              className="hidden"
              id="library-import"
            />
            <label htmlFor="library-import" className="btn-ghost cursor-pointer inline-flex">
              <Upload className="h-4 w-4" /> Restore backup
            </label>
          </div>
        </section>

        {/* Offline cache */}
        <section className="panel-border bg-cream p-6 md:p-8">
          <h2 className="display-headline text-2xl md:text-3xl text-ink-900 mb-2 flex items-center gap-3">
            Offline reading
            <WifiOff className="h-5 w-5 text-vermillion-600" />
          </h2>
          <p className="text-sm text-ink-700 mb-5">
            {mounted && cacheInfo
              ? `${cacheInfo.entries} of ${cacheInfo.max} chapter pages saved on this device. Reading a chapter caches it automatically — flip back to it anytime, even offline.`
              : "Pages you read are saved on your device automatically so you can re-read them with no internet. The cache fills as you read."}
          </p>
          <button
            onClick={async () => {
              if (!confirmClearCache) {
                setConfirmClearCache(true);
                window.setTimeout(() => setConfirmClearCache(false), 5000);
                return;
              }
              const ok = await clearOfflineCache();
              setStatus({
                type: ok ? "success" : "error",
                msg: ok ? "Offline cache cleared" : "Couldn't clear cache (browser may not support it)",
              });
              setConfirmClearCache(false);
              setCacheInfo({ entries: 0, max: cacheInfo?.max ?? 800 });
            }}
            className={cn(
              "inline-flex items-center justify-center gap-2 border-2 px-5 py-3 text-sm font-bold uppercase tracking-widest transition-all",
              confirmClearCache
                ? "border-vermillion-700 bg-vermillion-700 text-cream hover:bg-vermillion-800"
                : "border-ink-900 bg-cream text-ink-900 hover:bg-ink-900 hover:text-cream"
            )}
          >
            <Trash2 className="h-4 w-4" />
            {confirmClearCache ? "Click again to confirm" : "Clear offline cache"}
          </button>
          {mounted && !cacheInfo && (
            <p className="text-[11px] text-ink-500 mt-3">
              Offline cache is unavailable in this browser.
            </p>
          )}
        </section>

        {/* Clear */}
        <section className="panel-border bg-cream p-6 md:p-8">
          <h2 className="display-headline text-2xl md:text-3xl text-ink-900 mb-2">
            Clear library
          </h2>
          <p className="text-sm text-ink-700 mb-5">
            Remove all titles and reading progress. This can&apos;t be undone — make a
            backup first if you want to keep your list.
          </p>
          <button
            onClick={resetAll}
            className={`inline-flex items-center justify-center gap-2 border-2 px-5 py-3 text-sm font-bold uppercase tracking-widest transition-all ${
              confirmReset
                ? "border-vermillion-700 bg-vermillion-700 text-cream hover:bg-vermillion-800"
                : "border-ink-900 bg-cream text-ink-900 hover:bg-vermillion-600 hover:border-vermillion-600 hover:text-cream"
            }`}
          >
            <Trash2 className="h-4 w-4" />
            {confirmReset ? "Click again to confirm" : "Clear library"}
          </button>
        </section>
      </div>
    </div>
  );
}
