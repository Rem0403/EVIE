// Lets EVIE open with no signal. Pages: network first, cached copy offline.
// Hashed /assets/ files never change, so they're served from the cache once seen.
// ponytail: assets are cached as they're fetched, so the app works offline from the second
// launch on; precache a build manifest if it must work offline straight after first install.
const CACHE = 'evie-v2'; // bumped to drop any HTML cached as an asset by v1

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Only keeps what was asked for. Hosting answers a missing file (an old asset after an update)
// with index.html, and caching that under the asset's name would break the app for good.
function cacheCopy(key, res, html) {
  const isHtml = (res.headers.get('content-type') || '').includes('text/html');
  if (res.ok && isHtml === html) {
    const copy = res.clone();
    caches.open(CACHE).then((c) => c.put(key, copy));
  }
  return res;
}

// A weak signal can leave a request hanging for minutes on a blank screen, so after this long
// the saved copy opens instead (the network copy is still saved for next time).
const SLOW_MS = 4000;

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/__/')) return; // Firebase's own pages (Google sign-in), never the app shell

  if (request.mode === 'navigate') {
    const network = fetch(request).then((res) => cacheCopy('/', res, true));
    const slow = new Promise((done) => setTimeout(done, SLOW_MS)).then(() => caches.match('/'));
    event.respondWith(
      Promise.race([network, slow.then((saved) => saved || network)]).catch(() => caches.match('/')),
    );
  } else if (url.pathname.startsWith('/assets/')) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request).then((res) => cacheCopy(request, res, false))));
  }
});
