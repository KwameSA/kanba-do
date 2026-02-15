const CACHE_NAME = "kanbado-core-v5";
const CORE_ASSETS = [
  "./",
  "index.html",
  "assets/css/main.css",
  "js/main.js",
  "js/tasks.js",
  "js/storage.js",
  "js/board-events.js",
  "js/board-aside.js",
  "js/task-model.js",
  "js/page-common.js",
  "js/dictionary.js",
  "js/pwa.js",
  "js/activity-metrics.js",
  "js/time-buckets.js",
  "js/rhythm-insight.js",
  "js/rhythm-page.js",
  "js/metrics.js",
  "pages/settings.html",
  "pages/analytics.html",
  "pages/rhythm.html",
  "pages/import-export.html",
  "pages/notifications.html",
  "pages/faqs.html",
  "assets/images/favicon-32x32.png",
  "images/checked.png",
  "images/unchecked.png",
  "images/notes.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
          return Promise.resolve();
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const destination = event.request.destination;
  const isHtml =
    event.request.mode === "navigate" || (event.request.headers.get("accept") || "").includes("text/html");
  const isCriticalAsset =
    isHtml || destination === "style" || destination === "script" || url.pathname.endsWith(".css") || url.pathname.endsWith(".js");

  event.respondWith(
    (isCriticalAsset
      ? fetch(event.request)
          .then((response) => {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
            return response;
          })
          .catch(() => caches.match(event.request))
      : caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
            return response;
          });
        })
    ).catch(() => caches.match("index.html"))
  );
});
