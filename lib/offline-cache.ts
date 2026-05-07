"use client";

// Helpers for talking to the service worker about its chapter-page cache.
// All ops are no-ops on browsers without service worker support, so callers
// can use them unconditionally.

interface CacheInfo {
  entries: number;
  max: number;
}

function getController(): ServiceWorker | null {
  if (typeof navigator === "undefined") return null;
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.controller;
}

export async function getOfflineCacheInfo(): Promise<CacheInfo | null> {
  const controller = getController();
  if (!controller) return null;
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => resolve(null), 1500);
    channel.port1.onmessage = (e) => {
      window.clearTimeout(timer);
      if (e.data?.type === "MANGAVERSE_CACHE_INFO_RESULT") {
        resolve({ entries: e.data.entries, max: e.data.max });
      } else {
        resolve(null);
      }
    };
    controller.postMessage({ type: "MANGAVERSE_CACHE_INFO" }, [channel.port2]);
    // Some browsers don't pipe responses through MessageChannel for SW
    // messages; fall back to a global listener as a safety net.
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "MANGAVERSE_CACHE_INFO_RESULT") {
        window.clearTimeout(timer);
        navigator.serviceWorker.removeEventListener("message", onMsg);
        resolve({ entries: e.data.entries, max: e.data.max });
      }
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
  });
}

export async function clearOfflineCache(): Promise<boolean> {
  const controller = getController();
  if (!controller) return false;
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => resolve(false), 2000);
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "MANGAVERSE_CACHE_CLEAR_RESULT") {
        window.clearTimeout(timer);
        navigator.serviceWorker.removeEventListener("message", onMsg);
        resolve(Boolean(e.data.ok));
      }
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    controller.postMessage({ type: "MANGAVERSE_CACHE_CLEAR" }, [channel.port2]);
  });
}
