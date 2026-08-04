// PUPU MVP -- minimal cache-first service worker. Its only job is to
// satisfy PWA installability and let the app open offline; it has no
// opinion about content freshness beyond bumping CACHE_NAME.

const CACHE_NAME = "pupu-mvp-v4";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./cards.json",
  "./manifest.json",
  "./icon.png",
  "./sounds/squish/squish1.wav",
  "./sounds/squish/squish2.wav",
  "./sounds/squish/squish3.wav",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
