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
  /* safety net: if the inline loader did not run (blocked or rewritten by an optimiser), set the source here */
  if (hv && !hv.getAttribute('src') && !hv.querySelector('source')) {
    var wideV = window.matchMedia('(min-width: 1000px)').matches;
    hv.src = '/media/hero-mont-' + (wideV ? 'w' : 'm') + '.mp4';
    if (!document.documentElement.classList.contains('intro-on')) { var hp = hv.play(); if (hp && hp.catch) hp.catch(function () {}); }
  }
  if (hv && hv.dataset.posterWide && window.matchMedia('(min-width: 1000px)').matches) hv.poster = hv.dataset.posterWide;
  var hero = document.querySelector('.hero');
  if (hero) {
    hero.querySelectorAll('.h1 .w > span').forEach(function (s, i) { s.style.setProperty('--i', i); });
    if (!document.documentElement.classList.contains('intro-on')) requestAnimationFrame(function () { hero.classList.add('go'); });
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

  /* ---------- Autoplay blocked (iPhone Low Power Mode, data saver): start the videos on the first touch ---------- */
  var kick = function () {
    document.querySelectorAll('video').forEach(function (v) {
      if (!v.paused) return;
      if (v.classList.contains('hero-video') && document.documentElement.classList.contains('intro-on')) return;
      var r = v.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight && (v.currentSrc || v.getAttribute('src') || v.querySelector('source'))) { var q = v.play(); if (q && q.catch) q.catch(function () {}); }
    });
  };
  if (!reduce) ['touchend', 'click', 'keydown'].forEach(function (t) { document.addEventListener(t, kick, { passive: true }); });

  /* ---------- Park clips: play only while on screen ---------- */
  var clips = document.querySelectorAll('.js-clip');
  if (clips.length && !reduce && 'IntersectionObserver' in window) {
    var cio2 = new IntersectionObserver(function (en) {
      en.forEach(function (x) { var v = x.target; if (x.isIntersecting) { if (v.preload !== 'auto') v.preload = 'auto'; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause(); });
    }, { rootMargin: '700px 0px' });
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
  /* the BoxingRise 8 run is pinned full-screen: the bar steps aside so it never covers the week text */
  var p8run = document.querySelector('.p8.on .p8-run') || document.querySelector('.p8-run');
  if (bar && p8run) {
    var p8hide = function () { var r = p8run.getBoundingClientRect(); bar.classList.toggle('p8-away', r.top < window.innerHeight * .5 && r.bottom > window.innerHeight * .9); };
    window.addEventListener('scroll', function () { requestAnimationFrame(p8hide); }, { passive: true }); p8hide();
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

  /* ---------- Conversion events (no message text, no personal data) ----------
     Every event is also pushed to window.brEvents so it can be checked in a test browser.
     A WhatsApp click means "opened WhatsApp", not "booked". */
  var an = (cfg && cfg.analytics) || { provider: 'none' };
  window.brEvents = window.brEvents || [];
  function track(name, data) {
    data = data || {}; data.lang = lang;
    window.brEvents.push({ name: name, data: data });
    if (get() !== 'yes') return;
    if (an.provider === 'ga4' && typeof window.gtag === 'function') window.gtag('event', name, data);
    else if (an.provider === 'vercel' && typeof window.va === 'function') window.va('event', { name: name, data: data });
    /* cloudflare: page views only, it has no custom events */
  }
  function placement(a) {
    if (a.closest('.hero')) return 'hero';
    if (a.closest('.sticky-bar')) return 'sticky_bar';
    if (a.classList.contains('wa-float') || a.closest('.wa-float')) return 'float';
    if (a.closest('.site-head')) return 'header';
    if (a.closest('.site-foot')) return 'footer';
    var sec = a.closest('section');
    return (sec && (sec.id || sec.className.split(' ')[1])) || 'other';
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('.js-wa, .js-wa-q, .js-wa-pick, .lang-switch, a[hreflang]');
    if (!a) return;
    if (a.matches('.lang-switch, a[hreflang]')) { track('language_switch', { to: a.getAttribute('hreflang') || '' }); return; }
    var where = placement(a), question = a.classList.contains('js-wa-q');
    track('whatsapp_click', { placement: where, type: question ? 'question' : 'trial' });
    if (!question) track('trial_booking_click', { placement: where, picked_slot: a.classList.contains('js-wa-pick') && document.querySelector('.pick-chip[aria-pressed="true"]') ? 'yes' : 'no' });
    if (where === 'hero') track('hero_cta_click', {});
  });
  document.querySelectorAll('details.qa, details.faq-more').forEach(function (d, i) {
    d.addEventListener('toggle', function () { if (d.open) track('faq_interaction', { item: d.classList.contains('faq-more') ? 'more' : String(i + 1) }); });
  });

  /* ---------- Cookie consent: analytics loads only after "yes" ---------- */
  var KEY = 'br-consent';
  var banner = document.getElementById('cookie');
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode */ } }
  function addScript(src, attrs) {
    var s = document.createElement('script'); s.defer = true; s.src = src; s.id = 'br-an';
    Object.keys(attrs || {}).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    document.head.appendChild(s);
  }
  function loadAnalytics() {
    if (document.getElementById('br-an')) return;
    if (an.provider === 'cloudflare' && an.cloudflare_token) {
      addScript('https://static.cloudflareinsights.com/beacon.min.js', { 'data-cf-beacon': JSON.stringify({ token: an.cloudflare_token }) });
    } else if (an.provider === 'ga4' && an.ga4_id) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', an.ga4_id, { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false });
      addScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(an.ga4_id));
    } else if (an.provider === 'vercel') {
      window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
      addScript('/_vercel/insights/script.js');
    }
  }
  var active = an.provider && an.provider !== 'none';
  var cs = document.querySelectorAll('.js-cookie-settings');
  if (!active) { cs.forEach(function (b) { var li = b.closest('li'); (li || b).hidden = true; }); }
  var choice = get();
  if (active && choice === 'yes') loadAnalytics();
  else if (active && choice !== 'no' && banner) {
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



/* about: portrait warms from black & white to colour when the section enters */
(function () {
  var sec = document.getElementById('about'); if (!sec) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { sec.classList.add('ab-in'); return; }
  var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { sec.classList.add('ab-in'); io.disconnect(); } }, { threshold: .3 }); io.observe(sec);
})();

