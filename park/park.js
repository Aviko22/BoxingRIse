/* BoxingRise · a scroll-driven walk into the park at sunrise.
   Scroll moves the camera along the path; the sun rises with the rounds, the lamps go out,
   and the walk ends in a clearing with a heavy bag. Everything is built from code (no models). */
import * as THREE from '/park/three.module.min.js';

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = matchMedia('(max-width: 760px)').matches;
const pct = document.querySelector('.pk-pct'), bar = document.querySelector('.pk-load');
let shown = 0;
const setLoad = (v) => { shown = v; bar.style.setProperty('--l', v + '%'); bar.querySelector('.pk-bar i').style.width = v + '%'; if (pct) pct.textContent = Math.round(v) + '%'; };

/* ---------- HTML side: rounds fade with their position, progress rail, drawers ---------- */
const rounds = [...document.querySelectorAll('.rd')];
const ins = rounds.map((r) => r.querySelector('.rd-in'));
const ticks = [...document.querySelectorAll('.pk-prog a')];
const track = document.querySelector('.pk-track');
function layoutText(p) {
  const vh = innerHeight;
  let cur = 0;
  rounds.forEach((r, i) => {
    const b = r.getBoundingClientRect();
    /* fully visible while the section spans the reading line, fading at both ends */
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

/* ---------- 3D ---------- */
function webglOK() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } }

if (reduce || !webglOK()) {
  root.classList.add('static', 'loaded');
  addEventListener('scroll', () => layoutText(progress()), { passive: true });
  layoutText(progress());
} else {
  build();
}

function build() {
  const canvas = document.querySelector('.pk-gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.4 : 1.75));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(small ? 62 : 52, innerWidth / innerHeight, 0.1, 900);
  const fog = new THREE.FogExp2(0x0d0f18, 0.018);
  scene.fog = fog;
  setLoad(12);

  /* rand with a fixed seed so the park is the same on every visit */
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  /* the walking path */
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 14), new THREE.Vector3(0, 0, 2), new THREE.Vector3(2.5, 0, -16), new THREE.Vector3(-3, 0, -38),
    new THREE.Vector3(2, 0, -60), new THREE.Vector3(-2.5, 0, -82), new THREE.Vector3(2.5, 0, -104), new THREE.Vector3(-1.5, 0, -126),
    new THREE.Vector3(0, 0, -146), new THREE.Vector3(0, 0, -160),
  ], false, 'catmullrom', 0.4);
  const samples = path.getSpacedPoints(400);
  const distToPath = (x, z) => { let m = 1e9; for (let i = 0; i < samples.length; i += 2) { const s = samples[i]; const d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < m) m = d; } return Math.sqrt(m); };

  /* sky dome with a sunrise gradient driven by progress */
  const skyU = { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyU,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform vec3 top, mid, hor, sunDir, sunCol; varying vec3 vP;
      void main(){ float h = clamp(vP.y, -0.2, 1.0);
        vec3 c = mix(hor, mid, smoothstep(0.0, 0.22, h)); c = mix(c, top, smoothstep(0.18, 0.75, h));
        float s = max(dot(normalize(vP), normalize(sunDir)), 0.0);
        c += sunCol * (pow(s, 600.0) * 2.2 + pow(s, 24.0) * 0.55 + pow(s, 4.0) * 0.18);
        if (h < 0.0) c = mix(c, hor * 0.4, smoothstep(0.0, -0.2, h));
        gl_FragColor = vec4(c, 1.0); }`,
  }));
  scene.add(sky);

  const hemi = new THREE.HemisphereLight(0x8aa0ff, 0x1a2414, 0.5); scene.add(hemi);
  const fill = new THREE.DirectionalLight(0xfff0dc, 0.2); fill.position.set(-20, 30, 60); scene.add(fill);
  const sun = new THREE.DirectionalLight(0xffc27a, 0.4); scene.add(sun);

  /* ground with gentle hills and patchy grass colour */
  const gGeo = new THREE.PlaneGeometry(420, 420, small ? 70 : 120, small ? 70 : 120); gGeo.rotateX(-Math.PI / 2);
  const gPos = gGeo.attributes.position, gCol = [];
  const cA = new THREE.Color(0x24401f), cB = new THREE.Color(0x35582a), cC = new THREE.Color(0x1b2f18), tmp = new THREE.Color();
  for (let i = 0; i < gPos.count; i++) {
    const x = gPos.getX(i), z = gPos.getZ(i) - 70;
    gPos.setZ(i, gPos.getZ(i) - 70);
    const d = distToPath(x, z);
    const hill = Math.sin(x * 0.045) * Math.cos(z * 0.035) * 1.6 + Math.sin(x * 0.11 + z * 0.07) * 0.5;
    gPos.setY(i, d < 4 ? 0 : hill * Math.min(1, (d - 4) / 10));
    tmp.copy(cA).lerp(rnd() > 0.5 ? cB : cC, rnd() * 0.8); gCol.push(tmp.r, tmp.g, tmp.b);
  }
  gGeo.setAttribute('color', new THREE.Float32BufferAttribute(gCol, 3)); gGeo.computeVertexNormals();
  scene.add(new THREE.Mesh(gGeo, new THREE.MeshLambertMaterial({ vertexColors: true })));
  setLoad(28);

  /* sand path ribbon */
  const pts = path.getSpacedPoints(300), pv = [], pi = [];
  pts.forEach((p, i) => { const t = path.getTangentAt(i / 300); const n = new THREE.Vector3(-t.z, 0, t.x).normalize().multiplyScalar(1.7); pv.push(p.x + n.x, 0.03, p.z + n.z, p.x - n.x, 0.03, p.z - n.z); if (i) { const a = i * 2; pi.push(a - 2, a - 1, a, a - 1, a + 1, a); } });
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.Float32BufferAttribute(pv, 3)); pGeo.setIndex(pi); pGeo.computeVertexNormals();
  scene.add(new THREE.Mesh(pGeo, new THREE.MeshLambertMaterial({ color: 0x9a8562 })));

  /* trees: instanced trunks and low-poly crowns */
  const nT = small ? 170 : 340, trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.26, 2.6, 6), new THREE.MeshLambertMaterial({ color: 0x3b2a1c }), nT);
  const crownGeo = new THREE.IcosahedronGeometry(1.7, 1);
  const crowns = new THREE.InstancedMesh(crownGeo, new THREE.MeshLambertMaterial({ flatShading: true }), nT * 2);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
  const greens = [0x2f5a2a, 0x3d6b2f, 0x284d25, 0x4a7a35, 0x355f2c, 0x5b7f34];
  let placed = 0, ci = 0, guard = 0;
  while (placed < nT && guard++ < 9000) {
    const x = (rnd() - 0.5) * 150, z = 30 - rnd() * 220, d = distToPath(x, z);
    if (d < 5.2 || (z < -150 && Math.hypot(x, z + 160) < 12)) continue;
    const s = 0.8 + rnd() * 0.9;
    m.compose(ps.set(x, 1.3 * s, z), q.identity(), sc.set(s, s, s)); trunks.setMatrixAt(placed, m);
    const k = rnd() > 0.45 ? 2 : 1;
    for (let j = 0; j < k; j++) {
      const cs = s * (1.2 - j * 0.35) * (0.85 + rnd() * 0.4);
      q.setFromEuler(new THREE.Euler(rnd(), rnd() * 3, rnd()));
      m.compose(ps.set(x + (rnd() - 0.5) * 0.6, 2.6 * s + 1.1 * cs + j * 1.3 * s, z + (rnd() - 0.5) * 0.6), q, sc.set(cs, cs * (0.9 + rnd() * 0.3), cs));
      crowns.setMatrixAt(ci, m); crowns.setColorAt(ci, new THREE.Color(greens[Math.floor(rnd() * greens.length)])); ci++;
    }
    placed++;
  }
  trunks.count = placed; crowns.count = ci; scene.add(trunks, crowns);
  setLoad(52);

  /* soft glow texture for lamps, sun and fireflies */
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,235,190,1)'); r.addColorStop(0.25, 'rgba(255,200,120,.55)'); r.addColorStop(1, 'rgba(255,170,80,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();

  /* lamp posts along the path (on at dawn, off when the sun is up) */
  const lamps = [], poleMat = new THREE.MeshLambertMaterial({ color: 0x15171a }), headMat = new THREE.MeshBasicMaterial({ color: 0xffd79a });
  for (let u = 0.06; u < 0.92; u += small ? 0.075 : 0.055) {
    const p = path.getPointAt(u), t = path.getTangentAt(u), side = lamps.length % 2 ? 1 : -1;
    const n = new THREE.Vector3(-t.z, 0, t.x).normalize().multiplyScalar(2.6 * side);
    const g = new THREE.Group(); g.position.set(p.x + n.x, 0, p.z + n.z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 3.4, 6), poleMat); pole.position.y = 1.7;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 8), headMat); head.position.y = 3.45;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffcf8a }));
    halo.position.y = 3.45; halo.scale.setScalar(3.2);
    g.add(pole, head, halo); scene.add(g); lamps.push({ head, halo });
    if (lamps.length % 3 === 0) { /* a bench next to some lamps */
      const bench = new THREE.Group(), wood = new THREE.MeshLambertMaterial({ color: 0x5a3d24 });
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.5), wood); seat.position.y = 0.48;
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.06), wood); back.position.set(0, 0.8, -0.22);
      [-0.75, 0.75].forEach((x) => { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.48, 0.45), poleMat); leg.position.set(x, 0.24, 0); bench.add(leg); });
      bench.add(seat, back); bench.position.set(p.x + n.x * 1.25, 0, p.z + n.z * 1.25); bench.lookAt(p.x, 0, p.z); scene.add(bench);
    }
  }

  /* the entrance gate with the BoxingRise sign */
  const gate = new THREE.Group(), stone = new THREE.MeshLambertMaterial({ color: 0x2b2a28 });
  [-3.4, 3.4].forEach((x) => { const pil = new THREE.Mesh(new THREE.BoxGeometry(0.9, 4.6, 0.9), stone); pil.position.set(x, 2.3, 0); gate.add(pil); const cap = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.25, 1.1), stone); cap.position.set(x, 4.72, 0); gate.add(cap); });
  const beam = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.35, 0.35), new THREE.MeshLambertMaterial({ color: 0x1a1a1a })); beam.position.y = 4.4; gate.add(beam);
  const signMat = new THREE.MeshBasicMaterial({ transparent: true, color: 0xffffff });
  new THREE.TextureLoader().load('/brand/logo.webp', (tx) => { tx.colorSpace = THREE.SRGBColorSpace; signMat.map = tx; signMat.needsUpdate = true; });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.64), signMat); sign.position.set(0, 5.5, 0.2); gate.add(sign);
  const gateGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffb35c, opacity: 0.55 }));
  gateGlow.position.set(0, 5.4, -0.4); gateGlow.scale.set(9, 4.5, 1); gate.add(gateGlow);
  gate.position.set(0, 0, -2); scene.add(gate);

  /* the clearing at the end: a frame with a heavy bag */
  const clear = new THREE.Group(), wood = new THREE.MeshLambertMaterial({ color: 0x4a3220 });
  [-1.6, 1.6].forEach((x) => { const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 3.6, 8), wood); post.position.set(x, 1.8, 0); clear.add(post); });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.6, 8), wood); top.rotation.z = Math.PI / 2; top.position.y = 3.55; clear.add(top);
  const bagPivot = new THREE.Group(); bagPivot.position.set(0, 3.5, 0); clear.add(bagPivot);
  const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.6, 4), new THREE.MeshLambertMaterial({ color: 0x777777 })); chain.position.y = -0.3; bagPivot.add(chain);
  const bag = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.5, 20), new THREE.MeshStandardMaterial({ color: 0x1d1612, roughness: 0.55, metalness: 0.05 })); bag.position.y = -1.35; bagPivot.add(bag);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.345, 0.345, 0.12, 20), new THREE.MeshStandardMaterial({ color: 0xc9a24b, roughness: 0.35, metalness: 0.6 })); band.position.y = -1.0; bagPivot.add(band);
  const endP = path.getPointAt(1); clear.position.set(endP.x, 0, endP.z - 6); scene.add(clear);
  setLoad(74);

  /* the sun and drifting fireflies */
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffd9a0, fog: false }));
  sunSprite.scale.setScalar(120); scene.add(sunSprite);
  const nF = small ? 160 : 320, fp = new Float32Array(nF * 3), fph = new Float32Array(nF);
  for (let i = 0; i < nF; i++) { const u = rnd(), p = path.getPointAt(u); fp[i * 3] = p.x + (rnd() - 0.5) * 16; fp[i * 3 + 1] = 0.5 + rnd() * 3.5; fp[i * 3 + 2] = p.z + (rnd() - 0.5) * 16; fph[i] = rnd() * 6.28; }
  const fGeo = new THREE.BufferGeometry(); fGeo.setAttribute('position', new THREE.BufferAttribute(fp, 3));
  const fMat = new THREE.PointsMaterial({ map: glowTex, size: small ? 0.32 : 0.26, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffd28a });
  const flies = new THREE.Points(fGeo, fMat); scene.add(flies);
  const base = fp.slice();
  setLoad(92);

  /* palette across the walk: pre-dawn → sunrise → golden morning */
  const K = [
    { t: 0.0, top: 0x070a1a, mid: 0x161a38, hor: 0x2b2340, sun: 0x000000, fog: 0x0b0d18, hemi: 0.45, light: 0.15, fill: 0.15, lamp: 1, sunY: -0.12, exp: 0.95 },
    { t: 0.35, top: 0x111a3e, mid: 0x3a2f5a, hor: 0xb0583a, sun: 0xff8a40, fog: 0x2a2030, hemi: 0.8, light: 0.6, fill: 0.35, lamp: 0.75, sunY: 0.0, exp: 1.0 },
    { t: 0.7, top: 0x2c4f8c, mid: 0x9a6f6a, hor: 0xf0a352, sun: 0xffb45c, fog: 0x7b6150, hemi: 1.35, light: 1.4, fill: 0.7, lamp: 0.15, sunY: 0.1, exp: 1.05 },
    { t: 1.0, top: 0x3f74b8, mid: 0xc8a17c, hor: 0xffd28a, sun: 0xffd9a0, fog: 0xb99e7e, hemi: 1.7, light: 2.0, fill: 1.0, lamp: 0, sunY: 0.2, exp: 1.08 },
  ];
  const cA2 = new THREE.Color(), cB2 = new THREE.Color();
  function mixKey(p, key) { let a = K[0], b = K[K.length - 1]; for (let i = 0; i < K.length - 1; i++) if (p >= K[i].t && p <= K[i + 1].t) { a = K[i]; b = K[i + 1]; break; } const f = (p - a.t) / Math.max(1e-4, b.t - a.t); return { a, b, f, n: (k) => a[k] + (b[k] - a[k]) * f, c: (k, out) => out.set(a[k]).lerp(cB2.set(b[k]), f) }; }

  const look = new THREE.Vector3(), camP = new THREE.Vector3();
  let target = progress(), cur = target, last = performance.now(), clock = 0, running = true;

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
    cur += (target - cur) * (1 - Math.pow(0.0025, dt));
    const u = Math.min(0.985, cur * 0.985);
    path.getPointAt(u, camP); path.getPointAt(Math.min(1, u + 0.03), look);
    camera.position.set(camP.x, 1.65 + Math.sin(clock * 1.6) * 0.03, camP.z);
    if (cur > 0.94) look.lerp(new THREE.Vector3(clear.position.x, 1.8, clear.position.z), (cur - 0.94) / 0.06);
    look.y = 1.9 + cur * 0.6;
    camera.lookAt(look);

    const k = mixKey(cur);
    skyU.top.value.copy(k.c('top', cA2)); skyU.mid.value.copy(k.c('mid', cA2.clone())); skyU.hor.value.copy(k.c('hor', cA2.clone()));
    skyU.sunCol.value.copy(k.c('sun', cA2.clone()));
    const sy = k.n('sunY');
    const sd = new THREE.Vector3(0.12, sy, -1).normalize(); skyU.sunDir.value.copy(sd);
    sunSprite.position.copy(camera.position).addScaledVector(sd, 500); sunSprite.material.opacity = Math.min(1, Math.max(0, (sy + 0.06) * 6));
    sun.position.copy(sd).multiplyScalar(100); sun.intensity = k.n('light'); sun.color.copy(k.c('sun', cA2.clone())).lerp(new THREE.Color(0xffffff), 0.3);
    hemi.intensity = k.n('hemi'); fill.intensity = k.n('fill'); hemi.color.set(0x8aa0ff).lerp(cB2.set(0xffe3b8), cur); fog.color.copy(k.c('fog', cA2.clone())); fog.density = 0.02 - cur * 0.008;
    renderer.toneMappingExposure = k.n('exp');
    const lamp = k.n('lamp');
    lamps.forEach((l) => { l.halo.material.opacity = lamp * (0.85 + Math.sin(clock * 3 + l.head.id) * 0.05); l.head.material.color.setScalar(0.35 + lamp * 0.65).multiply(new THREE.Color(0xffd79a)); });
    gateGlow.material.opacity = 0.2 + lamp * 0.5;
    fMat.opacity = Math.max(0, 1 - cur * 1.6);
    if (fMat.opacity > 0) { const a = fGeo.attributes.position.array; for (let i = 0; i < nF; i++) { a[i * 3 + 1] = base[i * 3 + 1] + Math.sin(clock * 0.8 + fph[i]) * 0.35; a[i * 3] = base[i * 3] + Math.cos(clock * 0.5 + fph[i]) * 0.25; } fGeo.attributes.position.needsUpdate = true; }
    bagPivot.rotation.z = Math.sin(clock * 1.3) * 0.05; bagPivot.rotation.x = Math.sin(clock * 0.9 + 1) * 0.03;
    renderer.render(scene, camera);
    layoutText(cur);
    requestAnimationFrame(frame);
  }

  addEventListener('scroll', () => { target = progress(); }, { passive: true });
  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.fov = innerWidth < 760 ? 62 : 52; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false); target = progress(); });
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { last = performance.now(); requestAnimationFrame(frame); } });

  renderer.compile(scene, camera);
  setLoad(100);
  setTimeout(() => root.classList.add('loaded'), 350);
  requestAnimationFrame(frame);
}

/* WhatsApp taps (same event names as the main site, no message text) */
document.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('.js-wa'); if (a) (window.brEvents = window.brEvents || []).push({ name: 'whatsapp_click', data: { placement: 'park' } }); });
