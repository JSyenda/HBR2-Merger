// i18n.js — Selector de idioma (es/en) para el merger estático.
// Detecta el idioma principal del navegador, persiste la elección en
// localStorage y aplica las traducciones vía atributos data-i18n*.
(function (global) {
  'use strict';

  var DICT = {
    es: {
      lastRecTitle: 'Restaurar la última rec (?job=…)',
      lastRec: 'Última rec',
      intro: 'Une dos grabaciones de Haxball (<code>.hbr2</code>) en una sola.<br><b>Modo Estándar</b> <em>(recomendado)</em>: crea una rec normal que se puede ver en cualquier reproductor, incluido <b>haxball.com</b>.<br><b>Modo Exacto</b>: conserva la posición exacta de los jugadores al empalmar, pero solo se puede ver con el reproductor de esta web.<br><em>Orden: Rec 1 (comienzo) + Rec 2 (final)</em>.',
      localnote: 'Todo se procesa <b>íntegramente en tu navegador</b>: los archivos no se suben a ningún servidor y las recs quedan guardadas localmente (se restauran con el enlace <code>?job=…</code>).',
      filewarn: 'Estás abriendo este archivo con doble clic (protocolo <code>file://</code>). Chrome bloquea los Web Workers en <code>file://</code>, así que la fusión no puede arrancar. Ábrelo a través de un servidor local (por ejemplo <code>npx serve</code>, la extensión "Live Server" de VS Code o <code>python -m http.server</code> dentro de esta carpeta) o súbelo a GitHub Pages, que es para lo que está preparado.',
      dropMain: 'Arrastra aquí hasta <b>2 archivos .hbr2</b> o haz clic para elegirlos.',
      dropHint: 'El primero será la Rec 1 (inicio), el segundo la Rec 2 (continuación). Puedes intercambiarlos después. Si ya hay 2 recs, una nueva las sustituye en orden rotativo (Rec 1, luego Rec 2).',
      colPos: 'Posición',
      colFile: 'Archivo',
      colSize: 'Tamaño',
      slot1: 'Rec 1 · inicio',
      slot2: 'Rec 2 · continuación',
      addBtn: 'Añadir',
      remBtn: 'Quitar',
      swapBtn: 'Intercambiar orden',
      mergeBtn: 'Fusionar',
      modeLabel: 'Modo de fusión',
      modeStd: 'Estándar (haxball.com)',
      modeExact: 'Exacto (motor patcheado)',
      modeHint: 'En caso de que no funcione el <b>Modo Estándar</b>, prueba con el <b>Modo Exacto</b>. Ten en cuenta que puede llegar a fallar.',
      processLabel: 'Proceso',
      none: '(ninguna)',
      toTopTitle: 'Volver arriba',
      langTitle: 'Idioma / Language',
      warnNotHbr2: 'AVISO: "{f}" no parece un .hbr2, se ignora.',
      warnOverwrite: 'AVISO: ya hay 2 recs; "{f}" sustituye a la Rec {k} (rotativo).',
      selRec: 'Seleccionada Rec {k}: {f} ({s})',
      merging: 'Fusionando... (verificación en marcha)',
      errWorkerStart: 'ERROR: no se pudo iniciar el worker de fusión ({m})',
      errMsg: 'ERROR: {m}',
      fileHint1: 'Estás en file://: Chrome bloquea los Web Workers al abrir páginas con doble clic.',
      fileHint2: 'Sirve esta carpeta por HTTP para que funcione (por ejemplo: npx serve, Live Server, python -m http.server)',
      fileHint3: 'o súbela a GitHub Pages.',
      warnPrefix: 'WARN: ',
      errWorkerFail: 'ERROR: el worker de fusión falló ({m})',
      errGen: 'Error: {m}',
      dlFile: 'Descargar {n}',
      dlPlay: 'Reproducir (motor parcheado)',
      vOKStd: 'VERIFICACIÓN SUPERADA (estructural + física viva) — listo para descargar y reproducir en haxball.com.',
      vOKExact: 'VERIFICACIÓN SUPERADA (paridad byte-exacta) — listo para descargar.',
      resOKStd: 'RESULTADO: verificada estructuralmente — descarga disponible.',
      resOKExact: 'RESULTADO: verificada — descarga disponible.',
      errNoSave: 'AVISO: no se pudo guardar el trabajo en el navegador ({m}).',
      errVerify: 'ERROR: la verificación falló o el merger terminó con error.',
      vFailed: 'VERIFICACIÓN FALLIDA — el merge no cumple la verificación. No se entrega archivo.',
      errNoJob: 'el trabajo ya no existe en este navegador (se borró el historial local)',
      errNoRestore1: 'AVISO: no se pudo restaurar la Rec 1.',
      errNoRestore2: 'AVISO: no se pudo restaurar la Rec 2.',
      restored: 'Estado restaurado del trabajo {id}: Rec 1 + Rec 2 cargadas y resultado fusionado disponible.',
      errNoRestore: 'AVISO: no se pudo restaurar el estado anterior ({m}).',
      pTitle: 'Reproductor de recs HBR2 (motor patcheado)',
      pH2: 'Reproductor de recs .hbr2',
      pDesc: 'Este reproductor usa el motor patcheado (<code>game-min_patched.js</code>) que entiende las acciones de junción <code>Mb</code> que emite el merger. El reproductor estándar de HaxBall <b>no</b> puede reproducir un merged con junción de estado (los jugadores se congelan).<br><br>Arrastra aquí un <b>.hbr2</b> (por ejemplo el merged descargado) o elígelo:',
      pBack: '← Volver al merger',
      pErrNoEngine: 'El motor patcheado no se cargó (window._pxy_B ausente). Haz Ctrl+F5 y vuelve a entrar.',
      pErrPrefix: 'ERROR: ',
      pErrUncaught: 'excepción no controlada: {m}',
      pErrShort: 'archivo demasiado corto',
      pErrNotHbr2: 'no es un .hbr2 (magic HBR2 no encontrado)',
      pErrVersion: 'versión de replay no soportada: {v} (se espera 3)',
      pErrRead: 'no se pudo leer el archivo',
      pErrNoJob: 'el trabajo no existe en este navegador (se borró el historial local)',
      pErrRender: 'fallo de render (frame {f}): {m}',
      pPickFile: 'Elegir archivo'
    },
    en: {
      lastRecTitle: 'Restore last rec (?job=…)',
      lastRec: 'Last rec',
      intro: 'Combine two Haxball recordings (<code>.hbr2</code>) into a single one.<br><b>Standard Mode</b> <em>(recommended)</em>: produces a normal replay that plays on any player, including <b>haxball.com</b>.<br><b>Exact Mode</b>: keeps the exact player positions at the join, but it can only be played with this site\'s player.<br><em>Order: Rec 1 (start) + Rec 2 (continuation)</em>.',
      localnote: 'Everything is processed <b>entirely in your browser</b>: files are never uploaded to any server and recs are kept locally (restore them with the <code>?job=…</code> link).',
      filewarn: 'You are opening this file by double-clicking (<code>file://</code> protocol). Chrome blocks Web Workers on <code>file://</code>, so the merge cannot start. Open it through a local server (e.g. <code>npx serve</code>, the VS Code "Live Server" extension or <code>python -m http.server</code> in this folder) or upload it to GitHub Pages, which is what it is prepared for.',
      dropMain: 'Drag up to <b>2 .hbr2 files</b> here or click to choose them.',
      dropHint: 'The first one becomes Rec 1 (start), the second one Rec 2 (continuation). You can swap them afterwards. If there are already 2 recs, a new one replaces them in rotating order (Rec 1, then Rec 2).',
      colPos: 'Position',
      colFile: 'File',
      colSize: 'Size',
      slot1: 'Rec 1 · start',
      slot2: 'Rec 2 · continuation',
      addBtn: 'Add',
      remBtn: 'Remove',
      swapBtn: 'Swap order',
      mergeBtn: 'Merge',
      modeLabel: 'Merge mode',
      modeStd: 'Standard (haxball.com)',
      modeExact: 'Exact (patched engine)',
      modeHint: 'If the <b>Standard Mode</b> does not work, try the <b>Exact Mode</b>. Keep in mind that it may fail too.',
      processLabel: 'Process',
      none: '(none)',
      toTopTitle: 'Back to top',
      langTitle: 'Language / Idioma',
      warnNotHbr2: 'WARNING: "{f}" does not look like a .hbr2, ignored.',
      warnOverwrite: 'WARNING: there are already 2 recs; "{f}" replaces Rec {k} (rotating).',
      selRec: 'Selected Rec {k}: {f} ({s})',
      merging: 'Merging... (verification in progress)',
      errWorkerStart: 'ERROR: could not start the merge worker ({m})',
      errMsg: 'ERROR: {m}',
      fileHint1: 'You are on file://: Chrome blocks Web Workers when opening pages by double-click.',
      fileHint2: 'Serve this folder over HTTP to make it work (e.g. npx serve, Live Server, python -m http.server)',
      fileHint3: 'or upload it to GitHub Pages.',
      warnPrefix: 'WARN: ',
      errWorkerFail: 'ERROR: the merge worker failed ({m})',
      errGen: 'Error: {m}',
      dlFile: 'Download {n}',
      dlPlay: 'Play (patched engine)',
      vOKStd: 'VERIFICATION PASSED (structural + live physics) — ready to download and play on haxball.com.',
      vOKExact: 'VERIFICATION PASSED (byte-exact parity) — ready to download.',
      resOKStd: 'RESULT: structurally verified — download available.',
      resOKExact: 'RESULT: verified — download available.',
      errNoSave: 'WARNING: could not save the job in the browser ({m}).',
      errVerify: 'ERROR: verification failed or the merger ended with an error.',
      vFailed: 'VERIFICATION FAILED — the merge does not pass verification. No file is delivered.',
      errNoJob: 'the job no longer exists in this browser (local history was cleared)',
      errNoRestore1: 'WARNING: could not restore Rec 1.',
      errNoRestore2: 'WARNING: could not restore Rec 2.',
      restored: 'Job {id} restored: Rec 1 + Rec 2 loaded and the merged result is available.',
      errNoRestore: 'WARNING: could not restore the previous state ({m}).',
      pTitle: 'HBR2 replay player (patched engine)',
      pH2: '.hbr2 replay player',
      pDesc: 'This player uses the patched engine (<code>game-min_patched.js</code>) that understands the <code>Mb</code> junction actions emitted by the merger. The standard HaxBall player <b>cannot</b> play a merge with state junction (players freeze).<br><br>Drag a <b>.hbr2</b> here (e.g. the downloaded merge) or choose it:',
      pBack: '← Back to merger',
      pErrNoEngine: 'The patched engine did not load (missing window._pxy_B). Press Ctrl+F5 and try again.',
      pErrPrefix: 'ERROR: ',
      pErrUncaught: 'uncaught exception: {m}',
      pErrShort: 'file too short',
      pErrNotHbr2: 'not a .hbr2 (HBR2 magic not found)',
      pErrVersion: 'unsupported replay version: {v} (expected 3)',
      pErrRead: 'could not read the file',
      pErrNoJob: 'the job does not exist in this browser (local history was cleared)',
      pErrRender: 'render failure (frame {f}): {m}',
      pPickFile: 'Choose file'
    }
  };

  function detect() {
    var langs = [];
    try {
      if (navigator.languages) langs = navigator.languages;
    } catch (e) {}
    if (!langs.length && navigator.language) langs = [navigator.language];
    for (var i = 0; i < langs.length; i++) {
      var l = String(langs[i] || '').toLowerCase();
      if (l.indexOf('en') === 0) return 'en';
      if (l.indexOf('es') === 0) return 'es';
    }
    return 'es';
  }

  var LANG = null;
  try { LANG = localStorage.getItem('hbr2.lang'); } catch (e) {}
  if (LANG !== 'en' && LANG !== 'es') LANG = detect();

  function t(key, params) {
    var v = (DICT[LANG] || DICT.es)[key];
    if (v == null) v = DICT.es[key];
    if (v == null) v = key;
    if (params) {
      v = String(v).replace(/\{(\w+)\}/g, function (m, k) {
        return params[k] != null ? params[k] : m;
      });
    }
    return v;
  }

  function apply() {
    if (document.documentElement) document.documentElement.setAttribute('lang', LANG);
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n'));
      if (el.tagName === 'TITLE') { el.textContent = v; return; }
      el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
    var sel = document.getElementById('langSel');
    if (sel) sel.value = LANG;
  }

  function set(lang) {
    var l = (lang === 'en' || lang === 'es') ? lang : detect();
    LANG = l;
    try { localStorage.setItem('hbr2.lang', l); } catch (e) {}
    apply();
  }

  function bind() {
    var sel = document.getElementById('langSel');
    if (sel) {
      sel.addEventListener('change', function () { set(sel.value); });
    }
    apply();
  }

  global.HBRI18N = { t: t, lang: function () { return LANG; }, set: set, apply: apply };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})(window);