/* rise: section titles rise into place with a gold line under them */
(function () {
  var hs = document.querySelectorAll('main .h2');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reduce) { hs.forEach(function (h) { h.classList.add('rs-in'); }); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('rs-in'); io.unobserve(x.target); } }); }, { threshold: .4 });
  hs.forEach(function (h) { io.observe(h); });
})();

/* intro: logo and line hold for ~2.5s, then the video starts and the logo flies into the header */
(function () {
  var root = document.documentElement, intro = document.querySelector('.intro');
  if (!intro || !root.classList.contains('intro-on')) { if (intro) intro.remove(); return; }
  var logo = intro.querySelector('.intro-logo'), dock = document.querySelector('.site-head .logo img');
  var hero = document.querySelector('.hero'), video = document.querySelector('.hero-video'), done = false, timer;
  function startHero() {
    if (video) { video.setAttribute('autoplay', ''); var p = video.play(); if (p && p.catch) p.catch(function () {}); }
    if (hero) setTimeout(function () { hero.classList.add('go'); }, 250);
  }
  function finish() {
    root.classList.remove('intro-on'); intro.remove();
    try { sessionStorage.setItem('br-intro', '1'); } catch (e) {}
  }
  function leave() {
    if (done) return; done = true; clearTimeout(timer);
    intro.style.animation = 'none';
    startHero();
    intro.classList.add('out');
    if (!dock || !logo || !dock.getBoundingClientRect().width) { intro.style.transition = 'opacity .6s'; intro.style.opacity = '0'; setTimeout(finish, 650); return; }
    var a = logo.getBoundingClientRect(), b = dock.getBoundingClientRect();
    var s = b.width / a.width, dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 2);
    logo.style.animation = 'none'; logo.style.opacity = '1';
    logo.style.transition = 'transform .95s cubic-bezier(.65,0,.25,1)';
    requestAnimationFrame(function () { logo.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')'; });
    setTimeout(function () { root.classList.remove('intro-on'); }, 900);
    setTimeout(finish, 1000);
  }
  timer = setTimeout(leave, 2700);
  intro.addEventListener('click', leave);
  window.addEventListener('keydown', function k(e) { window.removeEventListener('keydown', k); leave(); });
})();

