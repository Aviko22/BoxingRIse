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
  var tagSecs = document.querySelectorAll('.sec, .final');
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
  /* posters load only when the clip gets near the screen */
  if (clips.length) {
    var setPoster = function (v) { if (v.dataset.poster && !v.poster) v.poster = v.dataset.poster; };
    if ('IntersectionObserver' in window) {
      var pio = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { setPoster(x.target); pio.unobserve(x.target); } }); }, { rootMargin: '900px 0px' });
      clips.forEach(function (v) { pio.observe(v); });
    } else clips.forEach(setPoster);
  }
  if (clips.length && !reduce && 'IntersectionObserver' in window) {
    var cio2 = new IntersectionObserver(function (en) {
      en.forEach(function (x) { var v = x.target; if (x.isIntersecting) { if (v.preload !== 'auto') v.preload = 'auto'; var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } else v.pause(); });
    }, { rootMargin: '200px 0px' });
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

/* "מכירה את זה?": the line comes in, then the struck-through word keeps changing while it's on screen */
(function () {
  var s = document.querySelector('.nb'); if (!s) return;
  var bs = [].slice.call(s.querySelectorAll('.nb-w b')), i = 0, vis = false, reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && bs.length > 1) {
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(s);
    setInterval(function () {
      if (!vis || document.hidden) return;
      var a = bs[i]; i = (i + 1) % bs.length; var b = bs[i];
      a.classList.remove('on'); a.classList.add('out'); setTimeout(function () { a.classList.remove('out'); }, 600);
      b.classList.add('on');
    }, 1700);
  }
  if (!('IntersectionObserver' in window) || reduce) { s.classList.add('in'); return; }
  var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { s.classList.add('in'); io.disconnect(); } }, { threshold: .35 });
  io.observe(s);
})();

/* (retired) mirror list */
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
    if (root.getAttribute('data-intro') === '3') { /* walk through the logo */
      logo.style.animation = 'none'; logo.style.opacity = '1';
      logo.style.transition = 'transform 1s cubic-bezier(.6,0,.2,1), opacity .8s ease .15s';
      requestAnimationFrame(function () { logo.style.transform = 'scale(16)'; logo.style.opacity = '0'; });
      intro.style.transition = 'background .9s ease .25s';
      setTimeout(function () { root.classList.remove('intro-on'); }, 950);
      setTimeout(finish, 1050);
      return;
    }
    var a = logo.getBoundingClientRect(), b = dock.getBoundingClientRect();
    var s = b.width / a.width, dx = (b.left + b.width / 2) - (a.left + a.width / 2), dy = (b.top + b.height / 2) - (a.top + a.height / 2);
    logo.style.animation = 'none'; logo.style.opacity = '1';
    logo.style.transition = 'transform .95s cubic-bezier(.65,0,.25,1)';
    requestAnimationFrame(function () { logo.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')'; });
    setTimeout(function () { root.classList.remove('intro-on'); }, 1050);
    setTimeout(finish, 1200);
  }
  timer = setTimeout(leave, 2800);
  /* preview: ?intro=1..4 shows a switcher to compare the entrances */
  try { var q = new URLSearchParams(location.search).get('intro'); if (q) { var sw = document.createElement('nav'); sw.className = 'ir-sw'; sw.setAttribute('aria-label', 'preview'); for (var k = 1; k <= 4; k++) { var l = document.createElement('a'); l.href = '?intro=' + k; l.textContent = k; if (String(k) === q) l.className = 'on'; sw.appendChild(l); } document.body.appendChild(sw); } } catch (e) {}
  intro.addEventListener('click', leave);
  window.addEventListener('keydown', function k(e) { window.removeEventListener('keydown', k); leave(); });
})();




/* protect yourself · focus follows the scroll */
(function () {
  var sec = document.querySelector('.defend'); if (!sec) return;
  var cards = [].slice.call(sec.querySelectorAll('.df')); if (!cards.length) return;
  var tick = false;
  function upd() {
    tick = false;
    var mid = innerHeight / 2, best = null, bd = 1e9;
    cards.forEach(function (c) { var r = c.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = c; } });
    var r = sec.getBoundingClientRect(), on = r.top < innerHeight * .6 && r.bottom > innerHeight * .4;
    cards.forEach(function (c) { c.classList.toggle('focus', on && c === best); c.classList.toggle('dim', on && c !== best); });
  }
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  window.addEventListener('resize', upd); upd();
})();

