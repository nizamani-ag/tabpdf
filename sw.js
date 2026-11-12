/* Minimal service worker so the localhost app can be installed as a PWA.
   It does not cache app files; requests go to the local server as usual. */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // No respondWith(): the browser handles requests normally.
});
