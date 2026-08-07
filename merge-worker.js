// merge-worker.js — Web Worker que ejecuta la fusión HBR2 100% en el navegador.
// Sustituye a (worker.js + hbr2_env.js + server.js) de la versión Node.
//
// Flujo: el hilo principal envía { id, f1: ArrayBuffer, f2: ArrayBuffer, mode, trim1, trim2 };
// trim1/trim2 = segundos a recortar (final de f1 e inicio de f2; 0 = sin recorte).
// el worker responde mensajes { id, t: 'line'|'warn'|'done', ... }. En 'done' el
// ArrayBuffer del merged viaja transferido en result.merged.
'use strict';

// ---------- stubs de navegador mínimos que exige game-min_patched.js ----------
// (el mismo patrón que hbr2_env.js usa en Node; aquí el "entorno" es el propio worker).
function makeCtx() {
  const target = {
    createPattern: () => ({}), createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    measureText: (t) => ({ width: String(t == null ? '' : t).length * 10 }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(4, w * h * 4)), width: w, height: h }),
    putImageData() {}, setLineDash() {}, getLineDash: () => [], clearRect() {}, fillRect() {}, strokeRect() {},
    beginPath() {}, closePath() {}, fill() {}, stroke() {}, clip() {}, rect() {}, arc() {}, arcTo() {},
    moveTo() {}, lineTo() {}, quadraticCurveTo() {}, bezierCurveTo() {},
    save() {}, restore() {}, scale() {}, translate() {}, rotate() {}, resetTransform() {},
    setTransform() {}, drawImage() {}, fillText() {}, strokeText() {},
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
  };
  return new Proxy(target, { get(t, p) { if (p in t) return t[p]; return t[p] || (() => {}); }, set(t, p, v) { t[p] = v; return true; } });
}
function makeEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(), nodeType: 1, _hook: null, _hooks: null, _children: [], _innerHTML: '',
    style: { setProperty() {} }, hidden: false, disabled: false, value: '', textContent: '', maxLength: Infinity,
    selectedIndex: 0, className: '', offsetLeft: 0, clientWidth: 300, clientHeight: 20,
    firstChild: null, firstElementChild: null, files: [], options: [], width: 0, height: 0,
    classList: { _s: {}, add(c) { this._s[c] = 1; }, remove(c) { delete this._s[c]; }, toggle(c) { this._s[c] ? delete this._s[c] : (this._s[c] = 1); }, contains(c) { return !!this._s[c]; } },
    appendChild(c) { c.parentElement = el; el._children.push(c); if (!el.firstChild) el.firstChild = c; if (!el.firstElementChild) el.firstElementChild = c; return c; },
    removeChild(c) { el._children = el._children.filter(x => x !== c); if (el.firstChild === c) el.firstChild = null; if (el.firstElementChild === c) el.firstElementChild = null; return c; },
    insertBefore(n) { el.appendChild(n); return n; },
    remove() { if (el.parentElement) el.parentElement.removeChild(el); },
    querySelector() { return makeEl('div'); },
    querySelectorAll(sel) { if (sel === '[data-hook]' && el._hooks) return el._hooks.map(h => h.el); return []; },
    getAttribute(a) { if (a === 'data-hook') return el._hook; return null; },
    setAttribute() {}, removeAttribute() {},
    getBoundingClientRect() { return { top: 0, left: 0, width: 300, height: 20, bottom: 20, right: 300 }; },
    getContext() { return el._ctx; },
    addEventListener() {}, removeEventListener() {}, focus() {}, blur() {}, select() {}, click() {},
    contains() { return false; }, setSelectionRange() {},
    append(...n) { n.forEach(x => el.appendChild(x)); },
  };
  el._ctx = makeCtx();
  Object.defineProperty(el, 'innerHTML', {
    get() { return el._innerHTML; },
    set(v) { el._innerHTML = v; if (typeof v === 'string' && v.indexOf('data-hook') >= 0) { const h = makeEl('div'); h._hook = 'x'; el._children = [h]; el.firstChild = h; el.firstElementChild = h; } }
  });
  return el;
}

