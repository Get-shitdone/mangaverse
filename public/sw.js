// Mangaverse service worker — caches chapter page images so users can re-read
// chapters offline without hitting the network at all.
//
// Strategy:
//   - Only intercepts GETs to /api/proxy-image?url=<chapterPageUrl>
//   - Only caches URLs we've already marked `immutable` server-side (same
//     pattern detection as app/api/proxy-image/route.ts).
//   - Cache-first for chapter pages: cache hit returns instantly without ever
//     touching the network; cache miss fetches and stores.
//   - Soft-cap of 800 entries (~150 MB of manga at typical sizes); LRU-style
//     eviction by keys() insertion order when exceeded.
//   - Versioned cache name so future SW upgrades wipe the stale store cleanly.

const CACHE_NAME = "mangaverse-chapters-v1";
const SHELL_CACHE = "mangaverse-shell-v1";
const MAX_ENTRIES = 800;

// Routes worth keeping warm for offline app-shell availability.
const SHELL_URLS = [
  "/",
  "/library",
  "/notifications",
  "/offline",
];

self.addEventListener("install", (event) => {
  // Activate immediately on first install so users get offline support
  // without needing to refresh twice.
  self.skipWaiting();
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // Best-effort: pre-cache critical app-shell routes so /library still
      // opens when the user is offline. Failures are non-fatal.
      Promise.all(
        SHELL_URLS.map((url) =>
          fetch(url, { credentials: "same-origin" })
            .then((res) => (res.ok ? cache.put(url, res) : null))
            .catch(() => null)
        )
      )
    )
  );
});

self.addEventListener("activate", (event) => {
  const valid = new Set([CACHE_NAME, SHELL_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((n) => n.startsWith("mangaverse-") && !valid.has(n))
            .map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isChapterPageRequest(url) {
  if (url.pathname !== "/api/proxy-image") return false;
  const wrapped = url.searchParams.get("url");
  if (!wrapped) return false;
  let target;
  try {
    target = new URL(wrapped);
  } catch {
    return false;
  }
  // Mirror app/api/proxy-image/route.ts isImmutableContent() exactly.
  if (
    target.hostname.endsWith(".mangadex.network") ||
    target.hostname === "uploads.mangadex.org"
  ) {
    if (
      target.pathname.includes("/data/") ||
      target.pathname.includes("/data-saver/")
    ) {
      return true;
    }
  }
  if (target.hostname.endsWith(".comick.pictures")) return true;
  if (
    target.hostname.endsWith(".mangapill.com") &&
    target.pathname.startsWith("/chapters/")
  ) {
    return true;
  }
  if (
    target.hostname.endsWith(".mangakakalot.gg") &&
    /\/chapters?\//i.test(target.pathname)
  ) {
    return true;
  }
  if (
    /^img\d?\.mangapark\.(io|net)$/.test(target.hostname) &&
    /\/uploads?\//i.test(target.pathname)
  ) {
    return true;
  }
  return false;
}

async function evictIfNeeded(cache) {
  try {
    const keys = await cache.keys();
    if (keys.length <= MAX_ENTRIES) return;
    const overflow = keys.length - MAX_ENTRIES;
    // Drop oldest first (insertion order is preserved by Cache API).
    await Promise.all(keys.slice(0, overflow).map((req) => cache.delete(req)));
  } catch {
    // best-effort eviction; ignore failures
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  // Cache miss — go to network. We use the request as-is so the proxy can do
  // its referer-stripping work upstream, then store the response for next time.
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      // .clone() because Response bodies can only be read once.
      cache.put(request, response.clone()).catch(() => {});
      // Fire-and-forget eviction so the user doesn't wait for it.
      evictIfNeeded(cache);
    }
    return response;
  } catch (err) {
    // Network failed and we have no cache: surface a basic offline response so
    // the reader can render its own offline-state placeholder.
    return new Response(
      JSON.stringify({ error: "offline", message: "no cached copy" }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Network-first for navigation requests with an offline shell fallback. Lets
// users open /library, /, etc. when offline and still see the cached app shell.
async function navigationHandler(request) {
  try {
    const fresh = await fetch(request);
    // Snapshot the latest shell into cache for next-offline fallback.
    if (fresh.ok) {
      const shell = await caches.open(SHELL_CACHE);
      shell.put(request, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch {
    const shell = await caches.open(SHELL_CACHE);
    const cached = await shell.match(request);
    if (cached) return cached;
    const offline = await shell.match("/offline");
    if (offline) return offline;
    return new Response("Offline", { status: 503 });
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Chapter pages: cache-first, immutable.
  if (isChapterPageRequest(url)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // Navigation requests (top-level page loads): network-first with shell fallback.
  if (event.request.mode === "navigate") {
    event.respondWith(navigationHandler(event.request));
    return;
  }
});

// Allow the page to ask "how big is the cache?" or "wipe the cache".
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  if (data.type === "MANGAVERSE_CACHE_INFO") {
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        const keys = await cache.keys();
        event.source &&
          event.source.postMessage({
            type: "MANGAVERSE_CACHE_INFO_RESULT",
            entries: keys.length,
            max: MAX_ENTRIES,
          });
      })
    );
  } else if (data.type === "MANGAVERSE_CACHE_CLEAR") {
    event.waitUntil(
      caches.delete(CACHE_NAME).then((deleted) => {
        event.source &&
          event.source.postMessage({
            type: "MANGAVERSE_CACHE_CLEAR_RESULT",
            ok: deleted,
          });
      })
    );
  }
});