/* BoxingRise 8: a gold line fills along the route and each stage lights up as you scroll */
(function () {
  var sec = document.querySelector('.ps'); if (!sec) return;
  var route = sec.querySelector('.ps-route'), stops = [].slice.call(sec.querySelectorAll('.ps-stop'));
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { stops.forEach(function (s) { s.classList.add('on'); }); route.style.setProperty('--p', 1); return; }
  var desk = window.matchMedia('(min-width: 900px)'), tick = false;
  function upd() {
    tick = false;
    var r = route.getBoundingClientRect(), H = innerHeight, p;
    if (desk.matches) p = (H * .8 - r.top) / (H * .45);
    else p = (H * .6 - r.top) / Math.max(1, r.height);
    p = Math.min(1, Math.max(0, p));
    route.style.setProperty('--p', p.toFixed(3));
    stops.forEach(function (s, i) { s.classList.toggle('on', p >= (i + .5) / stops.length - .12); });
    if (p >= .98) sec.classList.add('done'); else if (p < .85) sec.classList.remove('done');
  }
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true }); window.addEventListener('resize', upd); upd();
})();

/* mobile menu */
(function () {
  var b = document.querySelector('.m-burger'), m = document.getElementById('m-menu'); if (!b || !m) return;
  var de = document.documentElement;
  function close(focus) { b.setAttribute('aria-expanded', 'false'); m.classList.remove('open'); de.classList.remove('menu-open'); setTimeout(function () { if (b.getAttribute('aria-expanded') === 'false') m.hidden = true; }, 300); if (focus) b.focus(); }
  function open() { m.hidden = false; void m.offsetWidth; m.classList.add('open'); b.setAttribute('aria-expanded', 'true'); de.classList.add('menu-open'); }
  b.addEventListener('click', function () { b.getAttribute('aria-expanded') === 'true' ? close() : open(); });
  m.addEventListener('click', function (ev) { if (ev.target.closest('a')) close(); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && b.getAttribute('aria-expanded') === 'true') close(true); });
  window.matchMedia('(min-width: 1000px)').addEventListener('change', function (q) { if (q.matches) close(); });
})();


/* footer finale: light it when it scrolls into view */
(function () {
  var f = document.querySelector('.site-foot'); if (!f) return;
  var t = f.querySelector('.foot-rise') || f;
  function on() { f.classList.add('lit'); document.documentElement.classList.add('foot-lit'); }
  if (!('IntersectionObserver' in window)) { on(); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { on(); io.disconnect(); } }); }, { threshold: .6 });
  io.observe(t);
})();


