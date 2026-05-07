"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLibrary } from "@/lib/store/library";
import { useProgress } from "@/lib/store/progress";
import { ChevronLeft, Download, Upload, Trash2, AlertTriangle, Check } from "lucide-react";

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

  useEffect(() => setMounted(true), []);

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
    setStatus({ type: "success", msg: `Exported ${Object.keys(entries).length} titles` });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as ExportPayload;

      if (data.schema !== "mangaverse-library-v1") {
        setStatus({ type: "error", msg: "Unrecognized file schema. Expected mangaverse-library-v1." });
        return;
      }

      // Merge: imported entries take priority for shared keys
      const merged = { ...entries, ...data.library };
      hydrate(merged);

      // Merge progress similarly using the store directly
      const progStore = useProgress.getState();
      Object.values(data.progress ?? {}).forEach((p) => progStore.setProgress(p));

      setStatus({
        type: "success",
        msg: `Imported ${Object.keys(data.library).length} titles + ${Object.keys(data.progress ?? {}).length} progress entries`,
      });
    } catch (err) {
      setStatus({ type: "error", msg: `Import failed: ${(err as Error).message}` });
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
    // Wipe progress by clearing each
    const progStore = useProgress.getState();
    Object.keys(progStore.progress).forEach((id) => progStore.clear(id));
    setStatus({ type: "success", msg: "Library and progress wiped" });
    setConfirmReset(false);
  };

  return (
    <div className="bg-cream min-h-screen pb-20">
      <header className="border-b-2 border-ink-900 bg-cream-100 halftone-bg">
        <div className="mx-auto max-w-[1600px] px-4 md:px-8 py-12">
          <Link
            href="/library"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-widest font-bold text-ink-700 hover:text-vermillion-600 mb-3"
          >
            <ChevronLeft className="h-3 w-3" /> Back to Library
          </Link>
          <p className="font-jp text-vermillion-600 text-lg mb-2">設定</p>
          <h1 className="display-headline text-5xl md:text-7xl text-ink-900">
            Library Settings
          </h1>
          <p className="mt-3 text-sm uppercase tracking-widest text-ink-700">
            Export, import, and manage your local data
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 md:px-8 mt-12 space-y-8">
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

        {/* Export */}
        <section className="panel-border bg-cream p-6 md:p-8">
          <h2 className="display-headline text-2xl md:text-3xl text-ink-900 mb-3 flex items-baseline gap-3">
            Export Library
            <span className="font-jp text-base text-vermillion-600">輸出</span>
          </h2>
          <p className="text-sm text-ink-700 mb-5">
            Download a JSON backup of your library, ratings, status, and reading
            progress. You can import it on another browser or device.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="ink-stamp">
              {mounted ? Object.keys(entries).length : 0} titles
            </span>
            <span className="ink-stamp">
              {mounted ? Object.keys(progress).length : 0} progress entries
            </span>
          </div>
          <button onClick={exportLibrary} className="btn-vermillion mt-5">
            <Download className="h-4 w-4" /> Export JSON
          </button>
        </section>

        {/* Import */}
        <section className="panel-border bg-cream p-6 md:p-8">
          <h2 className="display-headline text-2xl md:text-3xl text-ink-900 mb-3 flex items-baseline gap-3">
            Import Library
            <span className="font-jp text-base text-vermillion-600">輸入</span>
          </h2>
          <p className="text-sm text-ink-700 mb-5">
            Restore a previous backup. Import will merge with your current
            library, with the imported file taking precedence on conflicts.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            className="hidden"
            id="library-import"
          />
          <label
            htmlFor="library-import"
            className="btn-ghost cursor-pointer inline-flex"
          >
            <Upload className="h-4 w-4" /> Choose JSON file
          </label>
        </section>

        {/* Reset */}
        <section className="panel-border bg-vermillion-50 border-vermillion-600 p-6 md:p-8">
          <h2 className="display-headline text-2xl md:text-3xl text-vermillion-700 mb-3 flex items-baseline gap-3">
            Wipe Library
            <span className="font-jp text-base text-vermillion-600">削除</span>
          </h2>
          <p className="text-sm text-vermillion-800 mb-5">
            Clear your entire library and reading progress. This action cannot
            be undone — export a backup first if you want to keep a copy.
          </p>
          <button
            onClick={resetAll}
            className={`inline-flex items-center justify-center gap-2 border-2 px-5 py-3 text-sm font-bold uppercase tracking-widest transition-all ${
              confirmReset
                ? "border-vermillion-700 bg-vermillion-700 text-cream hover:bg-vermillion-800"
                : "border-vermillion-700 bg-cream text-vermillion-700 hover:bg-vermillion-100"
            }`}
          >
            <Trash2 className="h-4 w-4" />
            {confirmReset ? "Click again to confirm" : "Wipe everything"}
          </button>
        </section>
      </div>
    </div>
  );
}
