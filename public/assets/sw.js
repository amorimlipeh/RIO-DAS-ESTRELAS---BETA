const CACHE_NAME = "rio-das-estrelas-v1";
const URLS = ["/", "/style.css", "/app.js", "/manifest.json", "/assets/img/logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS)));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
