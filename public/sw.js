// Lets EVIE open with no signal. Pages: network first, cached copy offline.
// Hashed /assets/ files never change, so they're served from the cache once seen.
// ponytail: assets are cached as they're fetched, so the app works offline from the second
// launch on; precache a build manifest if it must work offline straight after first install.
const CACHE = 'evie-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function cacheCopy(key, res) {
  if (res.ok) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(key, copy));
  }
  return res;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((res) => cacheCopy('/', res)).catch(() => caches.match('/')));
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((res) => cacheCopy(request, res))));
  }
});