/* =================== BoxingRise 8: interactive 8-week journey ===================
   Accessible tabs (arrow keys follow reading direction, Home/End), prev/next, swipe on the card.
   Motion: a gold runner travels the line, the dots it passes light up one after another,
   cards slide in the direction of travel with their lines staggered, the big number rolls,
   the card's progress bar grows from the previous week. When the journey first comes into view
   it plays itself week by week (once, stops at week 8, pauses on any touch; play/pause button).
   Panels share one grid cell, so switching never shifts the layout. Without JS every week is shown. */
(function () {
  var sec = document.querySelector('.j8'); if (!sec) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rtl = document.documentElement.dir === 'rtl';
  var tabs = [].slice.call(sec.querySelectorAll('.j8-tab'));
  var panels = [].slice.call(sec.querySelectorAll('.j8-panel'));
  var track = sec.querySelector('.j8-track'), box = sec.querySelector('.j8-panels');
  var prev = sec.querySelector('.j8-prev'), next = sec.querySelector('.j8-next');
  var count = sec.querySelector('.j8-count b'), play = sec.querySelector('.j8-play');
  var cur = 0, last = tabs.length - 1, STEP = 3400, timer = null, litT = null, auto = false, started = false;

  function show(i, opts) {
    opts = opts || {};
    i = Math.max(0, Math.min(last, i));
    var from = cur, fwd = i >= from, dist = Math.abs(i - from);
    cur = i;
    box.style.setProperty('--dir', (fwd ? 1 : -1) * (rtl ? -1 : 1));
    box.style.setProperty('--ndir', fwd ? 1 : -1);
    /* dots light up in order along the way */
    tabs.forEach(function (t, k) {
      var on = k === i, step = fwd ? k - from : from - k;
      t.style.setProperty('--dl', (step > 0 && step <= dist ? step * (520 / Math.max(dist, 1)) : 0) + 'ms');
      t.classList.toggle('is-on', on); t.classList.toggle('past', k < i);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    track.style.setProperty('--p', i);
    track.style.setProperty('--dur', (420 + dist * 110) + 'ms');
    /* the target dot lights up when the runner arrives */
    var dur = reduce ? 0 : (dist ? 420 + dist * 110 : 0);
    clearTimeout(litT);
    tabs.forEach(function (t, k) { if (k !== i) t.classList.remove('lit'); });
    if (dur) litT = setTimeout(function () { tabs[i].classList.add('lit'); }, dur * .85); else tabs[i].classList.add('lit');
    track.classList.remove('moving'); void track.offsetWidth; if (dist) track.classList.add('moving');
    panels.forEach(function (p, k) {
      p.classList.toggle('leave', k === from && from !== i);
      if (k === i) {
        p.classList.remove('is-on'); void p.offsetWidth;
        var bar = p.querySelector('.j8-bar i');
        if (bar && !reduce) { bar.style.transition = 'none'; bar.style.width = ((from + 1) * 12.5) + '%'; void bar.offsetWidth; bar.style.transition = ''; bar.style.width = ((i + 1) * 12.5) + '%'; }
      }
      p.classList.toggle('is-on', k === i);
    });
    if (count) { count.textContent = i + 1; count.classList.remove('tick'); void count.offsetWidth; count.classList.add('tick'); }
    if (prev) prev.disabled = i === 0;
    if (next) next.disabled = i === last;
    sec.classList.remove('final');
    if (i === last) { void sec.offsetWidth; sec.classList.add('final'); }
    if (opts.focus) tabs[i].focus();
    if (auto) restartTimer();
  }

  /* ---- autoplay: once, from the current week to week 8 ---- */
  function restartTimer() {
    clearTimeout(timer);
    sec.classList.remove('timing'); void sec.offsetWidth;
    if (!auto || cur >= last) { setAuto(false); return; }
    sec.classList.add('timing');
    timer = setTimeout(function () { show(cur + 1); }, STEP);
  }
  function setAuto(on) {
    auto = on;
    if (!on) { clearTimeout(timer); sec.classList.remove('timing'); }
    sec.classList.toggle('auto', on);
    if (play) {
      play.setAttribute('aria-label', play.getAttribute(on ? 'data-pause' : 'data-play'));
      play.classList.toggle('paused', !on);
    }
    if (on) { if (cur >= last) show(0); else restartTimer(); }
  }
  function user() { if (auto) setAuto(false); }

  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () { user(); show(k); });
    t.addEventListener('keydown', function (ev) {
      var fwd = rtl ? 'ArrowLeft' : 'ArrowRight', back = rtl ? 'ArrowRight' : 'ArrowLeft', n = null;
      if (ev.key === fwd || ev.key === 'ArrowDown') n = k + 1;
      else if (ev.key === back || ev.key === 'ArrowUp') n = k - 1;
      else if (ev.key === 'Home') n = 0;
      else if (ev.key === 'End') n = last;
      if (n === null) return;
      ev.preventDefault(); user(); show((n + tabs.length) % tabs.length, { focus: true });
    });
  });
  if (prev) prev.addEventListener('click', function () { user(); show(cur - 1); });
  if (next) next.addEventListener('click', function () { user(); show(cur + 1); });
  if (play) play.addEventListener('click', function () { setAuto(!auto); });
  box.addEventListener('focusin', user);

  /* swipe on the card: towards the reading direction = next week */
  var x0 = null, y0 = 0;
  box.addEventListener('touchstart', function (e) { user(); x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    show(cur + ((rtl ? dx > 0 : dx < 0) ? 1 : -1));
  }, { passive: true });
  box.addEventListener('mouseenter', function () { if (auto) { clearTimeout(timer); sec.classList.add('hold'); } });
  box.addEventListener('mouseleave', function () { if (auto) { sec.classList.remove('hold'); restartTimer(); } });

  /* reveal + autoplay when the journey comes into view; pause when it leaves */
  var head = sec.querySelector('.j8-head'), j = sec.querySelector('.j8-journey');
  if (reduce || !('IntersectionObserver' in window)) { sec.classList.add('seen', 'hin'); if (play) play.hidden = true; }
  else {
    new IntersectionObserver(function (en, o) { if (en[0].isIntersecting) { sec.classList.add('hin'); o.disconnect(); } }, { rootMargin: '0px 0px -15% 0px' }).observe(head);
    new IntersectionObserver(function (en) {
      var vis = en[0].isIntersecting;
      if (vis) {
        sec.classList.add('seen');
        if (!started) { started = true; setTimeout(function () { if (!sec.classList.contains('touched')) setAuto(true); }, 1400); }
        else if (auto) restartTimer();
      } else if (auto) { clearTimeout(timer); sec.classList.remove('timing'); }
    }, { threshold: .45 }).observe(j);
  }
  ['pointerdown', 'keydown'].forEach(function (t) { j.addEventListener(t, function () { sec.classList.add('touched'); }, { passive: true }); });
  show(0);
})();

