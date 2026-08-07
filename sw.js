'use strict';
var CACHE = 'hbr2-merger-v1';
var BASE = (function () {
  var p = self.location.pathname;
  var i = p.lastIndexOf('/');
  return p.slice(0, i + 1);
})();
var FILES = [
  'index.html', 'player.html', 'merge-worker.js', 'merge_core.js', 'game-min_patched.js',
  'db.js', 'i18n.js', 'pako.min.js', 'manifest.webmanifest', 'icon.svg', 'favicon.ico',
  'vendor/fontello.css', 'vendor/game.css', 'vendor/pako-jszip.min.js',
  'vendor/font/fontello.eot', 'vendor/font/fontello.ttf', 'vendor/font/fontello.woff', 'vendor/font/fontello.woff2',
  'vendor/images/bg.png', 'vendor/images/flags.png'
];
function full(p) { return BASE + p; }

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(FILES.map(function (f) {
      return c.add(full(f)).catch(function () {});
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
  if (req.mode === 'navigate') {
    var rel = url.pathname.slice(BASE.length);
    if (rel === '' || rel === 'index.html') rel = 'index.html';
    else if (rel.slice(-5) !== '.html') rel = 'index.html';
    e.respondWith(caches.match(full(rel)).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(full(rel), copy); });
        }
        return res;
      });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) {
    if (hit) return hit;
    return fetch(req).then(function (res) {
      if (res && res.status === 200) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    });
  }));
});
