/* BoxingRise — small, dependency-free. Respects prefers-reduced-motion. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = root.lang === 'en' ? 'en' : 'he';

  /* ---------- WhatsApp links from the single config ---------- */
  var cfg = window.BR_CONFIG;
  if (cfg && cfg.whatsapp) {
    var href = 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(cfg.message[lang] || '');
    document.querySelectorAll('.js-wa').forEach(function (a) { a.href = href; });
    if (cfg.question) {
      var qhref = 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(cfg.question[lang] || '');
      document.querySelectorAll('.js-wa-q').forEach(function (a) { a.href = qhref; });
    }
  }

  /* ---------- Final: pick a day and time, put it into the WhatsApp message ---------- */
  var pick = document.querySelector('.pick');
  var pickBtn = document.querySelector('.js-wa-pick');
  if (pick && pickBtn && cfg && cfg.whatsapp) {
    var picked = { day: '', time: '' };
    var msgEl = pick.querySelector('.js-pick-msg');
    var update = function () {
      var m = cfg.message[lang] || '';
      if (picked.day) m += pick.getAttribute('data-day-tpl').replace('{}', picked.day);
      if (picked.time) m += pick.getAttribute('data-time-tpl').replace('{}', picked.time);
      if (msgEl) msgEl.textContent = m;
      pickBtn.href = 'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(m);
    };
    pick.querySelectorAll('[data-group]').forEach(function (g) {
      g.addEventListener('click', function (ev) {
        var c = ev.target.closest('.pick-chip'); if (!c) return;
        var on = c.getAttribute('aria-pressed') !== 'true';
        g.querySelectorAll('.pick-chip').forEach(function (x) { x.setAttribute('aria-pressed', x === c && on ? 'true' : 'false'); });
        picked[g.getAttribute('data-group')] = on ? c.textContent.trim() : '';
        update();
      });
    });
  }

  /* weeks: open on larger screens, tap to open on phones */
  var wide = window.matchMedia('(min-width: 760px)');
  function syncWeeks() { document.querySelectorAll('.wk-d').forEach(function (d) { d.open = wide.matches; }); }
  syncWeeks();
  if (wide.addEventListener) wide.addEventListener('change', syncWeeks);

  document.querySelectorAll('.js-year').forEach(function (n) { n.textContent = new Date().getFullYear(); });
  document.querySelectorAll('.js-print').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });

  /* ---------- Hero: words enter like a jab, one orchestrated moment ---------- */
  /* wide screens get the wide poster frame */
  var hv = document.querySelector('.hero-video');
  if (hv && hv.dataset.posterWide && window.matchMedia('(min-width: 1000px)').matches) hv.poster = hv.dataset.posterWide;
  var hero = document.querySelector('.hero');
  if (hero) {
    hero.querySelectorAll('.h1 .w > span').forEach(function (s, i) { s.style.setProperty('--i', i); });
    requestAnimationFrame(function () { hero.classList.add('go'); });
  }

  /* ---------- Header state ---------- */
  var head = document.querySelector('.site-head');
  var video = document.querySelector('.hero-video');
  var timeline = document.querySelector('.timeline');
  var weeks = timeline ? Array.prototype.slice.call(timeline.querySelectorAll('.wk')) : [];
  var pains = Array.prototype.slice.call(document.querySelectorAll('.pain-list li'));
  if (reduce) pains.forEach(function (li) { li.classList.add('lit'); });
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    if (head) head.classList.toggle('scrolled', y > 24);
    if (!reduce && video && y < window.innerHeight) video.style.setProperty('--py', (y * 0.18).toFixed(1) + 'px');
    pains.forEach(function (li) { if (li.getBoundingClientRect().top < window.innerHeight * 0.72) li.classList.add('lit'); });
    if (timeline) {
      var r = timeline.getBoundingClientRect();
      var mid = window.innerHeight * 0.62;
      var p = Math.min(1, Math.max(0, (mid - r.top) / r.height));
      timeline.style.setProperty('--fill', p.toFixed(3));
      weeks.forEach(function (w) { w.classList.toggle('on', w.getBoundingClientRect().top < mid); });
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Reveals: short and sharp ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px 8% 0px', threshold: 0 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Tape labels slap on when their section arrives ---------- */
  var tagSecs = document.querySelectorAll('.sec');
  if (reduce || !('IntersectionObserver' in window)) tagSecs.forEach(function (s) { s.classList.add('tag-in'); });
  else {
    var tio = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('tag-in'); tio.unobserve(x.target); } }); }, { rootMargin: '0px 0px -15% 0px' });
    tagSecs.forEach(function (s) { tio.observe(s); });
  }

  /* ---------- Park clips: play only while on screen ---------- */
  var clips = document.querySelectorAll('.js-clip');
  if (clips.length && !reduce && 'IntersectionObserver' in window) {
    var cio2 = new IntersectionObserver(function (en) {
      en.forEach(function (x) { var v = x.target; if (x.isIntersecting) { if (v.preload !== 'auto') { v.preload = 'auto'; v.load(); } var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause(); });
    }, { rootMargin: '120px 0px' });
    clips.forEach(function (v) { cio2.observe(v); });
  }

  /* ---------- Reviews: animate each card when it comes into view ---------- */
  var rvs = document.querySelectorAll('.reviews .rv');
  if (reduce || !('IntersectionObserver' in window)) rvs.forEach(function (r) { r.classList.add('in'); });
  else {
    var rio = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); rio.unobserve(x.target); } }); }, { threshold: 0.35 });
    rvs.forEach(function (r) { rio.observe(r); });
  }

  /* ---------- Counters ---------- */
  var nums = document.querySelectorAll('.num[data-count]');
  if (!reduce && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target; cio.unobserve(el);
        var raw = el.getAttribute('data-count');
        var m = raw.match(/^(\d+)(.*)$/);
        if (!m || raw.indexOf(':') > -1) return;
        var to = parseInt(m[1], 10), rest = m[2], t0 = null;
        if (to === 0) return;
        function step(ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / 700);
          el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + rest;
          if (k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    nums.forEach(function (n) { cio.observe(n); });
  }

  /* ---------- Magnetic buttons (fine pointers only) ---------- */
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.magnetic').forEach(function (b) {
      b.addEventListener('pointermove', function (ev) {
        var r = b.getBoundingClientRect();
        var x = (ev.clientX - r.left - r.width / 2) * 0.18, y = (ev.clientY - r.top - r.height / 2) * 0.3;
        b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- WhatsApp float / sticky bar step aside at the final CTA and footer ---------- */
  /* sticky bar waits until the hero button scrolls away, so there's never two of the same button */
  var bar = document.querySelector('.sticky-bar');
  var heroCta = document.querySelector('.hero-cta');
  var heroSeen = !!heroCta;
  /* hold the bar back whenever a booking button on the page itself is on screen */
  var inline = document.querySelectorAll('main .btn.js-wa');
  if (bar && inline.length && 'IntersectionObserver' in window) {
    var showing = new Set();
    var hio = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) showing.add(x.target); else showing.delete(x.target); });
      heroSeen = showing.size > 0; bar.classList.toggle('hold', heroSeen);
    }, { threshold: 0 });
    inline.forEach(function (b) { hio.observe(b); });
  }
  var floaters = document.querySelectorAll('.wa-float, .sticky-bar');
  var zones = document.querySelectorAll('#final, .site-foot');
  if (floaters.length && zones.length && 'IntersectionObserver' in window) {
    var seen = new Set();
    var zio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) seen.add(en.target); else seen.delete(en.target); });
      floaters.forEach(function (f) { f.classList.toggle('away', seen.size > 0); });
    }, { threshold: 0.1 });
    zones.forEach(function (z) { zio.observe(z); });
  }

  /* ---------- Count WhatsApp taps (only reaches analytics after consent) ---------- */
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('.js-wa, .js-wa-q');
    if (!a || typeof window.va !== 'function' || !document.getElementById('va')) return;
    var where = a.closest('.hero') ? 'hero' : a.closest('.sticky-bar') ? 'sticky-bar' : a.classList.contains('wa-float') ? 'float'
      : a.closest('.site-head') ? 'header' : (a.closest('section') && (a.closest('section').id || a.closest('section').className.split(' ')[1])) || 'other';
    window.va('event', { name: a.classList.contains('js-wa-q') ? 'whatsapp_question' : 'whatsapp_trial', data: { where: where, lang: lang } });
  });

  /* ---------- Cookie consent: analytics loads only after "yes" ---------- */
  var KEY = 'br-consent';
  var banner = document.getElementById('cookie');
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode */ } }
  function loadAnalytics() {
    if (document.getElementById('va')) return;
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    var s = document.createElement('script');
    s.id = 'va'; s.defer = true; s.src = '/_vercel/insights/script.js';
    document.head.appendChild(s);
  }
  var choice = get();
  if (choice === 'yes') loadAnalytics();
  else if (choice !== 'no' && banner) {
    /* show after the visitor starts reading, so it never covers the first screen */
    var shown = false;
    var reveal = function () { if (shown || window.scrollY < 300) return; shown = true; banner.hidden = false; window.removeEventListener('scroll', reveal); };
    window.addEventListener('scroll', reveal, { passive: true });
    if (!document.querySelector('.hero')) { shown = true; banner.hidden = false; }
  }
  document.querySelectorAll('.js-consent').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-consent');
      set(v); banner.hidden = true;
      if (v === 'yes') loadAnalytics();
    });
  });
  document.querySelectorAll('.js-cookie-settings').forEach(function (b) {
    b.addEventListener('click', function () { if (banner) { banner.hidden = false; var f = banner.querySelector('button'); if (f) f.focus(); } });
  });
})();