const _topObj = {};
const localStorageStub = { getItem: () => null, setItem() {}, removeItem() {}, clear() {} };
self.window = {
  self: _topObj, top: _topObj,
  performance: { now: () => 0 }, devicePixelRatio: 1,
  localStorage: localStorageStub, sessionStorage: localStorageStub,
  document: {
    createElement: (t) => makeEl(t), createTextNode: () => ({}), getElementById: () => null,
    body: makeEl('body'), head: makeEl('head'), addEventListener() {}, removeEventListener() {},
  },
  location: { search: '' },
  setTimeout: () => 0, setInterval: () => 0, clearTimeout() {}, clearInterval() {},
  requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
  AudioContext: function () { this.createGain = () => ({ connect() {}, gain: { value: 0 } }); this.createBufferSource = () => ({ connect() {}, start() {} }); },
  crypto: { subtle: { sign: () => Promise.resolve(new ArrayBuffer(0)), verify: () => Promise.resolve(false), generateKey: () => Promise.resolve({ privateKey: null, publicKey: null }), exportKey: () => Promise.resolve({}), importKey: () => Promise.resolve(null) }, getRandomValues: (a) => a },
  // En un Worker globalThis.navigator ya existe y es de solo lectura: no se puede
  // reemplazar. Se apunta el navigator del stub al navigator real del worker.
  navigator: globalThis.navigator,
  URL: { createObjectURL: () => '', revokeObjectURL: () => {} },
  Blob: function () {}, FileReader: function () {}, Event: function () {}, CustomEvent: function () {},
  console, addEventListener() {}, removeEventListener() {},
};
self.document = self.window.document;
self.PerfectScrollbar = function () {};
self.Image = function () {};

// ---------- dependencias ----------
importScripts('pako.min.js');            // pako 2.x -> globalThis.pako (en worker, globalThis es self)
// No reasignar desde window: pako 2.1.0 asigna a globalThis.pako, no a window.pako.
if (!self.pako && self.window && self.window.pako) self.pako = self.window.pako;
importScripts('game-min_patched.js');    // define window._pxy_mod (motor patcheado)
self.game = self.window._pxy_mod;
if (!self.game.p.wj || self.game.p.wj.size === 0) self.game.Nc.xj();
if (self.game.p.wj.size !== 24) throw new Error('Registro de acciones inesperado: ' + self.game.p.wj.size);
importScripts('merge_core.js');          // define self.mergeCore (root = globalThis)

// ---------- protocolo ----------
self.onmessage = function (e) {
  const msg = e.data || {};
  function post(t, d) {
    const out = { id: msg.id, t: t };
    if (d) for (const k in d) out[k] = d[k];
    self.postMessage(out, t === 'done' && out.result && out.result.merged ? [out.result.merged] : []);
  }
  try {
    const FPS = 60;
    function hdrDur(b) { return new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(8, false); }
    let b1 = new Uint8Array(msg.f1);
    let b2 = new Uint8Array(msg.f2);
    const t1 = Number(msg.trim1) || 0;
    const t2 = Number(msg.trim2) || 0;
    if (t1 > 0) {
      const d = hdrDur(b1);
      const end = Math.max(Math.min(d - Math.floor(t1 * FPS), d), 1);
      b1 = self.mergeCore.trimReplay(b1, 0, end);
    }
    if (t2 > 0) {
      const d = hdrDur(b2);
      const start = Math.min(Math.floor(t2 * FPS), d - 1);
      b2 = self.mergeCore.trimReplay(b2, start, d);
    }
    const res = self.mergeCore.mergeFiles(b1, b2, { mode: msg.mode });
    for (let i = 0; i < res.log.length; i++) post('line', { text: res.log[i] });
    for (let j = 0; j < (res.warn || []).length; j++) post('warn', { text: res.warn[j] });
    post('done', {
      ok: true,
      verifyOk: res.verifyOk,
      trim1: t1,
      trim2: t2,
      result: {
        verifyOk: res.verifyOk,
        structural: res.structural,
        mbEmitted: res.mbEmitted,
        framesChecked: res.framesChecked,
        dur1: res.dur1,
        dur2: res.dur2,
        mergedDur: res.mergedDur,
        mergedSize: res.mergedSize,
        mergedDecSize: res.mergedDecSize,
        junctionBytes: res.junctionBytes,
        junctionActions: res.junctionActions,
        merged: res.merged.buffer,
      },
    });
  } catch (err) {
    post('line', { text: 'ERROR: ' + (err && err.stack ? err.stack : err) });
    post('done', { ok: false, error: String(err && err.message ? err.message : err) });
  }
};
