const CACHE_NAME = 'murim-survival-v4-5-2-pwa-1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/game.css',
  './js/audio.js',
  './js/game.js',
  './js/art.js',
  './js/integration.js',
  './assets/audio/bgm_bamboo.mp3',
  './assets/audio/bgm_boss.mp3',
  './assets/audio/bgm_canyon.mp3',
  './assets/audio/bgm_home.mp3',
  './assets/audio/bgm_snow.mp3',
  './assets/audio/bgm_tomb.mp3',
  './assets/audio/sfx_boss.mp3',
  './assets/audio/sfx_bow.mp3',
  './assets/audio/sfx_chest_break.mp3',
  './assets/audio/sfx_chest_hit.mp3',
  './assets/audio/sfx_dagger.mp3',
  './assets/audio/sfx_fail.mp3',
  './assets/audio/sfx_fan.mp3',
  './assets/audio/sfx_hammer.mp3',
  './assets/audio/sfx_heal.mp3',
  './assets/audio/sfx_heavy.mp3',
  './assets/audio/sfx_hit.mp3',
  './assets/audio/sfx_pickup.mp3',
  './assets/audio/sfx_rare.mp3',
  './assets/audio/sfx_ring.mp3',
  './assets/audio/sfx_spear.mp3',
  './assets/audio/sfx_success.mp3',
  './assets/audio/sfx_sword.mp3',
  './assets/audio/sfx_talisman.mp3',
  './assets/audio/sfx_ui.mp3',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch {
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      return new Response('', {status: 504, statusText: 'Offline'});
    }
  })());
});
