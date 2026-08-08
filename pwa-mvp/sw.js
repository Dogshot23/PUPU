// PUPU MVP -- minimal service worker. Its only job is to satisfy PWA
// installability and let the app open offline.
//
// Fetch strategy is network-first, falling back to cache only when the
// network request fails (i.e. actually offline). This used to be
// cache-first, which meant a browser that already had this service
// worker installed would keep serving whatever was cached at install
// time indefinitely -- edits to app.js/index.html/style.css never
// reached an already-open browser, only a fresh install (e.g.
// Incognito) that had no prior cache to fall back on. Network-first
// fixes that going forward: whenever you're online, you always get
// whatever the server has right now, and the cache is refreshed with
// each successful fetch so offline fallback stays reasonably current
// too. CACHE_NAME still exists so activate() can drop old cache
// generations; it no longer needs to be bumped just to see an edit.
const CACHE_NAME = "pupu-mvp-v8-debug";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./cards.json",
  "./missions.json",
  "./manifest.json",
  "./icon.png",
  "./sounds/squish/squish1.wav",
  "./sounds/squish/squish2.wav",
  "./sounds/squish/squish3.wav",
  "./sounds/bubbles/bubbles1.wav",
  "./sounds/bubbles/bubbles2.wav",
  "./sounds/bubbles/bubbles3.wav",
  "./sounds/wobble/wobble1.wav",
  "./sounds/pupu/pupu1.wav",
  "./sounds/pupu/pupu2.wav",
  "./sounds/droplet/droplet1.wav",
  "./sounds/chatter/chatter1.wav",
  "./sounds/chatter/chatter2.wav",
  "./sounds/chatter/chatter3.wav",
  "./sounds/chatter/chatter4.wav",
  "./sounds/chatter/chatter5.wav",
  "./sounds/chatter/chatter6.wav",
  "./sounds/chatter/chatter7.wav",
  "./images/pupu/body/body.png",
  "./images/pupu/body/body_left_arm.png",
  "./images/pupu/body/body_right_arm.png",
  "./images/pupu/eyes/eyes_open.png",
  "./images/pupu/eyes/eyes_closed.png",
  "./images/pupu/mouths/mouth_neutral.png",
  "./images/pupu/mouths/mouth_smile.png",
  "./images/pupu/mouths/mouth_blow.png",
  "./images/pupu/mouths/mouth_oh.png",
  "./images/pupu/mouths/mouth_wide.png",
  "./images/pupu/buttons/button_unpressed.png",
  "./images/pupu/buttons/button_pressed.png",
  "./images/pupu/effects/effect_shadow.png",
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
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
