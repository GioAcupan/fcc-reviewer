// C Hero service worker.
// The build stamps VERSION and PRECACHE (see vite.config.ts), so every deploy gets its own cache:
// the whole app is cached on install, older deploys' caches are deleted on activate,
// pages are network-first (online = always newest) with the latest app shell as the offline fallback.
const VERSION = /*__VERSION__*/'dev';
const PRECACHE = /*__PRECACHE__*/[];
const CACHE = 'chero-' + VERSION;
const SHELL = '/';
const CORE = [SHELL, '/manifest.webmanifest', '/icon.svg', '/icon-192.png', '/icon-512.png'];
const LOOKUP = { ignoreVary: true };

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    // one by one: a single missing file must not block offline support for everything else
    await Promise.all([...new Set([...CORE, ...PRECACHE])].map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) (await caches.open(CACHE)).put(SHELL, res.clone()); // keep the offline shell current
        return res;
      } catch {
        return (await caches.match(SHELL, LOOKUP)) || Response.error();
      }
    })());
    return;
  }

  // hashed assets, icons, manifest: cache-first, then network (remembering new assets)
  e.respondWith((async () => {
    const hit = await caches.match(req, LOOKUP);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok && url.pathname.startsWith('/assets/')) (await caches.open(CACHE)).put(req, res.clone());
    return res;
  })());
});
