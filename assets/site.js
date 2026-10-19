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
  }

  /* weeks: open on larger screens, tap to open on phones */
  var wide = window.matchMedia('(min-width: 760px)');
  function syncWeeks() { document.querySelectorAll('.wk-d').forEach(function (d) { d.open = wide.matches; }); }
  syncWeeks();
  if (wide.addEventListener) wide.addEventListener('change', syncWeeks);

  document.querySelectorAll('.js-year').forEach(function (n) { n.textContent = new Date().getFullYear(); });
  document.querySelectorAll('.js-print').forEach(function (b) { b.addEventListener('click', function () { window.print(); }); });

  /* ---------- Hero: words enter like a jab, one orchestrated moment ---------- */
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
  if (bar && heroCta && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { heroSeen = en[0].isIntersecting; bar.classList.toggle('hold', heroSeen); }, { threshold: 0 }).observe(heroCta);
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
