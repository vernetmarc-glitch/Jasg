// JASG : garde la journée sous la main, même sans réseau.
const CACHE = 'jasg-v1';
const PAGES = ['./', 'index.html', 'corps-libres.html', 'pop-corn.html', 'manifest.webmanifest',
  'icones/icone-192.png', 'icones/icone-512.png', 'icones/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PAGES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const memeSite = url.origin === location.origin;
  const polices = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!memeSite && !polices) return;
  if (req.mode === 'navigate') {
    // les pages : le réseau d'abord (toujours à jour), la mémoire si on est hors ligne
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)); return r; })
      .catch(() => caches.match(req).then(r => r || caches.match('./'))));
    return;
  }
  // le reste (icônes, polices) : la mémoire d'abord
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const c = res.clone(); caches.open(CACHE).then(k => k.put(req, c)); }
    return res;
  })));
});
