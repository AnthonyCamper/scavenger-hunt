/* Service worker — makes the app shell load with no signal at the lake.
   Bump CACHE_VERSION whenever you edit config.js or any asset, otherwise
   phones that already opened the link will keep the old clues. */
const CACHE_VERSION = "hunt-v2";

const SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./logic.js",
  "./config.js",
  "./manifest.json",
  "./vendor/leaflet.js",
  "./vendor/leaflet.css",
  "./vendor/confetti.min.js",
  "./vendor/fonts.css",
  "./vendor/fonts/barlow-700.woff2",
  "./vendor/fonts/barlow-900.woff2",
  "./vendor/fonts/lato-300.woff2",
  "./vendor/fonts/lato-400.woff2",
  "./vendor/fonts/playfair-display-400-italic.woff2",
  "./vendor/fonts/playfair-display-700.woff2",
  "./vendor/fonts/share-tech-mono-400.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      // addAll is all-or-nothing; cache entries individually so one missing
      // file can't leave the app with no offline support at all.
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Map tiles: network only, and never cached — they're huge and the map
  // degrades gracefully without them.
  if (url.hostname.includes("arcgisonline.com")) return;

  // App shell: cache first. At the lake, a cached hit beats a slow 3G round
  // trip every time; the service worker updates in the background on reload.
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && url.origin === self.location.origin) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
