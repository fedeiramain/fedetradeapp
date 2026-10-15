// Service worker del Screener Cripto.
// - La página se busca primero en la red (así siempre recibís la última versión que subas a GitHub)
//   y, si no hay conexión, se abre la copia guardada.
// - Los íconos y el manifest se sirven desde la copia guardada.
// - Las llamadas a Binance (otro dominio) no se tocan: van siempre directo a la red.
const CACHE = 'screener-v25';
const SHELL = ['./', './index.html', './manifest.webmanifest',
               './icon-192.png', './icon-512.png', './icon-maskable-512.png',
               './apple-touch-icon.png', './favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // Binance y demás: sin tocar

  if (req.mode === 'navigate') {
    // Página: red primero, copia guardada si no hay conexión
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }
  // Íconos, manifest: copia guardada primero
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