/* gallery: endless film strip + tap-to-enlarge viewer */
(function () {
  var sec = document.getElementById('gallery'); if (!sec) return;
  var list = sec.querySelector('.gal-list'), items = [].slice.call(sec.querySelectorAll('.gal-item')), btns = items.map(function (li) { return li.querySelector('.gal-btn'); });
  var n = items.length, rtl = document.documentElement.dir === 'rtl', dir = rtl ? 1 : -1;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* viewer */
  var view = document.createElement('div'); view.className = 'gal-view'; view.setAttribute('role', 'dialog'); view.setAttribute('aria-modal', 'true'); view.setAttribute('aria-label', sec.querySelector('h2').textContent);
  view.innerHTML = '<img alt=""><button type="button" class="gal-x" aria-label="' + sec.dataset.close + '">✕</button>' +
    '<button type="button" class="gal-prev" dir="ltr" aria-label="' + sec.dataset.prev + '">' + (rtl ? '›' : '‹') + '</button>' +
    '<button type="button" class="gal-next" dir="ltr" aria-label="' + sec.dataset.next + '">' + (rtl ? '‹' : '›') + '</button><p class="gal-count" dir="ltr" aria-live="polite"></p>';
  document.body.appendChild(view);
  var vi = view.querySelector('img'), cnt = view.querySelector('.gal-count'), cur = 0, last = null;
  function show(i) { cur = (i + n) % n; var b = btns[cur], im = b.querySelector('img'); vi.src = b.dataset.full; vi.alt = im ? im.alt : ''; cnt.textContent = (cur + 1) + ' / ' + n; }
  function open(i) { last = document.activeElement; show(i); view.classList.add('on'); document.documentElement.classList.add('gal-open'); view.querySelector('.gal-x').focus(); }
  function close() { view.classList.remove('on'); document.documentElement.classList.remove('gal-open'); if (last) last.focus(); }
  sec.addEventListener('click', function (ev) { var b = ev.target.closest('.gal-btn'); if (!b) return; open(+b.dataset.i || 0); });
  view.querySelector('.gal-x').addEventListener('click', close);
  view.querySelector('.gal-prev').addEventListener('click', function () { show(cur - 1); });
  view.querySelector('.gal-next').addEventListener('click', function () { show(cur + 1); });
  view.addEventListener('click', function (ev) { if (ev.target === view) close(); });
  document.addEventListener('keydown', function (ev) {
    if (!view.classList.contains('on')) return;
    if (ev.key === 'Escape') close();
    else if (ev.key === 'ArrowRight') show(cur + (rtl ? -1 : 1));
    else if (ev.key === 'ArrowLeft') show(cur + (rtl ? 1 : -1));
  });
  var sx = null; view.addEventListener('touchstart', function (ev) { sx = ev.touches[0].clientX; }, { passive: true });
  view.addEventListener('touchend', function (ev) { if (sx === null) return; var dx = ev.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 50) show(cur + ((dx < 0) !== rtl ? 1 : -1)); });

  /* endless film strip: items + a hidden copy drift by themselves; hover or focus pauses */
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  sec.classList.add('gx-2');
  var t = document.createElement('div'); t.className = 'gx-track';
  items.forEach(function (li) { t.appendChild(li); });
  var clones = items.map(function (li) { var c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.querySelector('button').tabIndex = -1; t.appendChild(c); return c; });
  list.appendChild(t);
  [].forEach.call(list.querySelectorAll('img'), function (im) { im.draggable = false; });

  /* position in px along the strip; runs by itself, can be dragged, swiped, wheeled or stepped */
  var pos = 0, half = 1, step = 300, vel = 0, last = 0, hover = false, drag = null, moved = false, tween = null, idleUntil = 0;
  function measure() {
    half = Math.abs(clones[0].getBoundingClientRect().left - items[0].getBoundingClientRect().left) || 1;
    step = items[0].getBoundingClientRect().width + 18;
  }
  function wrap(v) { return ((v % half) + half) % half; }
  function paint() { t.style.transform = 'translate3d(' + (rtl ? pos : -pos) + 'px,0,0)'; }
  var speed = function () { return half / 70; };
  function frame(now) {
    var dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
    if (tween) {
      var k = Math.min(1, (now - tween.t0) / 450), e = 1 - Math.pow(1 - k, 3);
      pos = tween.from + (tween.to - tween.from) * e; if (k >= 1) tween = null;
    } else if (!drag) {
      if (Math.abs(vel) > 5) { pos += vel * dt; vel *= Math.pow(.05, dt); }
      else if (!hover && now > idleUntil && !view.classList.contains('on')) pos += speed() * dt;
    }
    pos = wrap(pos); paint(); if (onScreen) requestAnimationFrame(frame); else { running = false; last = 0; }
  }
  function go(dirn) { idleUntil = performance.now() + 2500; vel = 0; var base = Math.round(pos / step) * step; tween = { from: pos, to: base + dirn * step, t0: performance.now() }; }
  list.addEventListener('pointerenter', function (ev) { if (ev.pointerType === 'mouse') hover = true; });
  list.addEventListener('pointerleave', function () { hover = false; });
  list.addEventListener('pointerdown', function (ev) {
    if (ev.button !== undefined && ev.button !== 0) return;
    drag = { x: ev.clientX, y: ev.clientY, p: pos, lx: ev.clientX, lt: performance.now(), id: ev.pointerId, axis: null }; moved = false; tween = null; vel = 0;
  });
  window.addEventListener('pointermove', function (ev) {
    if (!drag || ev.pointerId !== drag.id) return;
    var dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
    if (!drag.axis) { if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return; drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; if (drag.axis === 'x') { list.classList.add('drag'); try { list.setPointerCapture(ev.pointerId); } catch (e) {} } }
    if (drag.axis !== 'x') return;
    moved = true; pos = wrap(drag.p + (rtl ? dx : -dx)); paint();
    var now = performance.now(), dtm = now - drag.lt; if (dtm > 0) vel = (rtl ? 1 : -1) * (ev.clientX - drag.lx) / dtm * 1000; drag.lx = ev.clientX; drag.lt = now;
  });
  function end() { if (!drag) return; drag = null; list.classList.remove('drag'); idleUntil = performance.now() + 2500; if (Math.abs(vel) > 2500) vel = Math.sign(vel) * 2500; }
  window.addEventListener('pointerup', end); window.addEventListener('pointercancel', end);
  /* a drag is not a tap: swallow the click that follows it */
  list.addEventListener('click', function (ev) { if (moved) { ev.stopImmediatePropagation(); ev.preventDefault(); moved = false; } }, true);
  list.addEventListener('wheel', function (ev) {
    if (Math.abs(ev.deltaX) <= Math.abs(ev.deltaY)) return;
    ev.preventDefault(); tween = null; vel = 0; pos = wrap(pos + (rtl ? -1 : 1) * ev.deltaX); paint(); idleUntil = performance.now() + 2500;
  }, { passive: false });
  var prev = document.createElement('button'), next = document.createElement('button');
  prev.type = next.type = 'button'; prev.className = 'gx-nav gx-prev'; next.className = 'gx-nav gx-next';
  prev.setAttribute('aria-label', sec.dataset.prev); next.setAttribute('aria-label', sec.dataset.next);
  prev.textContent = rtl ? '›' : '‹'; next.textContent = rtl ? '‹' : '›';
  prev.dir = next.dir = 'ltr';
  prev.addEventListener('click', function () { go(-1); }); next.addEventListener('click', function () { go(1); });
  list.appendChild(prev); list.appendChild(next);
  window.addEventListener('resize', measure); window.addEventListener('load', measure);
  var onScreen = true, running = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen && !running) { running = true; requestAnimationFrame(frame); } }, { rootMargin: '100px 0px' }).observe(list);
  measure(); requestAnimationFrame(frame);
})();

