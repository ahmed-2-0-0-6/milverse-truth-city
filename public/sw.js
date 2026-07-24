// MILVERSE Offline Service Worker for Classroom & School Kit Pilot
// Strategy: pre-cache critical shell pages; stale-while-revalidate for
// Vite-built hashed assets (JS/CSS); network-first for API/server fns.
const CACHE_NAME = "milverse-v2";
const OFFLINE_URLS = [
  "/",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/charter",
  "/first-phone",
  "/educators",
  "/quick-tour",
  "/profile",
  "/manual",
  "/drop",
  "/mirror",
  "/feed",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip server function calls and API routes — always network.
  if (url.pathname.startsWith("/api/") || url.pathname.includes(".functions")) {
    return;
  }

  // Vite-hashed assets (JS/CSS/fonts with content hashes) — cache-first,
  // they're immutable once deployed. Matches paths like /assets/abc123.js
  if (url.pathname.startsWith("/assets/") && /\.[a-f0-9]{8,}\./i.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else — stale-while-revalidate: serve cache, update in bg.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networked = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const cacheCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networked;
    })
  );
});