/* mirror, battery, inner voice */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function watch(els, fn, th) { if (!('IntersectionObserver' in window) || reduce) { els.forEach(fn); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { io.unobserve(x.target); fn(x.target); } }); }, { threshold: th });
    els.forEach(function (el) { io.observe(el); }); }
  watch(document.querySelectorAll('.vc-p'), function (s) { s.classList.add('in'); }, .5);
})();

/* mirror: lines come into focus when the section is on screen */
(function () {
  var s = document.querySelector('.mv'); if (!s) return;
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { s.classList.add('in'); return; }
  var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { s.classList.add('in'); io.disconnect(); } }, { threshold: .35 });
  io.observe(s);
})();

/* "what you get" cards: each wakes from the dark as warm light sweeps across it */
(function () {
  var sec = document.getElementById('for'); if (!sec) return;
  var cards = [].slice.call(sec.querySelectorAll('.fc'));
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { cards.forEach(function (c) { c.classList.add('go'); }); return; }
  var io = new IntersectionObserver(function (es) {
    var wide = window.innerWidth >= 760;
    es.forEach(function (x) { if (!x.isIntersecting) return; io.unobserve(x.target);
      var i = cards.indexOf(x.target); setTimeout(function () { x.target.classList.add('go'); }, wide ? i * 260 : 0); });
  }, { threshold: .35 });
  cards.forEach(function (c) { io.observe(c); });
})();