/* =================== BoxingRise 8 · six mobile concepts + preview switcher =================== */
(function () {
  var box = document.querySelector('.m8box'); if (!box) return;
  var root = document.documentElement, rtl = root.dir === 'rtl';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var K = 'br-m8', pick = '1';
  try { pick = new URLSearchParams(location.search).get('m8') || localStorage.getItem(K) || '1'; } catch (e) {}
  var sw = box.querySelector('.m8sw');
  function set(v) {
    pick = String(v); if (pick === '0') root.removeAttribute('data-m8'); else root.setAttribute('data-m8', pick);
    try { localStorage.setItem(K, pick); } catch (e) {}
    sw.querySelectorAll('button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-pick') === pick); });
    window.dispatchEvent(new Event('scroll'));
  }
  sw.querySelectorAll('button').forEach(function (b) { b.addEventListener('click', function () { set(b.getAttribute('data-pick')); }); });
  set(pick);
  /* switcher shows while the programme section is on screen */
  var sec = document.querySelector('.j8');
  new IntersectionObserver(function (en) { sw.classList.toggle('show', en[0].isIntersecting); }, { rootMargin: '-30% 0px -30% 0px' }).observe(sec);

  function prog(el) { /* 0..1 as the element scrolls past the middle band of the screen */
    var r = el.getBoundingClientRect(), vh = window.innerHeight;
    return Math.max(0, Math.min(1, (vh * 0.62 - r.top) / Math.max(1, r.height - vh * 0.4)));
  }
  function pinProg(el) { var r = el.getBoundingClientRect(), vh = window.innerHeight; return Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - vh))); }
  function onView(el, fn, th) { new IntersectionObserver(function (en, o) { if (en[0].isIntersecting) { fn(); o.disconnect(); } }, { threshold: th || .5 }).observe(el); }

  /* 1 · road */
  var road = box.querySelector('.m8road'), rItems = [].slice.call(box.querySelectorAll('.m8r'));
  /* 4 · stairs */
  var st = box.querySelector('.m8-4'), steps = [].slice.call(box.querySelectorAll('.m8st')), stx = [].slice.call(box.querySelectorAll('.m8sx')), climber = box.querySelector('.m8climber');
  /* 5 · sunrise */
  var su = box.querySelector('.m8-5'), sky = box.querySelector('.m8sky'), ticks = [].slice.call(box.querySelectorAll('.m8tk')), utx = [].slice.call(box.querySelectorAll('.m8ux'));
  var lastS = -1, lastU = -1;
  function frame() {
    if (pick === '1') {
      var f = prog(road); road.querySelector('.m8rl').style.setProperty('--f', f.toFixed(3));
      var vh = window.innerHeight;
      rItems.forEach(function (li) { li.classList.toggle('on', li.getBoundingClientRect().top < vh * 0.72); });
    } else if (pick === '4') {
      var w = Math.min(7, Math.floor(pinProg(st) * 8));
      if (w !== lastS) {
        lastS = w;
        steps.forEach(function (s, k) { s.classList.toggle('on', k === w); s.classList.toggle('past', k < w); });
        stx.forEach(function (c, k) { c.classList.toggle('on', k === w); });
        var s = steps[w], wrap = s.parentNode.getBoundingClientRect(), r = s.getBoundingClientRect();
        climber.style.setProperty('--cx', ((r.left + r.width / 2 - wrap.left) / wrap.width * 100) + '%');
        climber.style.setProperty('--cy', ((r.top - wrap.top) / wrap.height * 100) + '%');
      }
    } else if (pick === '5') {
      var p = pinProg(su); sky.style.setProperty('--s', p.toFixed(3));
      var u = Math.min(7, Math.floor(p * 8));
      if (u !== lastU) { lastU = u; ticks.forEach(function (t, k) { t.classList.toggle('on', k === u); t.classList.toggle('past', k < u); }); utx.forEach(function (c, k) { c.classList.toggle('on', k === u); }); }
    } else if (pick === '6') {
      chs.forEach(function (c, k) { if (!c.dataset.auto && c.getBoundingClientRect().top < window.innerHeight * 0.62) { c.dataset.auto = 1; openCh(k); } });
    }
  }
  var ticking = false;
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; frame(); }); } }, { passive: true });
  window.addEventListener('resize', function () { lastS = lastU = -1; frame(); });

  /* 2 · deck: autoplay once while visible, swipe or tap a dot */
  var deck = box.querySelector('.m8deck'), cards = [].slice.call(deck.querySelectorAll('.m8dk')), dots = [].slice.call(box.querySelectorAll('.m8dot')), dc = 0, dt = null, dAuto = !reduce;
  function deckGo(i) {
    dc = Math.max(0, Math.min(7, i)); deck.style.setProperty('--cur', dc);
    cards.forEach(function (c, k) { c.classList.toggle('gone', k < dc); c.classList.toggle('top', k === dc); c.classList.toggle('far', k > dc + 3); });
    dots.forEach(function (d, k) { d.classList.toggle('on', k === dc); d.classList.toggle('past', k < dc); });
    clearTimeout(dt); if (dAuto && dc < 7) dt = setTimeout(function () { deckGo(dc + 1); }, 3000);
  }
  dots.forEach(function (d) { d.addEventListener('click', function () { dAuto = false; deckGo(+d.getAttribute('data-go')); }); });
  var x0 = null;
  deck.addEventListener('touchstart', function (e) { dAuto = false; clearTimeout(dt); x0 = e.touches[0].clientX; }, { passive: true });
  deck.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) < 40) { deckGo(dc < 7 ? dc + 1 : 0); return; } deckGo(dc + ((rtl ? dx > 0 : dx < 0) ? 1 : -1)); }, { passive: true });
  deckGo(0); clearTimeout(dt);
  onView(deck, function () { if (dAuto) deckGo(0); });

  /* 3 · ring: autoplay once, tap a segment */
  var ring = box.querySelector('.m8ring'), segs = [].slice.call(box.querySelectorAll('.m8sg')), rtx = [].slice.call(box.querySelectorAll('.m8rt')), num = box.querySelector('.m8num'), run = box.querySelector('.m8run'), rc = -1, rt = null, rAuto = !reduce, turns = 0;
  function ringGo(i) {
    if (i < rc && i === 0 && rc === 7) turns++;
    rc = i;
    segs.forEach(function (s, k) { s.classList.toggle('past', k < i); s.classList.remove('on'); });
    void ring.offsetWidth; segs[i].classList.add('on');
    rtx.forEach(function (c, k) { c.classList.toggle('on', k === i); });
    num.textContent = ('0' + (i + 1)).slice(-2); num.classList.remove('roll'); void num.offsetWidth; num.classList.add('roll');
    run.style.setProperty('--a', (turns * 360 + i * 45 + 22.5) + 'deg');
    clearTimeout(rt); if (rAuto && i < 7) rt = setTimeout(function () { ringGo(i + 1); }, 3000);
  }
  box.querySelectorAll('.m8rb').forEach(function (b) { b.addEventListener('click', function () { rAuto = false; ringGo(+b.getAttribute('data-go')); }); });
  rAuto = false; ringGo(0); rAuto = !reduce;
  onView(ring, function () { if (rAuto) ringGo(0); });

  /* 6 · chapters: open one by one as you scroll, tap to open any */
  var chs = [].slice.call(box.querySelectorAll('.m8ch')), chl = box.querySelector('.m8chl');
  function openCh(k) {
    chs.forEach(function (c, j) { var o = j === k; c.classList.toggle('open', o); c.classList.toggle('done', j < k); c.querySelector('.m8chb').setAttribute('aria-expanded', o ? 'true' : 'false'); });
    chl.style.setProperty('--f', ((k + 1) / chs.length).toFixed(3));
  }
  chs.forEach(function (c, k) { c.querySelector('.m8chb').addEventListener('click', function () { c.dataset.auto = 1; openCh(c.classList.contains('open') ? -1 : k); }); });
  frame();
})();
