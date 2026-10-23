const BUILD = "__BUILD__";
const CACHE = "euzen-shell-" + BUILD;
const ASSETS = __ASSETS__;
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        await cache.addAll(ASSETS);
      } catch (error) {
        await caches.delete(CACHE);
        throw error;
      }
    })(),
  );
});
// No skipWaiting or clients.claim: activation only after ALL old clients close.
// Keep older shells: a still-open page must never lose its version's lazy assets.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin)
    return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      caches
        .open(CACHE)
        .then((c) => c.match("/index.html"))
        .then((r) => r || fetch(event.request)),
    );
  } else if (ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches
        .open(CACHE)
        .then((c) => c.match(url.pathname))
        .then((r) => r || fetch(event.request)),
    );
  }
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "STATUS")
    event.ports[0]?.postMessage({ build: BUILD, ready: true });
});
