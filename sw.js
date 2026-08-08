'use strict';
var CACHE = 'hbr2-merger-v3';
var BASE = (function () {
  var p = self.location.pathname;
  var i = p.lastIndexOf('/');
  return p.slice(0, i + 1);
})();
// Index y player se sirven SIN extensión (.html) en Cloudflare Pages, así que se
// cachean bajo su URL canónica para evitar el 308 (/index.html -> /) que rompe
// la navegación desde el service worker.
var FILES = [
  'index.html', 'player.html', 'merge-worker.js', 'merge_core.js', 'game-min_patched.js',
  'db.js', 'i18n.js', 'pako.min.js', 'manifest.webmanifest', 'icon.svg', 'favicon.ico',
  'vendor/fontello.css', 'vendor/game.css', 'vendor/pako-jszip.min.js',
  'vendor/font/fontello.eot', 'vendor/font/fontello.ttf', 'vendor/font/fontello.woff', 'vendor/font/fontello.woff2',
  'vendor/images/bg.png', 'vendor/images/flags.png'
];
function canonical(name) {
  if (name === 'index.html') return BASE;
  if (name === 'player.html') return BASE + 'player';
  return BASE + name;
}
function navCacheKey(pathname) {
  if (pathname === BASE || pathname === BASE + 'index.html' || pathname === BASE + 'index') return canonical('index.html');
  if (pathname === BASE + 'player' || pathname === BASE + 'player.html') return canonical('player.html');
  return null;
}
function stripQuery(u) {
  var n = new URL(u);
  n.search = '';
  return n.href;
}

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(FILES.map(function (f) {
      return fetch(canonical(f)).then(function (res) {
        if (!res || !res.ok) return;
        return c.put(new Request(canonical(f)), new Response(res.body, { status: res.status, statusText: res.statusText, headers: res.headers }));
      }).catch(function () {});
    }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
      return caches.delete(k);
    }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Network-first: contenido siempre fresco en línea; la caché solo como respaldo
  // (evita servir assets cacheados viejos que rompen index/player recién desplegados).
  e.respondWith(fetch(req).then(function (res) {
    if (res && res.ok) {
      var key = req.mode === 'navigate' ? navCacheKey(url.pathname) : stripQuery(req.url);
      if (key) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(new Request(key), copy); }).catch(function () {});
      }
    }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (hit) { return hit || Response.error(); });
  }));
});
