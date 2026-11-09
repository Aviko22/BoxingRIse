/* BoxingRise · a real park session that moves with the scroll, in rounds.
   Frames load coarse-to-fine (every 8th, 4th, 2nd, then all) so scrubbing works before everything
   has arrived; neighbouring frames are cross-faded for smooth motion. Phones: full-bleed portrait.
   Wide screens: the portrait film stands at the reading-end side over a soft enlarged copy of itself. */
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pct = document.querySelector('.pk-pct'), bar = document.querySelector('.pk-load');
const setLoad = (v) => { bar.querySelector('.pk-bar i').style.width = v + '%'; if (pct) pct.textContent = Math.round(v) + '%'; };

/* ---------- rounds fade with their position, progress rail, drawers ---------- */
const rounds = [...document.querySelectorAll('.rd')];
const ins = rounds.map((r) => r.querySelector('.rd-in'));
const ticks = [...document.querySelectorAll('.pk-prog a')];
const track = document.querySelector('.pk-track');
function layoutText(p) {
  const vh = innerHeight;
  let cur = 0;
  rounds.forEach((r, i) => {
    const b = r.getBoundingClientRect();
    /* fade in while it rises into place, fade out before the next round arrives */
    const enter = Math.min(1, Math.max(0, (vh * 0.85 - b.top) / (vh * 0.5)));
    const leave = Math.min(1, Math.max(0, (b.bottom - vh * 0.92) / (vh * 0.28)));
    const o = reduce ? 1 : Math.min(enter, i === rounds.length - 1 ? 1 : leave);
    ins[i].style.setProperty('--o', o.toFixed(3));
    ins[i].style.visibility = o < 0.02 ? 'hidden' : 'visible';
    if (b.top < vh * 0.5) cur = i;
  });
  ticks.forEach((t, i) => t.classList.toggle('on', i === cur));
  track.style.setProperty('--p', p.toFixed(4));
  root.classList.toggle('scrolled', scrollY > 40);
}
document.querySelectorAll('.pk-more').forEach((b) => b.addEventListener('click', () => {
  const d = document.getElementById(b.dataset.open); if (!d) return;
  d.showModal();
  d.querySelectorAll('video[data-src]').forEach((v) => { if (!v.src) v.src = v.dataset.src; if (!reduce) v.play().catch(() => {}); });
}));
document.querySelectorAll('.dr').forEach((d) => {
  d.querySelector('.dr-x').addEventListener('click', () => d.close());
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  d.addEventListener('close', () => d.querySelectorAll('video').forEach((v) => v.pause()));
});
const progress = () => Math.min(1, Math.max(0, scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)));

/* ---------- the film ---------- */
const canvas = document.querySelector('.pk-gl');
const ctx = canvas.getContext('2d');
const N = +canvas.dataset.frames || 1;
const frames = new Array(N);
const src = (i) => '/park/f/' + String(i + 1).padStart(3, '0') + '.webp';
const order = [];
[8, 4, 2, 1].forEach((st) => { for (let i = 0; i < N; i += st) if (!order.includes(i)) order.push(i); });
if (!order.includes(N - 1)) order.push(N - 1);
const coarse = Math.ceil(N / 8) + 1;            /* reveal the page after the coarse pass */
let loaded = 0, ready = false, next = 0;
function lane() {
  if (next >= order.length) return;
  const i = order[next++], im = new Image();
  im.decoding = 'async';
  const done = () => {
    frames[i] = im.naturalWidth ? im : null; loaded++; drawn = -1;
    if (!ready) { setLoad(Math.min(100, (loaded / coarse) * 100)); if (loaded >= coarse) start(); }
    lane();
  };
  im.onload = done; im.onerror = done; im.src = src(i);
}
for (let c = 0; c < 4; c++) lane();

const canFilter = 'filter' in CanvasRenderingContext2D.prototype && !/^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const blur = document.createElement('canvas'); blur.width = 54; blur.height = 96; const bctx = blur.getContext('2d');
let W = 0, H = 0, drawn = -1;
function size() { const dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); drawn = -1; }
function nearest(i) { if (frames[i]) return frames[i]; for (let d = 1; d < N; d++) { if (frames[i - d]) return frames[i - d]; if (frames[i + d]) return frames[i + d]; } return null; }
function cover(img, x, y, w, h) { const r = Math.max(w / img.naturalWidth, h / img.naturalHeight), iw = img.naturalWidth * r, ih = img.naturalHeight * r; ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih); ctx.restore(); }
function paint(img, alpha) {
  ctx.globalAlpha = alpha;
  if (W / H < 0.9) { /* phone: lift the frame so the two of them sit above the words */ const lift = H * 0.2; cover(img, 0, -lift, W, H + lift); return; }
  /* soft backdrop: real blur where the canvas supports filters, a small-canvas blur elsewhere */
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (canFilter) { ctx.filter = 'blur(34px) brightness(.62) saturate(1.1)'; cover(img, -80, -80, W + 160, H + 160); ctx.filter = 'none'; }
  else { bctx.drawImage(img, 0, 0, blur.width, blur.height); ctx.drawImage(blur, -60, -60, W + 120, H + 120); ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.fillRect(0, 0, W, H); }
  const pw = Math.min(W * 0.44, H * img.naturalWidth / img.naturalHeight), px = root.dir === 'rtl' ? W * 0.07 : W - pw - W * 0.07;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 60; ctx.fillStyle = '#000'; ctx.fillRect(px, 0, pw, H); ctx.restore();
  cover(img, px, 0, pw, H);
}
function draw(pos) {
  const i = Math.floor(pos), f = pos - i, key = Math.round(pos * 10);
  if (key === drawn) return; drawn = key;
  const a = nearest(i), b = nearest(Math.min(N - 1, i + 1)); if (!a) return;
  ctx.globalAlpha = 1; ctx.fillStyle = '#07080a'; ctx.fillRect(0, 0, W, H);
  paint(a, 1); if (b && b !== a && f > 0.08) paint(b, f);
  ctx.globalAlpha = 1;
}
let target = 0, cur = 0, last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  cur += (target - cur) * (1 - Math.pow(0.002, dt));
  if (Math.abs(target - cur) < 0.0004) cur = target;
  draw((reduce ? 0 : cur) * (N - 1));
  root.style.setProperty('--p', cur.toFixed(4));
  layoutText(cur);
  requestAnimationFrame(tick);
}
function start() {
  if (ready) return; ready = true; setLoad(100);
  size(); target = cur = progress();
  setTimeout(() => root.classList.add('loaded'), 300);
  requestAnimationFrame(tick);
}
addEventListener('scroll', () => { target = progress(); }, { passive: true });
addEventListener('resize', size);
setTimeout(() => { if (!ready && loaded > 0) start(); }, 7000);

/* WhatsApp taps (same event names as the main site, no message text) */
document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('.js-wa'); if (a) (window.brEvents = window.brEvents || []).push({ name: 'whatsapp_click', data: { placement: 'park' } }); });
