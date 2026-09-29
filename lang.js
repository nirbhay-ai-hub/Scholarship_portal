/* =========================================================
   shared/lang.js  — Tribal Scholarship One (v3)
   Direct Google Translate API — works on file:// and http://
   
   Usage: add this ONE line before </body> on every page:
     <script src="shared/lang.js"></script>
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 1. Language catalogue ---------- */
  var LANGS = [
    { c:'en',  n:'English',      f:'EN' },
    { c:'hi',  n:'हिन्दी',         f:'हि' },
    { c:'bn',  n:'বাংলা',          f:'বা' },
    { c:'ta',  n:'தமிழ்',          f:'த' },
    { c:'te',  n:'తెలుగు',         f:'తె' },
    { c:'mr',  n:'मराठी',          f:'म' },
    { c:'gu',  n:'ગુજરાતી',        f:'ગુ' },
    { c:'kn',  n:'ಕನ್ನಡ',          f:'ಕ' },
    { c:'ml',  n:'മലയാളം',        f:'മ' },
    { c:'or',  n:'ଓଡ଼ିଆ',           f:'ଓ' },
    { c:'pa',  n:'ਪੰਜਾਬੀ',         f:'ਪ' },
    { c:'ur',  n:'اردو',           f:'ا' },
    { c:'as',  n:'অসমীয়া',        f:'অ' },
    { c:'sa',  n:'संस्कृतम्',       f:'सं' },
    { c:'ne',  n:'नेपाली',          f:'ने' },
    { c:'mai', n:'मैथिली',         f:'मै' },
    { c:'sat', n:'ᱥᱟᱱᱛᱟᱲᱤ',         f:'ᱥ' }
  ];

  var KEY       = 'tso_lang';
  var CACHE_KEY = 'tso_tr_cache_v3';

  /* ---------- 2. Preferences + cache ---------- */
  var saved = 'en';
  try { saved = localStorage.getItem(KEY) || 'en'; } catch (e) {}
  if (!LANGS.some(function(l){ return l.c === saved; })) saved = 'en';

  var cache = {};
  try {
    var raw = localStorage.getItem(CACHE_KEY);
    if (raw) cache = JSON.parse(raw) || {};
  } catch (e) { cache = {}; }

  /* ---------- 3. Inject CSS ---------- */
  var css = [
    '#tso-lang-wrap{position:relative;flex:none;z-index:100}',
    '#tso-lang-btn{min-width:54px;height:38px;border-radius:10px;border:0;',
      'background:rgba(255,255,255,.12);color:#fff;cursor:pointer;',
      'font-weight:700;font-size:12px;padding:0 12px;',
      'display:inline-flex;align-items:center;justify-content:center;gap:6px;',
      'font-family:inherit;transition:background .15s}',
    '#tso-lang-btn:hover{background:rgba(255,255,255,.22)}',
    '#tso-lang-btn svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:2}',
    '#tso-lang-menu{position:absolute;top:calc(100% + 8px);right:0;',
      'background:#fff;border:1px solid #E2E8F0;border-radius:12px;',
      'box-shadow:0 12px 40px -12px rgba(15,23,42,.35);',
      'min-width:220px;max-height:340px;overflow-y:auto;padding:6px;z-index:200}',
    '#tso-lang-menu[hidden]{display:none}',
    '#tso-lang-menu button{display:flex;align-items:center;gap:10px;width:100%;',
      'padding:9px 12px;border:0;background:none;text-align:left;',
      'font-size:13.5px;font-weight:500;color:#0F172A;border-radius:8px;',
      'cursor:pointer;font-family:inherit}',
    '#tso-lang-menu button:hover{background:#E6F2F0;color:#0B5E55}',
    '#tso-lang-menu button.sel{background:#E6F2F0;color:#0B5E55;font-weight:700}',
    '#tso-lang-menu .fl{width:28px;height:28px;border-radius:8px;',
      'background:#E6F2F0;color:#0B5E55;display:grid;place-items:center;',
      'font-size:11.5px;font-weight:700;flex:none}',
    '#tso-lang-menu button.sel .fl{background:#0B5E55;color:#fff}',
    '.tso-auth-mount{position:absolute;top:14px;right:14px;z-index:60}',
    '.tso-auth-mount #tso-lang-btn{background:#fff;color:#0B5E55;border:1px solid #E2E8F0}',
    '.tso-auth-mount #tso-lang-btn:hover{background:#E6F2F0}',
    /* Translating pill */
    '#tso-pill{position:fixed;top:70px;left:50%;transform:translateX(-50%);',
      'background:#0B5E55;color:#fff;padding:8px 16px;border-radius:999px;',
      'font-size:12.5px;font-weight:600;z-index:99999;',
      'box-shadow:0 10px 30px -10px rgba(11,94,85,.7);',
      'display:none;align-items:center;gap:8px;font-family:inherit}',
    '#tso-pill.on{display:flex}',
    '#tso-pill .sp{width:14px;height:14px;border:2px solid rgba(255,255,255,.35);',
      'border-top-color:#fff;border-radius:50%;animation:tsoSpin .8s linear infinite}',
    '@keyframes tsoSpin{to{transform:rotate(360deg)}}'
  ].join('');
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- 4. Translating pill ---------- */
  function ensurePill() {
    if (document.getElementById('tso-pill')) return;
    var d = document.createElement('div');
    d.id = 'tso-pill';
    d.innerHTML = '<span class="sp"></span><span>Translating…</span>';
    document.body.appendChild(d);
  }
  function setPill(on) {
    ensurePill();
    var p = document.getElementById('tso-pill');
    p.classList.toggle('on', !!on);
  }

  /* ---------- 5. Translation cache + API ---------- */
  function persistCache() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (e) {}
  }

  function translateOne(text, lang) {
    var key = lang + '::' + text;
    if (cache[key]) return Promise.resolve(cache[key]);

    var url = 'https://translate.googleapis.com/translate_a/single' +
              '?client=gtx&sl=en&tl=' + encodeURIComponent(lang) +
              '&dt=t&q=' + encodeURIComponent(text);

    return fetch(url)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data[0]) return text;
        var out = '';
        for (var i = 0; i < data[0].length; i++) {
          if (data[0][i] && data[0][i][0]) out += data[0][i][0];
        }
        out = out || text;
        cache[key] = out;
        return out;
      })
      .catch(function () { return text; });
  }

  /* Translate many strings with limited concurrency */
  function translateMany(texts, lang) {
    var unique = {};
    texts.forEach(function (t) { if (t) unique[t] = 1; });
    var keys = Object.keys(unique);
    var out = {};
    var i = 0;
    var CONCURRENCY = 4;
    var promises = [];
    for (var w = 0; w < CONCURRENCY; w++) {
      promises.push((function () {
        function step() {
          if (i >= keys.length) return Promise.resolve();
          var k = keys[i++];
          return translateOne(k, lang).then(function (v) {
            out[k] = v;
            return step();
          });
        }
        return step();
      })());
    }
    return Promise.all(promises).then(function () { return out; });
  }

  /* ---------- 6. DOM walking ---------- */
  var origTexts = new WeakMap();
  var origAttrs = new WeakMap();

  var SKIP_TAGS = { SCRIPT:1, STYLE:1, NOSCRIPT:1, CODE:1, PRE:1, TEXTAREA:1 };
  var ATTRS_TO_TRANSLATE = ['placeholder','title','aria-label','alt'];

  function shouldSkipEl(el) {
    if (!el) return true;
    if (SKIP_TAGS[el.nodeName]) return true;
    if (el.closest && (el.closest('.notranslate') || el.closest('#tso-lang-wrap') || el.closest('#tso-pill'))) return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function collectTextNodes() {
    var nodes = [];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (!/[A-Za-z]/.test(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        if (shouldSkipEl(n.parentNode)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
  }

  function collectAttrTargets() {
    var out = [];
    var selector = ATTRS_TO_TRANSLATE.map(function (a) { return '[' + a + ']'; }).join(',');
    if (!selector) return out;
    var els = document.querySelectorAll(selector);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (shouldSkipEl(el)) continue;
      for (var j = 0; j < ATTRS_TO_TRANSLATE.length; j++) {
        var a = ATTRS_TO_TRANSLATE[j];
        var v = el.getAttribute(a);
        if (v && /[A-Za-z]/.test(v)) out.push({ el: el, attr: a });
      }
    }
    return out;
  }

  /* ---------- 7. Apply / revert ---------- */
  function snapshotOriginals(textNodes, attrTargets) {
    textNodes.forEach(function (n) {
      if (!origTexts.has(n)) origTexts.set(n, n.nodeValue);
    });
    attrTargets.forEach(function (t) {
      var m = origAttrs.get(t.el);
      if (!m) { m = {}; origAttrs.set(t.el, m); }
      if (!(t.attr in m)) m[t.attr] = t.el.getAttribute(t.attr);
    });
  }

  function revertToEnglish() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    var n;
    while ((n = walker.nextNode())) {
      if (origTexts.has(n)) n.nodeValue = origTexts.get(n);
    }
    document.querySelectorAll('[placeholder],[title],[aria-label],[alt]').forEach(function (el) {
      var m = origAttrs.get(el);
      if (!m) return;
      Object.keys(m).forEach(function (a) { el.setAttribute(a, m[a]); });
    });
    document.documentElement.lang = 'en';
    try { document.title = 'Tribal Scholarship One'; } catch (e) {}
  }

  function translateNow(lang) {
    if (lang === 'en') {
      revertToEnglish();
      return Promise.resolve();
    }

    setPill(true);

    var textNodes   = collectTextNodes();
    var attrTargets = collectAttrTargets();
    snapshotOriginals(textNodes, attrTargets);

    /* Build work list */
    var work = [];
    textNodes.forEach(function (n) {
      work.push({ kind:'text', node:n, orig: origTexts.get(n) });
    });
    attrTargets.forEach(function (t) {
      work.push({ kind:'attr', el:t.el, attr:t.attr, orig: origAttrs.get(t.el)[t.attr] });
    });

    var all = work.map(function (w) { return w.orig; });

    /* Also translate the document title */
    var titleOrig = document.title;
    if (titleOrig && /[A-Za-z]/.test(titleOrig)) all.push(titleOrig);

    return translateMany(all, lang).then(function (map) {
      work.forEach(function (w) {
        var tr = map[w.orig] || w.orig;
        if (w.kind === 'text') {
          w.node.nodeValue = tr;
        } else {
          w.el.setAttribute(w.attr, tr);
        }
      });
      if (titleOrig && map[titleOrig]) {
        try { document.title = map[titleOrig]; } catch (e) {}
      }
      document.documentElement.lang = lang;
      persistCache();
    }).finally(function () {
      setPill(false);
    });
  }

  /* ---------- 8. Switcher UI ---------- */
  function buildSwitcher() {
    var wrap = document.createElement('div');
    wrap.id = 'tso-lang-wrap';

    var btn = document.createElement('button');
    btn.id = 'tso-lang-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Change language');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="12" r="9"/>' +
        '<path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/>' +
      '</svg>' +
      '<span id="tso-lang-code">' + saved.toUpperCase() + '</span>';

    var menu = document.createElement('div');
    menu.id = 'tso-lang-menu';
    menu.className = 'notranslate';
    menu.hidden = true;
    menu.innerHTML = LANGS.map(function (l) {
      return '<button type="button" data-lang="' + l.c + '"' +
        (l.c === saved ? ' class="sel"' : '') + '>' +
        '<span class="fl">' + l.f + '</span><span>' + l.n + '</span>' +
      '</button>';
    }).join('');

    wrap.appendChild(btn);
    wrap.appendChild(menu);

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
    });
    menu.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-lang]') : null;
      if (!b) return;
      var code = b.getAttribute('data-lang');
      menu.hidden = true;
      if (code === saved) return;
      saved = code;
      try { localStorage.setItem(KEY, code); } catch (e) {}
      var lbl = document.getElementById('tso-lang-code');
      if (lbl) lbl.textContent = code.toUpperCase();
      menu.querySelectorAll('[data-lang]').forEach(function (x) {
        x.classList.toggle('sel', x.getAttribute('data-lang') === code);
      });
      translateNow(code);
    });
    document.addEventListener('click', function () { menu.hidden = true; });

    /* Attach */
    var tries = 0;
    (function attach() {
      var topActions = document.querySelector('.top-actions');
      if (topActions && !topActions.querySelector('#tso-lang-wrap')) {
        topActions.appendChild(wrap);
        return;
      }
      var authCard = document.querySelector('.auth-card');
      if (authCard && !authCard.querySelector('#tso-lang-wrap')) {
        authCard.style.position = 'relative';
        wrap.classList.add('tso-auth-mount');
        authCard.appendChild(wrap);
        return;
      }
      if (++tries >= 20) {
        wrap.style.position = 'fixed';
        wrap.style.top = '14px';
        wrap.style.right = '14px';
        wrap.style.zIndex = '9999';
        document.body.appendChild(wrap);
        return;
      }
      setTimeout(attach, 150);
    })();
  }

  /* ---------- 9. Boot ---------- */
  function boot() {
    ensurePill();
    buildSwitcher();

    /* Apply saved language on load */
    if (saved && saved !== 'en') {
      /* Wait for page JS to finish rendering its content */
      setTimeout(function () { translateNow(saved); }, 400);
    }

    /* Watch for dynamically-added content and translate it too */
    if (window.MutationObserver) {
      var pending = null;
      var obs = new MutationObserver(function () {
        if (saved === 'en') return;
        if (pending) clearTimeout(pending);
        pending = setTimeout(function () {
          pending = null;
          translateNow(saved);
        }, 500);
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();