// db.js — Persistencia de trabajos de fusión en IndexedDB.
// Sustituye al Map de jobs del servidor Node: en esta versión estática el navegador
// guarda localmente las 2 recs origen + el merged + el log, y los trabajos se pueden
// restaurar con ?job=<id> y reproducir en player.html.
(function (w) {
  'use strict';
  const DB = 'hbr2-merge';
  const VER = 1;
  const STORE = 'jobs';
  let _db = null;
  let _pending = null;

  function open() {
    if (_db) return Promise.resolve(_db);
    if (_pending) return _pending;
    _pending = new Promise(function (resolve, reject) {
      const req = w.indexedDB.open(DB, VER);
      req.onupgradeneeded = function () {
        const d = req.result;
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id' });
      };
      req.onsuccess = function () {
        const d = req.result;
        if (d.objectStoreNames.contains(STORE)) {
          _db = d;
          resolve(_db);
        } else {
          // El almacén no existe: la base se creó con un upgrade abortado (por ejemplo
          // una versión previa de db.js). Con la misma versión onupgradeneeded no vuelve
          // a dispararse, así que hay que cerrar y abrir con versión+1 para repararla.
          const v = d.version;
          d.close();
          const req2 = w.indexedDB.open(DB, v + 1);
          req2.onupgradeneeded = function () {
            if (!req2.result.objectStoreNames.contains(STORE)) req2.result.createObjectStore(STORE, { keyPath: 'id' });
          };
          req2.onsuccess = function () { _db = req2.result; resolve(_db); };
          req2.onerror = function () { reject(req2.error); };
          req2.onblocked = function () { reject(new Error('IndexedDB bloqueado')); };
        }
      };
      req.onerror = function () { reject(req.error); };
      req.onblocked = function () { reject(new Error('IndexedDB bloqueado')); };
    });
    return _pending;
  }

  function saveJob(job) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        const t = db.transaction(STORE, 'readwrite');
        t.objectStore(STORE).put(job);
        t.oncomplete = function () { resolve(); };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error); };
      });
    });
  }

  function getJob(id) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        const t = db.transaction(STORE, 'readonly');
        const q = t.objectStore(STORE).get(id);
        q.onsuccess = function () { resolve(q.result || null); };
        q.onerror = function () { reject(q.error); };
        t.onerror = function () { reject(t.error); };
      });
    }).then(function (j) {
      if (!j) return null;
      if (j.data1) j.data1 = new Uint8Array(j.data1);
      if (j.data2) j.data2 = new Uint8Array(j.data2);
      if (j.merged) j.merged = new Uint8Array(j.merged);
      return j;
    });
  }

  function deleteJob(id) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        const t = db.transaction(STORE, 'readwrite');
        t.objectStore(STORE).delete(id);
        t.oncomplete = function () { resolve(); };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error); };
      });
    });
  }

  w.HBRDB = { saveJob: saveJob, getJob: getJob, deleteJob: deleteJob };
})(window);