/* BoxingRise 8: pinned run through the weeks */
(function () {
  var sec = document.querySelector('.p8'); if (!sec) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  sec.classList.add('on');
  var run = sec.querySelector('.p8-run'), steps = [].slice.call(sec.querySelectorAll('.p8-step'));
  var segs = [].slice.call(sec.querySelectorAll('.p8-seg')), ticks = [].slice.call(sec.querySelectorAll('.p8-ticks i'));
  var roll = [].slice.call(sec.querySelectorAll('.p8-roll b')), copy = sec.querySelector('.p8-copy'), stage = sec.querySelector('.p8-stage');
  var phases = (sec.getAttribute('data-phases') || '').split('|'), pw = sec.getAttribute('data-phase-word') || '';
  var q = function (s) { return sec.querySelector(s); }, cur = -1, played = false;
  function finale() {
    if (played) return; played = true;
    sec.classList.remove('p8-done'); void sec.offsetWidth; sec.classList.add('p8-done');
  }
  function set(i) {
    if (i === cur) return; cur = i; var s = steps[i];
    roll.forEach(function (b) { b.style.setProperty('--i', i); });
    segs.forEach(function (g, k) { g.setAttribute('class', 'p8-seg' + (k < i ? ' done' : '') + (k === i ? ' cur' : '')); });
    ticks.forEach(function (t, k) { t.classList.toggle('on', k <= i); });
    var ph = +s.getAttribute('data-phase');
    q('.p8-ph-n').textContent = pw + ' ' + (ph + 1); q('.p8-ph-t').textContent = phases[ph] || '';
    q('.p8-feel').textContent = s.getAttribute('data-feel'); q('.p8-t').textContent = s.getAttribute('data-t');
    q('.p8-d').textContent = s.getAttribute('data-d'); q('.p8-m em').textContent = s.getAttribute('data-m');
    copy.classList.remove('swap'); void copy.offsetWidth; copy.classList.add('swap');
    stage.style.setProperty('--i', i); stage.style.setProperty('--f', ((i + 1) / 8).toFixed(3)); copy.setAttribute('data-n', (s.getAttribute('data-wk') || '') + ' ' + (i + 1) + ' / 8');
    sec.classList.toggle('p8-last', i === 7);
    if (i === 7) finale(); else { sec.classList.remove('p8-done'); played = false; }
  }
  function tick() {
    var r = run.getBoundingClientRect(), vh = window.innerHeight;
    var p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
    stage.style.setProperty('--p', p.toFixed(3));
    sec.classList.toggle('moved', p > .02);
    set(Math.min(7, Math.floor(p * 8 * 0.999)));
  }
  window.addEventListener('scroll', function () { requestAnimationFrame(tick); }, { passive: true });
  window.addEventListener('resize', tick); tick();
})();

/* desktop: hero logo flies into the header */
(function () {
  var fly = document.querySelector('.fly-logo'), slot = document.querySelector('.hero-logo-slot'), dock = document.querySelector('.site-head .logo img');
  if (!fly || !slot || !dock) return;
  var mq = window.matchMedia('(min-width: 1000px)'), reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches, root = document.documentElement;
  function ease(x) { return 1 - Math.pow(1 - x, 3); }
  function frame() {
    if (!mq.matches || reduce) { root.classList.remove('logo-flying'); return; }
    var a = slot.getBoundingClientRect(), b = dock.getBoundingClientRect();
    var p = Math.min(1, Math.max(0, window.scrollY / Math.max(320, window.innerHeight * 0.4)));
    var k = ease(p);
    var w = a.width + (b.width - a.width) * k;
    var x = a.left + (b.left - a.left) * k, y = a.top + (b.top - a.top) * k;
    if (p >= 1) { x = b.left; y = b.top; w = b.width; }
    fly.style.width = w.toFixed(1) + 'px'; fly.style.height = (w * 468 / 1202).toFixed(1) + 'px';
    fly.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    fly.style.opacity = p >= 1 ? '0' : '1';
    root.classList.toggle('logo-flying', p < 1);
  }
  window.addEventListener('scroll', function () { requestAnimationFrame(frame); }, { passive: true });
  window.addEventListener('resize', frame); window.addEventListener('load', frame); frame();
})();
