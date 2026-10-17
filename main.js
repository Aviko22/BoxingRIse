/* ============================================================
   BoxingRise — site settings
   ============================================================ */
// WhatsApp number in international format, digits only (e.g. 972501234567). Leave empty until ready.
const WHATSAPP_NUMBER = '972502734456';
const WHATSAPP_MESSAGE = 'היי אבי, אשמח לשמוע על אימון ניסיון ב-BoxingRise';

/* ============================================================ */

(() => {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const waLink = (text) => 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);

  /* ---------- WhatsApp links ---------- */
  if (WHATSAPP_NUMBER) {
    document.querySelectorAll('.js-whatsapp').forEach((a) => {
      a.href = waLink(WHATSAPP_MESSAGE); a.target = '_blank'; a.rel = 'noopener';
    });
  }
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Media slots: show the photo/video once it loads, keep the placeholder otherwise ---------- */
  document.querySelectorAll('.media').forEach((fig) => {
    fig.querySelectorAll('img, video').forEach((el) => {
      const ok = () => fig.classList.add('loaded');
      const fail = () => el.classList.add('missing');
      if (el.tagName === 'IMG') {
        if (el.complete && el.naturalWidth) ok();
        else { el.addEventListener('load', ok); el.addEventListener('error', fail); }
      } else {
        const src = el.querySelector('source');
        el.addEventListener('loadeddata', ok);
        (src || el).addEventListener('error', fail);
        if (reduce) { el.removeAttribute('autoplay'); el.pause(); }
      }
    });
  });

  /* ---------- Booking form → ready-made WhatsApp message ---------- */
  const form = document.getElementById('book-form');
  if (form) {
    const err = document.getElementById('form-error');
    const done = document.getElementById('form-done');
    const preview = document.getElementById('form-preview');
    const note = document.getElementById('form-done-note');
    const copyBtn = document.getElementById('copy-msg');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const goal = data.get('goal');
      const name = (data.get('name') || '').toString().trim();
      if (!goal || !name) {
        err.textContent = !goal ? 'יש לבחור מטרה אחת, כדי שאדע איך לבנות את האימון.' : 'יש לכתוב שם, כדי שאדע למי לחזור.';
        err.hidden = false;
        (!goal ? form.querySelector('input[name="goal"]') : form.querySelector('#name')).focus();
        return;
      }
      err.hidden = true;
      const lines = [
        'היי אבי, אני ' + name + '.',
        'אשמח לתאם אימון ניסיון ב-BoxingRise.',
        'המטרה שלי: ' + goal,
        'ניסיון: ' + data.get('level'),
        'זמן מועדף: ' + data.get('time'),
      ];
      const extra = (data.get('note') || '').toString().trim();
      if (extra) lines.push('עוד משהו: ' + extra);
      const msg = lines.join('\n');
      preview.textContent = msg;
      done.hidden = false;
      if (WHATSAPP_NUMBER) {
        note.textContent = 'וואטסאפ נפתח בחלון חדש. אם הוא לא נפתח, אפשר להעתיק את ההודעה ולשלוח אותה ידנית.';
        window.open(waLink(msg), '_blank', 'noopener');
      }
      done.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    });
    copyBtn.addEventListener('click', () => {
      const label = copyBtn.querySelector('span');
      const fallback = () => {
        const r = document.createRange(); r.selectNodeContents(preview);
        const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        label.textContent = 'ההודעה מסומנת, אפשר להעתיק';
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(preview.textContent).then(() => { label.textContent = 'הועתק'; }, fallback);
      } else fallback();
    });
  }

  /* ---------- Gold buttons react to a click like a pad takes a punch ---------- */
  document.querySelectorAll('.btn-gold, .wa-float').forEach((btn) => {
    btn.addEventListener('pointerdown', () => {
      btn.classList.remove('punch'); void btn.offsetWidth; btn.classList.add('punch');
    });
    btn.addEventListener('animationend', (e) => { if (e.animationName === 'punchRing') btn.classList.remove('punch'); });
  });

  /* ---------- Jab test: 10 seconds, as many punches as possible ---------- */
  const pad = document.getElementById('jab-pad');
  if (pad) {
    const section = document.getElementById('jab');
    const countEl = document.getElementById('jab-count');
    const timeEl = document.getElementById('jab-time');
    const hint = document.getElementById('jab-hint');
    const result = document.getElementById('jab-result');
    const verdict = document.getElementById('jab-verdict');
    const bestEl = document.getElementById('jab-best');
    const cta = document.getElementById('jab-cta');
    const again = document.getElementById('jab-again');
    const DURATION = 10000;
    let state = 'idle', hits = 0, start = 0, raf = 0;
    const readBest = () => { try { return +localStorage.getItem('br-jab-best') || 0; } catch (e) { return 0; } };
    const saveBest = (n) => { try { localStorage.setItem('br-jab-best', String(n)); } catch (e) { /* storage unavailable */ } };
    const rate = (n) => n >= 70 ? 'ידיים של מקצוען.' : n >= 50 ? 'יד מהירה מאוד.' : n >= 30 ? 'יש פה מהירות.' : 'התחלה טובה.';

    const effects = (x, y) => {
      if (reduce) return;
      const ring = document.createElement('span');
      ring.className = 'shock'; ring.style.left = x + 'px'; ring.style.top = y + 'px';
      pad.appendChild(ring); ring.addEventListener('animationend', () => ring.remove());
      for (let i = 0; i < 6; i++) {
        const s = document.createElement('span'); const a = Math.random() * Math.PI * 2; const d = 40 + Math.random() * 50;
        s.className = 'spark'; s.style.left = x + 'px'; s.style.top = y + 'px';
        s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px');
        pad.appendChild(s); s.addEventListener('animationend', () => s.remove());
      }
      pad.classList.remove('hit'); void pad.offsetWidth; pad.classList.add('hit');
      section.classList.remove('shake'); void section.offsetWidth; section.classList.add('shake');
      countEl.classList.remove('pop'); void countEl.offsetWidth; countEl.classList.add('pop');
    };
    const tick = () => {
      const left = Math.max(0, DURATION - (performance.now() - start));
      timeEl.textContent = (left / 1000).toFixed(1);
      timeEl.classList.toggle('low', left < 3000);
      if (left > 0) raf = requestAnimationFrame(tick); else finish();
    };
    const finish = () => {
      state = 'done'; pad.disabled = true;
      const best = Math.max(readBest(), hits); saveBest(best);
      verdict.textContent = hits + ' מכות. ' + rate(hits);
      bestEl.textContent = hits >= best && hits > 0 ? 'זה השיא שלך באתר.' : 'השיא שלך: ' + best + ' מכות.';
      if (WHATSAPP_NUMBER) cta.href = waLink('היי אבי, הוצאתי ' + hits + ' מכות ב-10 שניות באתר. אשמח לתאם אימון ניסיון ב-BoxingRise');
      hint.textContent = 'נגמר הזמן';
      result.hidden = false;
      setTimeout(() => { pad.disabled = false; hint.textContent = 'לסיבוב נוסף לחצו על ״עוד סיבוב״'; }, 1200);
    };
    const hit = (x, y) => {
      if (state === 'done') return;
      if (state === 'idle') { state = 'running'; start = performance.now(); hint.textContent = 'עוד, עוד, עוד!'; raf = requestAnimationFrame(tick); }
      hits++; countEl.textContent = hits; effects(x, y);
    };
    pad.addEventListener('pointerdown', (e) => {
      const r = pad.getBoundingClientRect(); hit(e.clientX - r.left, e.clientY - r.top);
    });
    pad.addEventListener('click', (e) => {
      if (e.detail === 0) { const r = pad.getBoundingClientRect(); hit(r.width / 2, r.height / 2); } // keyboard
    });
    again.addEventListener('click', () => {
      cancelAnimationFrame(raf); state = 'idle'; hits = 0; pad.disabled = false;
      countEl.textContent = '0'; timeEl.textContent = '10.0'; timeEl.classList.remove('low');
      result.hidden = true; hint.textContent = 'מכה ראשונה מתחילה את השעון'; pad.focus();
    });
  }

  /* ---------- Manifest: split into words so they can light up on scroll ---------- */
  const manifest = document.querySelector('[data-words]');
  let words = [];
  if (manifest) {
    const goldWords = ['RISE', 'לצמוח.'];
    manifest.innerHTML = manifest.textContent.trim().split(/\s+/).map((w) => {
      const gold = goldWords.some((g) => w.includes(g));
      return '<span class="w' + (gold ? ' gold' : '') + '">' + w + '</span>';
    }).join(' ');
    words = Array.from(manifest.querySelectorAll('.w'));
  }

  const counters = document.querySelectorAll('.count');

  /* ---------- Reduced motion: final state, no movement ---------- */
  const revealTargets = document.querySelectorAll('.line, .reveal-up, .clip-reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    revealTargets.forEach((el) => el.classList.add('in'));
    words.forEach((w) => w.classList.add('lit'));
    counters.forEach((c) => { c.textContent = c.dataset.to; });
    root.classList.add('loaded');
    return;
  }

  /* ---------- Page-load sequence ---------- */
  const heroLines = document.querySelectorAll('.hero .line, .hero .reveal-up');
  requestAnimationFrame(() => {
    root.classList.add('loaded');
    heroLines.forEach((el, i) => setTimeout(() => el.classList.add('in'), 150 + i * 140));
  });
  const heroWord = document.querySelector('.hero-word');
  setTimeout(() => heroWord && heroWord.classList.add('settled'), 2800);

  /* ---------- Scroll reveals ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const group = el.parentElement ? Array.from(el.parentElement.children).filter((c) => c.matches('.reveal-up')) : [];
      const delay = el.matches('.reveal-up') ? Math.max(0, group.indexOf(el)) * 110 : 0;
      setTimeout(() => el.classList.add('in'), delay);
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  revealTargets.forEach((el) => { if (!el.closest('.hero')) io.observe(el); });

  /* ---------- Package number counts up ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target; const to = +el.dataset.to; const start = performance.now(); const dur = 1400;
      const tick = (t) => {
        const p = Math.min(1, (t - start) / dur);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countIO.unobserve(el);
    });
  }, { threshold: 0.4 });
  counters.forEach((c) => countIO.observe(c));

  /* ---------- Scroll-driven effects ---------- */
  const header = document.querySelector('.site-header');
  const meter = document.querySelector('.rise-meter');
  const steps = Array.from(document.querySelectorAll('.step'));
  const stepsList = document.querySelector('.steps');
  const contact = document.querySelector('.contact');
  const fillWord = document.querySelector('.fill-word');
  const heroLetters = document.querySelectorAll('.hero-word span');
  const ghosts = Array.from(document.querySelectorAll('.round-ghost'));
  const gallery = document.querySelector('.gallery');
  const track = document.querySelector('.gallery-track');
  let lastY = window.scrollY;
  let ticking = false;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  function onScroll() {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;

    header.classList.toggle('solid', y > 40);
    header.classList.toggle('hidden', y > lastY && y > vh * 0.6);
    lastY = y;

    meter.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);

    if (y < vh * 1.2) {
      heroLetters.forEach((l, i) => l.style.setProperty('--py', (-y * (0.12 + i * 0.05)).toFixed(1) + 'px'));
    }

    if (manifest) {
      const r = manifest.getBoundingClientRect();
      const p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.3));
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('lit', i < n));
    }

    // ghost words behind each round drift against the scroll
    ghosts.forEach((g) => {
      const r = g.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const p = (r.top + r.height / 2 - vh / 2) / vh;
      g.style.setProperty('--gy', (p * 160).toFixed(1) + 'px');
    });

    // gallery slides sideways while you scroll past it
    if (gallery && track) {
      const r = gallery.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const p = clamp((vh - r.top) / (vh + r.height));
        const travel = Math.max(0, track.scrollWidth - window.innerWidth);
        track.style.setProperty('--gx', (p * travel).toFixed(1) + 'px');
      }
    }

    if (stepsList) {
      const r = stepsList.getBoundingClientRect();
      const p = clamp((vh * 0.6 - r.top) / r.height);
      stepsList.style.setProperty('--fill', p.toFixed(4));
      steps.forEach((s) => s.classList.toggle('active', s.getBoundingClientRect().top < vh * 0.62));
    }

    if (contact && fillWord) {
      const r = contact.getBoundingClientRect();
      fillWord.style.setProperty('--fill', clamp((vh - r.top) / (r.height * 0.9)).toFixed(4));
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Embers: gold sparks rising behind the hero ---------- */
  const canvas = document.querySelector('.embers');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let w, h, dpr, sparks = [], running = true;
    const spawn = (anywhere) => ({
      x: Math.random() * w, y: anywhere ? Math.random() * h : h + 10,
      r: Math.random() * 1.6 + 0.4, vy: Math.random() * 0.55 + 0.2,
      sway: Math.random() * 0.6 + 0.2, phase: Math.random() * Math.PI * 2, life: Math.random() * 0.5 + 0.5,
    });
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sparks = Array.from({ length: Math.round(Math.min(110, w / 12)) }, () => spawn(true));
    };
    const draw = (t) => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const s of sparks) {
        s.y -= s.vy;
        s.x += Math.sin(t / 1400 + s.phase) * s.sway * 0.3;
        if (s.y < -10) Object.assign(s, spawn(false));
        const fade = Math.min(1, s.y / (h * 0.9)) * s.life;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(232, 196, 110,' + (fade * 0.85).toFixed(3) + ')';
        ctx.shadowColor = 'rgba(232, 196, 110, .8)';
        ctx.shadowBlur = 8;
        ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener('resize', resize);
    new IntersectionObserver(([e]) => {
      const was = running; running = e.isIntersecting;
      if (running && !was) requestAnimationFrame(draw);
    }).observe(canvas);
    requestAnimationFrame(draw);
  }

  /* ---------- Spotlight follows the pointer on audience rows ---------- */
  document.querySelectorAll('.spot').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  if (!finePointer) return;

  /* ---------- Magnetic buttons ---------- */
  document.querySelectorAll('.magnetic').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.transform = 'translate(' + (e.clientX - r.left - r.width / 2) * 0.28 + 'px,' + (e.clientY - r.top - r.height / 2) * 0.38 + 'px)';
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transition = 'transform .7s cubic-bezier(.19,1,.22,1), color .45s';
      btn.style.transform = '';
      setTimeout(() => { btn.style.transition = ''; }, 700);
    });
  });

  /* ---------- Custom cursor ---------- */
  root.classList.add('has-cursor');
  const cursor = document.querySelector('.cursor');
  const dot = cursor.querySelector('.cursor-dot');
  const ring = cursor.querySelector('.cursor-ring');
  let mx = -100, my = -100, rx = -100, ry = -100;
  window.addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
  });
  const follow = () => {
    rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
    ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
    requestAnimationFrame(follow);
  };
  follow();
  document.querySelectorAll('a, button, summary, .chip, .who-item, input, select, textarea').forEach((el) => {
    el.addEventListener('pointerenter', () => cursor.classList.add('hover'));
    el.addEventListener('pointerleave', () => cursor.classList.remove('hover'));
  });
})();