/* BoxingRise 8 title: split into letters, play the entrance once when it comes into view */
(function () {
  var h = document.getElementById('prog-h'); if (!h || h.dataset.split) return;
  var txt = h.textContent; h.dataset.split = '1'; h.setAttribute('aria-label', txt); h.classList.add('ps-ttl');
  var html = '', i = 0;
  for (var k = 0; k < txt.length; k++) {
    var ch = txt[k];
    if (ch === ' ') { html += '<span class="pc pc-sp" aria-hidden="true" style="--i:' + (i++) + '"></span>'; continue; }
    var last = k === txt.length - 1 && /\d/.test(ch);
    html += '<span class="pc' + (last ? ' pc-8' : '') + '" aria-hidden="true" style="--i:' + (i++) + '">' + ch + (last ? '' : '') + '</span>';
  }
  h.innerHTML = html;
  var eight = h.querySelector('.pc-8'); if (eight) { var r = document.createElement('i'); r.className = 'pc-ring'; eight.appendChild(r); }
  if (!('IntersectionObserver' in window)) { h.classList.add('ttl-go'); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { h.classList.add('ttl-go'); io.disconnect(); } }); }, { threshold: .6 });
  io.observe(h);
})();

/* language menu */
(function () {
  var b = document.querySelector('.lm-btn'), l = document.getElementById('lm-list'); if (!b || !l) return;
  function close(focus) { b.setAttribute('aria-expanded', 'false'); l.classList.remove('open'); setTimeout(function () { if (b.getAttribute('aria-expanded') === 'false') l.hidden = true; }, 200); if (focus) b.focus(); }
  function open() { l.hidden = false; void l.offsetWidth; l.classList.add('open'); b.setAttribute('aria-expanded', 'true'); var a = l.querySelector('a[aria-current]') || l.querySelector('a'); if (a) a.focus({ preventScroll: true }); }
  b.addEventListener('click', function (ev) { ev.stopPropagation(); b.getAttribute('aria-expanded') === 'true' ? close() : open(); });
  document.addEventListener('click', function (ev) { if (b.getAttribute('aria-expanded') === 'true' && !ev.target.closest('.lang-menu')) close(); });
  document.addEventListener('keydown', function (ev) {
    if (b.getAttribute('aria-expanded') !== 'true') return;
    if (ev.key === 'Escape') close(true);
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); var a = [].slice.call(l.querySelectorAll('a')), i = a.indexOf(document.activeElement); a[(i + (ev.key === 'ArrowDown' ? 1 : a.length - 1)) % a.length].focus(); }
  });
})();

/* about closing line: light it up once it is in view */
(function () {
  var el = document.querySelector('.as-close'); if (!el) return;
  if (!('IntersectionObserver' in window)) { el.classList.add('ac-go'); return; }
  var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { el.classList.add('ac-go'); io.disconnect(); } }, { threshold: .8 });
  io.observe(el);
})();
