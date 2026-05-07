"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Chrome/Edge fire `beforeinstallprompt`; we capture and re-fire on click.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "mangaverse:install-dismissed";
const DISMISS_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari uses navigator.standalone
    // @ts-expect-error iOS-specific property
    Boolean(window.navigator.standalone)
  );
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
}

function wasDismissedRecently(): boolean {
  if (typeof window === "undefined") return true;
  const ts = window.localStorage.getItem(DISMISS_KEY);
  if (!ts) return false;
  const n = parseInt(ts, 10);
  if (Number.isNaN(n)) return false;
  return Date.now() - n < DISMISS_TTL_MS;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosCard, setShowIosCard] = useState(false);
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    if (wasDismissedRecently()) return;

    const onBefore = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setOpen(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setOpen(false);
    };
    window.addEventListener("beforeinstallprompt", onBefore as EventListener);
    window.addEventListener("appinstalled", onInstalled);

    // iOS doesn't fire beforeinstallprompt — show our manual instructions card
    // after a short delay so it doesn't blast on first paint.
    if (isIOS()) {
      const t = window.setTimeout(() => {
        setShowIosCard(true);
        setOpen(true);
      }, 4000);
      return () => {
        window.clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBefore as EventListener);
        window.removeEventListener("appinstalled", onInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBefore as EventListener);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }
    setOpen(false);
  };

  const triggerInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setOpen(false);
      } else {
        dismiss();
      }
    } catch {
      dismiss();
    } finally {
      setDeferred(null);
    }
  };

  if (installed) return null;
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Install Mangaverse"
      className={cn(
        "fixed left-1/2 -translate-x-1/2 z-50 w-[min(420px,calc(100vw-1.5rem))]",
        "bottom-4 sm:bottom-6"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="panel-border bg-cream relative overflow-hidden">
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center text-ink-700 hover:text-vermillion-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="halftone-bg absolute inset-0 opacity-30 pointer-events-none" />

        <div className="relative p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="shrink-0 flex h-12 w-12 items-center justify-center border-2 border-ink-900 bg-vermillion-600">
              <span className="display-headline text-2xl text-cream leading-none">M</span>
            </div>
            <div className="min-w-0">
              <p className="font-jp text-vermillion-600 text-xs mb-0.5">アプリを追加</p>
              <h3 className="display-headline text-2xl text-ink-900 leading-tight">
                Install Mangaverse
              </h3>
              <p className="text-xs text-ink-700 mt-1">
                Get the app on your home screen for full-screen reading and
                offline chapters.
              </p>
            </div>
          </div>

          {showIosCard ? (
            <div className="mt-3 space-y-2 text-xs text-ink-800">
              <div className="flex items-center gap-3 border-2 border-ink-200 bg-cream-100 px-3 py-2">
                <Share className="h-4 w-4 shrink-0 text-vermillion-600" />
                <p>
                  Tap <strong>Share</strong> at the bottom of Safari
                </p>
              </div>
              <div className="flex items-center gap-3 border-2 border-ink-200 bg-cream-100 px-3 py-2">
                <Plus className="h-4 w-4 shrink-0 text-vermillion-600" />
                <p>
                  Choose <strong>Add to Home Screen</strong>
                </p>
              </div>
              <button onClick={dismiss} className="btn-ghost w-full mt-3 text-xs">
                Got it
              </button>
            </div>
          ) : (
            <div className="mt-3 flex gap-2">
              <button onClick={triggerInstall} className="btn-vermillion flex-1 justify-center">
                <Download className="h-4 w-4" /> Install App
              </button>
              <button onClick={dismiss} className="btn-ghost px-4">
                Later
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
