// betz home: a candy lowrider cruising Ocean Boulevard at dusk, deco hotels and neon rolling past, slips in the wind, inked in real time
import * as THREE from './three.module.min.js';
import { RoundedBoxGeometry } from './RoundedBoxGeometry.js';
const cv = document.getElementById('bg');
const PHONE = matchMedia('(max-width: 760px)').matches;
const R = new THREE.WebGLRenderer({ canvas: cv, antialias: false, powerPreference: 'high-performance' });
let DPR = Math.min(devicePixelRatio || 1, PHONE ? 1.5 : 1.6); R.setPixelRatio(DPR);
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.outputColorSpace = THREE.SRGBColorSpace; R.toneMapping = THREE.NoToneMapping;
const scene = new THREE.Scene();
const hsh = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const canvasTex = (w, h, draw, srgb = true) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
const ramp = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 150, 150, 150, 255, 255, 255, 255, 255]), 3, 1); ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
const toon = (color, o = {}) => new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...o });
const mesh = (geo, mat, x = 0, y = 0, z = 0, parent = scene, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m; };
await Promise.all([document.fonts.load('900 40px RB'), document.fonts.load('800 20px JB'), document.fonts.load('700 20px JB')]).catch(() => {});
const frondTex = canvasTex(1024, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#fff';
  g.beginPath(); g.moveTo(0, h / 2 - 7); g.lineTo(w, h / 2 - 1); g.lineTo(w, h / 2 + 1); g.lineTo(0, h / 2 + 7); g.fill();
  for (let i = 0; i < 70; i++) { const x = 10 + i * 14.3, t = x / w, len = (h / 2 - 4) * Math.sin(Math.PI * Math.min(1, t * 1.1 + .05)) * (.8 + .2 * hsh(i, 41)), wd = 7 - t * 4;
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x - wd, h / 2); g.lineTo(x + wd, h / 2); g.lineTo(x + len * .55 + 2, h / 2 + s * len); g.closePath(); g.fill(); } } }, false);
frondTex.generateMipmaps = false; frondTex.minFilter = THREE.LinearFilter;
const frondMat = toon(0x3c8a4a, { alphaMap: frondTex, alphaTest: .4, side: THREE.DoubleSide, transparent: false });
const frondDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaMap: frondTex, alphaTest: .4, side: THREE.DoubleSide });
const barkTex = canvasTex(64, 512, (g, w, h) => { g.fillStyle = '#9a7a62'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 14) { g.fillStyle = 'rgba(70,40,40,.45)'; g.fillRect(0, y, w, 4); g.fillStyle = 'rgba(255,220,190,.2)'; g.fillRect(0, y + 5, w, 2); } });
barkTex.wrapT = THREE.RepeatWrapping; barkTex.repeat.set(1, 3);
function palm(x, z, hgt, lean, seed, parent = scene) { const grp = new THREE.Group(); grp.position.set(x, 0, z); parent.add(grp);
  const top = new THREE.Vector3(lean, hgt, lean * .2);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(lean * .15, hgt * .35, 0), new THREE.Vector3(lean * .55, hgt * .72, lean * .1), top]);
  const tr = mesh(new THREE.TubeGeometry(curve, 40, .16, 10, false), toon(0xffffff, { map: barkTex }), 0, 0, 0, grp);
  for (let i = 0; i < 18; i++) { const L = 2.4 + hsh(seed, i) * 1.1, geo = new THREE.PlaneGeometry(L, 1.0, 20, 2); geo.translate(L / 2, 0, 0); const p = geo.attributes.position;
    const droop = .38 + hsh(seed, i + 50) * .3; for (let k = 0; k < p.count; k++) { const u = p.getX(k) / L; p.setY(k, p.getY(k) * .0 - droop * L * u * u + .25 * L * u); p.setZ(k, (k % 2 ? 1 : -1) * .31 * Math.sin(Math.PI * Math.min(1, u * 1.05)) * .6); }
    // put the leaf width in the plane of the frond: rebuild y/z so the blade lies flat
    geo.computeVertexNormals();
    const f = new THREE.Mesh(geo, frondMat); f.customDepthMaterial = frondDepth; f.castShadow = true; f.receiveShadow = true;
    f.position.copy(top); f.rotation.y = i / 18 * Math.PI * 2 + hsh(seed, i + 9) * .3; f.rotation.z = (hsh(seed, i + 20) - .5) * .3; grp.add(f); }
  mesh(new THREE.SphereGeometry(.22, 12, 10), toon(0x6b5a3a), top.x, top.y - .05, top.z, grp);
  return grp; }



// ================================================================ OCEAN BOULEVARD AT DUSK: deco hotels, neon, palms, the sea, traffic
const envTex = canvasTex(1024, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1d1446'); gr.addColorStop(.36, '#6e2f7e'); gr.addColorStop(.47, '#ff7a72'); gr.addColorStop(.52, '#ffc38a'); gr.addColorStop(.56, '#3a2040'); gr.addColorStop(1, '#120a18'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff0cf'; g.beginPath(); g.ellipse(w * .25, h * .49, 70, 26, 0, 0, 7); g.fill(); for (let i = 0; i < 40; i++) { g.fillStyle = ['#ff4fa6', '#19d3c5', '#ffd36b'][i % 3]; g.fillRect(w * (.55 + hsh(i, 1) * .4), h * (.42 + hsh(i, 2) * .08), 6, 3); } });
envTex.mapping = THREE.EquirectangularReflectionMapping;
const pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromEquirectangular(envTex).texture; scene.environmentIntensity = .9;
scene.background = new THREE.Color(0x24163f); scene.fog = new THREE.Fog(0x4a2a5c, 70, 260);
// sky dome with a setting sun over the water (the sea is on +x)
const skyTex = canvasTex(1024, 1024, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#120c34'); gr.addColorStop(.3, '#3c1f66'); gr.addColorStop(.43, '#9a3f8a'); gr.addColorStop(.48, '#ff7466'); gr.addColorStop(.5, '#ffb070'); gr.addColorStop(.52, '#3a2048'); gr.addColorStop(1, '#120a18'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${.2 + hsh(i, 5) * .6})`; g.fillRect(hsh(i, 6) * w, hsh(i, 7) * h * .3, 1.5, 1.5); }
  for (let i = 0; i < 22; i++) { const y = h * (.36 + hsh(i, 2) * .1); g.fillStyle = `rgba(255,${120 + hsh(i, 3) * 80 | 0},${140 + hsh(i, 4) * 60 | 0},${.12 + hsh(i, 8) * .2})`; g.beginPath(); g.ellipse(hsh(i, 1) * w, y, 60 + hsh(i, 9) * 200, 4 + hsh(i, 10) * 8, 0, 0, 7); g.fill(); } });
const dome = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })); dome.rotation.y = Math.PI * .5; scene.add(dome); dome.layers.set(1);
const glowTex = canvasTex(256, 256, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const glow = (col, s, x, y, z, parent = scene, o = .9) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); m.scale.set(s, s, 1); m.position.set(x, y, z); m.layers.set(1); parent.add(m); return m; };
const sunDisc = glow(0xffd9a0, 46, 260, 6, 60, scene, 1); glow(0xff6f8a, 120, 262, 10, 62, scene, .55);
// the sea and the sand (+x), static: they look the same whichever way you drive
const seaTex = canvasTex(512, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#2a5a7a'); gr.addColorStop(1, '#5a3a78'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,${170 + hsh(i, 3) * 70 | 0},${150 + hsh(i, 4) * 60 | 0},${.1 + hsh(i, 5) * .25})`; g.fillRect(hsh(i, 1) * w, hsh(i, 2) * h, 6 + hsh(i, 6) * 26, 1.5); } });
seaTex.wrapS = seaTex.wrapT = THREE.RepeatWrapping; seaTex.repeat.set(6, 30);
const sea = mesh(new THREE.PlaneGeometry(400, 600), new THREE.MeshStandardMaterial({ map: seaTex, roughness: .25, metalness: .3, envMapIntensity: 1.1 }), 222, -.05, 40, scene, false); sea.rotation.x = -Math.PI / 2;
const sand = mesh(new THREE.PlaneGeometry(18, 600), toon(0xf0c8a8), 14, .02, 40, scene, false); sand.rotation.x = -Math.PI / 2;
const sunPath = mesh(new THREE.PlaneGeometry(260, 7), new THREE.MeshBasicMaterial({ color: 0xffb27a, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false }), 150, .02, 52, scene, false); sunPath.rotation.x = -Math.PI / 2; sunPath.layers.set(1);
// the road: two lanes, double yellow, sidewalks, curbs. its paint scrolls under the car
const roadTex = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#4a3a52'; g.fillRect(0, 0, w, h); for (let i = 0; i < 6000; i++) { g.fillStyle = hsh(i, 31) > .5 ? 'rgba(255,220,220,.05)' : 'rgba(10,0,20,.08)'; g.fillRect(hsh(i, 32) * w, hsh(i, 33) * h, 2, 2); }
  const X = v => (v + 7) / 9.5 * w; g.fillStyle = '#ffcf4a'; g.fillRect(X(-2.32), 0, 5, h); g.fillRect(X(-2.12), 0, 5, h); g.fillStyle = 'rgba(255,246,242,.85)'; g.fillRect(X(2.15), 0, 5, h); g.fillRect(X(-6.6), 0, 5, h);
  for (let y = 0; y < h; y += 128) { g.fillStyle = 'rgba(255,246,242,.0)'; g.fillRect(0, y, w, 1); } });
roadTex.wrapT = THREE.RepeatWrapping; roadTex.repeat.set(1, 30); roadTex.anisotropy = 8;
const road = mesh(new THREE.PlaneGeometry(9.5, 600), new THREE.MeshStandardMaterial({ map: roadTex, roughness: .35, metalness: .15, envMapIntensity: .6, transparent: true, opacity: .84 }), -2.25, 0, 40, scene, false); road.rotation.x = -Math.PI / 2;
mesh(new THREE.BoxGeometry(3.4, .16, 600), toon(0xd9b8c4), 4.2, .08, 40, scene, false); mesh(new THREE.BoxGeometry(.18, .18, 600), toon(0xf6e8ee), 2.55, .09, 40, scene, false);
mesh(new THREE.BoxGeometry(3.2, .16, 600), toon(0xd9b8c4), -8.6, .08, 40, scene, false); mesh(new THREE.BoxGeometry(.18, .18, 600), toon(0xf6e8ee), -7.05, .09, 40, scene, false);
// ---------------------------------------------------------------- the strip: segments of deco hotels, palms and lamps that loop past
const SEG = 12, NSEG = 16, ZMIN = -70; const segs = [];
const PAST = [0xf6a6b8, 0x9fe3db, 0xc9b6f0, 0xffd6a0, 0xf7f0e6, 0xff9fb2, 0x8fd8f0, 0xe8c4ff];
const NEON = [0xff4fa6, 0x19d3c5, 0xffd36b, 0xb06bff];
const WORDS = ['betz', 'HOTEL', 'OCEAN', 'PALMS', 'BETZ', 'MOTEL', 'ODDS', 'VICE', 'YES / NO', 'LUCKY'];
function facadeTex(seed, hgt) { return canvasTex(256, 512, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); const rows = Math.max(3, Math.round(hgt / 3)), cols = 4;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const lit = hsh(seed * 31 + r, c * 7) > .45; const x = 18 + c * (w - 36) / cols, y = 26 + r * (h - 60) / rows; g.fillStyle = lit ? (hsh(r, c + seed) > .5 ? '#ffe2a8' : '#ffc6d8') : 'rgba(60,30,70,.55)'; g.fillRect(x + 6, y + 6, (w - 36) / cols - 14, (h - 60) / rows - 18); }
  g.fillStyle = 'rgba(80,30,80,.12)'; for (let y = 0; y < h; y += (h - 60) / rows) g.fillRect(0, y + 2, w, 4); }); }
function signTex(word, col) { return canvasTex(512, 160, (g, w, h) => { g.clearRect(0, 0, w, h); g.font = `900 ${word.length > 6 ? 84 : 110}px RB`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = col; g.shadowBlur = 28; g.lineWidth = 14; g.strokeStyle = col; g.strokeText(word, w / 2, h / 2 + 6); g.strokeText(word, w / 2, h / 2 + 6); g.shadowBlur = 6; g.lineWidth = 5; g.strokeStyle = '#fff6fb'; g.strokeText(word, w / 2, h / 2 + 6); }); }
const neonMat = c => new THREE.MeshBasicMaterial({ color: c, fog: false });
function buildSeg(i) { const g = new THREE.Group(); scene.add(g); const s = 100 + i;
  // a deco hotel on the left
  const hgt = 7 + hsh(s, 1) * 11, dep = 9 + hsh(s, 2) * 4, wid = SEG - 1.2, col = PAST[i % PAST.length], neon = NEON[(i * 3) % NEON.length], x0 = -10.3 - dep / 2;
  const b = mesh(new THREE.BoxGeometry(dep, hgt, wid), toon(col), x0, hgt / 2, 0, g);
  const f = mesh(new THREE.PlaneGeometry(wid - .4, hgt - .6), toon(col, { map: facadeTex(s, hgt) }), x0 + dep / 2 + .02, hgt / 2, 0, g, false); f.rotation.y = Math.PI / 2;
  mesh(new THREE.BoxGeometry(.5, .35, wid + .3), toon(0xfff3ea), x0 + dep / 2 + .1, hgt + .05, 0, g);
  if (hsh(s, 3) > .4) { const r = 1.3; const tw = mesh(new THREE.CylinderGeometry(r, r, hgt + 2.2, 24), toon(col), x0 + dep / 2 - r * .6, (hgt + 2.2) / 2, wid / 2 - r * .9, g); mesh(new THREE.CylinderGeometry(r + .15, r + .15, .3, 24), toon(0xfff3ea), tw.position.x, hgt + 2.2, tw.position.z, g);
    mesh(new THREE.BoxGeometry(.12, hgt + 1.8, .12), neonMat(neon), tw.position.x + r + .02, (hgt + 2) / 2, tw.position.z, g, false); }
  mesh(new THREE.BoxGeometry(.12, .12, wid), neonMat(neon), x0 + dep / 2 + .3, hgt - .5, 0, g, false);
  [-1, 1].forEach(k => mesh(new THREE.BoxGeometry(.4, hgt, .3), toon(0xfff3ea), x0 + dep / 2 + .1, hgt / 2, k * (wid / 2 - .1), g));
  // ground floor: an awning and a glowing shopfront
  const aw = mesh(new THREE.BoxGeometry(1.4, .08, wid * .7), toon(NEON[(i + 1) % 4]), x0 + dep / 2 + .7, 3.0, 0, g); aw.rotation.z = -.25;
  const shop = mesh(new THREE.PlaneGeometry(wid * .66, 2.2), new THREE.MeshBasicMaterial({ color: 0xffc8a8, fog: true }), x0 + dep / 2 + .03, 1.3, 0, g, false); shop.rotation.y = Math.PI / 2;
  // a neon sign on most of them
  if (i % 3 !== 1) { const word = WORDS[i % WORDS.length], sc = NEON[(i + 2) % 4]; const sg = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.6), new THREE.MeshBasicMaterial({ map: signTex(word, '#' + sc.toString(16).padStart(6, '0')), transparent: true, depthWrite: false, fog: false }));
    if (i % 2) { sg.position.set(x0 + dep / 2 + .25, Math.min(hgt - 1.6, 5.4 + hsh(s, 4) * 3), 0); sg.rotation.y = Math.PI / 2; } else { sg.position.set(x0 + dep / 2 - 1.5, hgt + 1.1, 0); sg.rotation.y = Math.PI / 2; mesh(new THREE.BoxGeometry(.1, 1.2, 4), toon(0x3a2a40), x0 + dep / 2 - 1.6, hgt + .6, 0, g); }
    sg.layers.set(1); g.add(sg); }
  // the promenade on the right: a palm and a lamp
  palm(4.9, -2 + hsh(s, 5) * 2, 6.4 + hsh(s, 6) * 2.2, -.4 + hsh(s, 7) * .9, s, g);
  const lamp = new THREE.Group(); lamp.position.set(3.15, 0, 4); g.add(lamp); mesh(new THREE.CylinderGeometry(.07, .1, 6, 10), toon(0x3a2a40), 0, 3, 0, lamp); mesh(new THREE.BoxGeometry(1.4, .08, .08), toon(0x3a2a40), -.65, 5.95, 0, lamp);
  mesh(new THREE.BoxGeometry(.5, .14, .26), neonMat(0xfff0c8), -1.25, 5.85, 0, lamp, false); glow(0xffd9a0, 1.6, -1.25, 5.7, 0, lamp, .7);
  // a lamp on the hotel side too
  const l2 = lamp.clone(); l2.position.set(-7.4, 0, -2); l2.rotation.y = Math.PI; g.add(l2); l2.traverse(o => { if (o.isSprite) o.layers.set(1); });
  // the beach: umbrellas, towels, a lifeguard tower now and then
  for (let u = 0; u < 2; u++) { const ux = 9 + hsh(s, 20 + u) * 9, uz = -4 + u * 6 + hsh(s, 22 + u) * 2, uc = [0xff4fa6, 0x19d3c5, 0xffd36b, 0xffffff, 0xb06bff][(i + u) % 5];
    mesh(new THREE.CylinderGeometry(.04, .04, 2.2, 6), toon(0xf6f0ea), ux, 1.1, uz, g); const um = mesh(new THREE.ConeGeometry(1.3, .55, 12, 1, true), toon(uc, { side: THREE.DoubleSide }), ux, 2.2, uz, g); um.rotation.z = (hsh(s, 24 + u) - .5) * .3;
    const tw = mesh(new THREE.PlaneGeometry(.9, 1.8), toon([0xffd36b, 0x19d3c5, 0xff7ab8][(i + u) % 3]), ux + 1.3, .04, uz + .4, g, false); tw.rotation.x = -Math.PI / 2; tw.rotation.z = hsh(s, 26) * 1.5; }
  if (i % 4 === 0) { const lt = new THREE.Group(); lt.position.set(17, 0, 2); g.add(lt); [-1, 1].forEach(a => [-1, 1].forEach(b => mesh(new THREE.BoxGeometry(.1, 2.2, .1), toon(0xf6f0ea), a * .7, 1.1, b * .7, lt)));
    mesh(new THREE.BoxGeometry(1.9, 1.2, 1.9), toon(0x8fd8f0), 0, 2.8, 0, lt); mesh(new THREE.ConeGeometry(1.6, .7, 4), toon(0xff5a6a), 0, 3.75, 0, lt).rotation.y = Math.PI / 4; mesh(new THREE.BoxGeometry(.9, .5, .02), toon(0xff5a6a), .96, 2.9, 0, lt).rotation.y = Math.PI / 2; }
  g.position.z = ZMIN + i * SEG; segs.push(g); }
for (let i = 0; i < NSEG; i++) buildSeg(i);
// ---------------------------------------------------------------- the skyline behind the hotels: deco towers, spires, neon crowns
const TSPAN = 280, towers = []; const towerTex = [0, 1, 2, 3, 4, 5].map(k => { const t = facadeTex(500 + k, 30); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 3); return t; });
for (let i = 0; i < 34; i++) { const g = new THREE.Group(); scene.add(g); const s = 900 + i, h = 16 + hsh(s, 1) * 46, w = 6 + hsh(s, 2) * 6, dpt = 6 + hsh(s, 3) * 6, col = [0xe8b4d8, 0xb8d4f0, 0xf0d0b0, 0xd0c0f0, 0xf6e6f0, 0xa8e0d8][i % 6];
  const x = -26 - hsh(s, 4) * 46; mesh(new THREE.BoxGeometry(dpt, h, w), toon(col, { map: towerTex[i % 6] }), 0, h / 2, 0, g, false);
  mesh(new THREE.BoxGeometry(dpt * .7, h * .14, w * .7), toon(col), 0, h + h * .07, 0, g, false);
  if (hsh(s, 5) > .5) { mesh(new THREE.ConeGeometry(Math.min(w, dpt) * .25, h * .35, 4), toon(0xfff3ea), 0, h * 1.14 + h * .175, 0, g, false); glow(0xff3048, 2.2, 0, h * 1.33, 0, g, .9); }
  const nc = NEON[i % 4]; mesh(new THREE.BoxGeometry(dpt + .1, .25, w + .1), neonMat(nc), 0, h - .4, 0, g, false); glow(nc, 10, dpt / 2 + 1, h - .4, 0, g, .35);
  g.position.set(x, 0, ZMIN + (i / 34) * TSPAN + hsh(s, 6) * 6); towers.push(g); }
// ---------------------------------------------------------------- boats on the water
const boats = [];
for (let i = 0; i < 5; i++) { const g = new THREE.Group(); scene.add(g); const sc = .9 + hsh(i, 61) * 1.4; g.scale.setScalar(sc);
  const hull = new THREE.BoxGeometry(2.2, .8, 7); const hp = hull.attributes.position; for (let k = 0; k < hp.count; k++) { if (hp.getZ(k) > 0) hp.setX(k, hp.getX(k) * (1 - hp.getZ(k) / 3.6 * .85)); if (hp.getY(k) < 0) hp.setX(k, hp.getX(k) * .7); } hull.computeVertexNormals();
  mesh(hull, toon(0xfaf6f2), 0, .3, 0, g); mesh(new THREE.BoxGeometry(1.5, .7, 2.6), toon(i % 2 ? 0x19d3c5 : 0xff4fa6), 0, 1.05, -.8, g); mesh(new THREE.BoxGeometry(1.4, .3, 1.8), new THREE.MeshStandardMaterial({ color: 0x1a1428, metalness: .8, roughness: .1 }), 0, 1.25, -.5, g);
  const wk = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 14), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .35, depthWrite: false })); wk.rotation.x = -Math.PI / 2; wk.position.set(0, .03, -10); wk.layers.set(1); g.add(wk);
  glow(0xffffff, 1.2, 0, 1.8, 3, g, .9); glow(0xff3048, .9, -1, .9, -3.4, g, .8);
  g.position.set(34 + i * 18 + hsh(i, 62) * 8, 0, ZMIN + i * 56); g.userData.v = 4 + hsh(i, 63) * 6; boats.push(g); }
// ---------------------------------------------------------------- a news chopper circling with its searchlight
const heli = new THREE.Group(); scene.add(heli); const HB = toon(0x2a2234), HW = toon(0xfff6f2);
{ const b = mesh(new THREE.SphereGeometry(1, 18, 12), HW, 0, 0, 0, heli); b.scale.set(1, .9, 1.6); mesh(new THREE.SphereGeometry(.7, 14, 10), new THREE.MeshStandardMaterial({ color: 0x1a1428, metalness: .8, roughness: .1 }), 0, .15, .9, heli).scale.set(1, .8, 1);
  mesh(new THREE.CylinderGeometry(.12, .25, 4, 8), HW, 0, .2, -2.8, heli).rotation.x = Math.PI / 2; mesh(new THREE.BoxGeometry(.08, 1, .6), HB, 0, .7, -4.6, heli);
  [-1, 1].forEach(k => { mesh(new THREE.BoxGeometry(.08, .08, 2.6), HB, k * .8, -1.1, 0, heli); mesh(new THREE.BoxGeometry(.06, .5, .06), HB, k * .8, -.85, .6, heli); mesh(new THREE.BoxGeometry(.06, .5, .06), HB, k * .8, -.85, -.6, heli); });
  const st = mesh(new THREE.BoxGeometry(.6, 1, .25), toon(0xff4fa6), 0, .2, 0, heli); st.position.set(1.02, .1, -.2); }
const rotor = new THREE.Group(); rotor.position.y = 1.05; heli.add(rotor); [0, 1].forEach(k => mesh(new THREE.BoxGeometry(9, .04, .3), HB, 0, 0, 0, rotor).rotation.y = k * Math.PI / 2);
const tailR = new THREE.Group(); tailR.position.set(.12, .7, -4.6); heli.add(tailR); [0, 1].forEach(k => mesh(new THREE.BoxGeometry(.03, 1.4, .12), HB, 0, 0, 0, tailR).rotation.x = k * Math.PI / 2);
const heliBlink = glow(0xff3048, 1.4, 0, -.9, -1, heli, 1);
const searchCone = new THREE.Mesh(new THREE.ConeGeometry(4, 22, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff4d8, transparent: true, opacity: .07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
searchCone.geometry.translate(0, -11, 0); searchCone.layers.set(1); scene.add(searchCone);
// ---------------------------------------------------------------- oncoming traffic
const traffic = []; const TC = [0xffffff, 0xff5a6a, 0x2a2a3a, 0xffd36b, 0x8fd8f0];
for (let i = 0; i < 4; i++) { const g = new THREE.Group(); scene.add(g); const c = toon(TC[i % TC.length]);
  mesh(new RoundedBoxGeometry(1.9, .55, 4.6, 3, .1), c, 0, .6, 0, g); mesh(new RoundedBoxGeometry(1.6, .45, 2.2, 3, .1), new THREE.MeshStandardMaterial({ color: 0x1a1428, metalness: .8, roughness: .1 }), 0, 1.08, .2, g);
  [[.85, 1.5], [-.85, 1.5], [.85, -1.5], [-.85, -1.5]].forEach(([x, z]) => mesh(new THREE.CylinderGeometry(.32, .32, .22, 18), toon(0x15101a), x, .32, z, g).rotation.z = Math.PI / 2);
  [-.6, .6].forEach(x => { mesh(new THREE.BoxGeometry(.4, .14, .05), neonMat(0xfff4d8), x, .7, -2.32, g, false); glow(0xfff0d0, 1.2, x, .7, -2.5, g, .9); mesh(new THREE.BoxGeometry(.4, .12, .05), neonMat(0xff3048), x, .72, 2.32, g, false); });
  g.position.set(-4.5, 0, 30 + i * 38); traffic.push({ g, v: 9 + i * 2.5 }); }

// ================================================================ the lowrider
const car = new THREE.Group(); scene.add(car);
const PAINT = toon(0x10b3b3);
const CHROME = new THREE.MeshStandardMaterial({ color: 0xf4f0ea, metalness: 1, roughness: .1, envMapIntensity: 1.3 });
const GOLD = new THREE.MeshStandardMaterial({ color: 0xe0ac48, metalness: 1, roughness: .18, envMapIntensity: 1.3 });
const GLASS = new THREE.MeshStandardMaterial({ color: 0x1a1428, metalness: .9, roughness: .04, envMapIntensity: 1.5 });
const RUB = toon(0x1e1a22), WHITE = toon(0xf3eee4), INT = toon(0x4a2a3a);
function extrudeSide(pts, holes, depth, bevel, mat) { const sh = new THREE.Shape(); pts.forEach(([x, y, k], i) => { if (k === 'arc') sh.absarc(x, y, holes, Math.PI, 0, true); else i ? sh.lineTo(x, y) : sh.moveTo(x, y); });
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 24 }); g.translate(0, 0, -depth / 2); g.rotateY(-Math.PI / 2); return mesh(g, mat, 0, 0, 0, car); }
const WZ = 1.7, WR = .44;
extrudeSide([[2.78, .36], [2.84, .62], [2.78, .76], [2.4, .8], [1.0, .85], [-1.6, .85], [-2.62, .84], [-2.86, .74], [-2.84, .38], [-WZ - WR, .36], [-WZ, .34, 'arc'], [WZ - WR, .36], [WZ, .34, 'arc'], [WZ + WR, .36], [2.78, .36]], WR, 1.86, .07, PAINT);
extrudeSide([[.85, .86], [.12, 1.3], [-.95, 1.32], [-1.6, .87]], 0, 1.62, .04, GLASS);
mesh(new RoundedBoxGeometry(1.7, .07, 1.16, 2, .03), toon(0xf1e6d2), 0, 1.345, -.42, car);
[-1, 1].forEach(s => { mesh(new THREE.BoxGeometry(.03, .03, 1.12), CHROME, s * .835, 1.31, -.42, car); const a = mesh(new THREE.BoxGeometry(.035, .035, .84), CHROME, s * .83, 1.09, .48, car); a.rotation.x = Math.atan2(.44, .73);
  const m = new THREE.Group(); m.position.set(s * .98, .98, .72); car.add(m); mesh(new THREE.BoxGeometry(.03, .1, .03), CHROME, 0, -.03, 0, m); mesh(new THREE.CylinderGeometry(.07, .07, .03, 18), CHROME, s * .05, .05, 0, m).rotation.z = Math.PI / 2;
  mesh(new THREE.BoxGeometry(.03, .03, .16), CHROME, s * 1.0, .74, -.25, car);
  const sk = new THREE.Shape(); sk.moveTo(-.46, 0); sk.absarc(0, 0, .46, Math.PI, 0, true); sk.lineTo(-.46, 0); const skg = new THREE.ExtrudeGeometry(sk, { depth: .04, bevelEnabled: true, bevelThickness: .015, bevelSize: .015, bevelSegments: 2, curveSegments: 24 }); skg.rotateY(-Math.PI / 2);
  mesh(skg, PAINT, s * 1.0 - (s > 0 ? 0 : -.04), .34, -WZ, car); mesh(new THREE.BoxGeometry(.03, .025, .9), CHROME, s * 1.0, .37, -WZ, car); });
mesh(new THREE.BoxGeometry(1.7, .035, .035), CHROME, 0, .87, .85, car);
mesh(new THREE.CylinderGeometry(.01, .025, .07, 8), GOLD, 0, .9, 2.5, car);
[-1, 1].forEach(s => { const p = mesh(new THREE.BoxGeometry(.06, .06, .86), PAINT, s * .84, 1.08, .49, car); p.rotation.x = -Math.atan2(.44, .73) + Math.PI / 2 - Math.PI / 2; p.rotation.x = Math.atan2(.44, .73); const q = mesh(new THREE.BoxGeometry(.07, .5, .14), PAINT, s * .845, 1.1, -.42, car); });
// trim, bumpers, lights, grille
[-1, 1].forEach(s => { mesh(new THREE.BoxGeometry(.03, .035, 4.9), CHROME, s * 1.0, .62, 0, car); mesh(new THREE.BoxGeometry(.02, .02, 2.4), CHROME, s * .9, .865, -.4, car); });
mesh(new RoundedBoxGeometry(2.04, .16, .18, 3, .06), CHROME, 0, .4, 2.96, car); mesh(new RoundedBoxGeometry(2.04, .16, .18, 3, .06), CHROME, 0, .4, -2.98, car);
const grille = canvasTex(512, 128, (g, w, h) => { g.fillStyle = '#16121c'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8eef4'; for (let x = 4; x < w; x += 14) g.fillRect(x, 0, 4, h); g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6); });
mesh(new THREE.PlaneGeometry(1.0, .2), new THREE.MeshBasicMaterial({ map: grille }), 0, .58, 2.935, car, false);
[-1, 1].forEach(s => { [-.13, .13].forEach(dx => { mesh(new THREE.CylinderGeometry(.075, .075, .05, 20), CHROME, s * .72 + dx, .6, 2.92, car).rotation.x = Math.PI / 2; mesh(new THREE.CircleGeometry(.06, 20), new THREE.MeshBasicMaterial({ color: 0xfff1d0 }), s * .72 + dx, .6, 2.95, car, false); });
  mesh(new THREE.BoxGeometry(.5, .1, .04), new THREE.MeshBasicMaterial({ color: 0xff3048 }), s * .62, .62, -2.94, car, false); });

const plate = canvasTex(256, 128, (c, w, h) => { c.fillStyle = '#f7f3ea'; c.fillRect(0, 0, w, h); c.strokeStyle = '#1d1624'; c.lineWidth = 6; c.strokeRect(4, 4, w - 8, h - 8); c.fillStyle = '#e8743b'; c.font = '700 18px JB'; c.textAlign = 'center'; c.fillText('SUNSHINE STATE', w / 2, 30); c.fillStyle = '#c23a7a'; c.font = '900 64px RB'; c.fillText('BETZ', w / 2, 98); });
mesh(new THREE.PlaneGeometry(.42, .21), toon(0xffffff, { map: plate }), 0, .26, 3.0, car, false).userData.detail = true;
// gold wire wheels, whitewalls, knock-offs
function wheel(x, z) { const g = new THREE.Group(); g.name = 'wheel'; g.position.set(x, .34, z); car.add(g); const s = Math.sign(x);
  mesh(new THREE.CylinderGeometry(.34, .34, .22, 32), RUB, 0, 0, 0, g).rotation.z = Math.PI / 2;
  const ww = mesh(new THREE.TorusGeometry(.28, .035, 8, 40), WHITE, s * .112, 0, 0, g); ww.rotation.y = Math.PI / 2;
  const rim = mesh(new THREE.TorusGeometry(.225, .025, 8, 40), GOLD, s * .11, 0, 0, g); rim.rotation.y = Math.PI / 2;
  for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, b = a + (i % 2 ? .45 : -.45), sp = new THREE.Vector3(s * .12, Math.sin(b) * .05, Math.cos(b) * .05), ep = new THREE.Vector3(s * .1, Math.sin(a) * .22, Math.cos(a) * .22);
    const d = ep.clone().sub(sp), m = mesh(new THREE.CylinderGeometry(.006, .006, d.length(), 4), GOLD, 0, 0, 0, g, false); m.position.copy(sp).add(ep).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); }
  mesh(new THREE.CylinderGeometry(.06, .07, .05, 16), GOLD, s * .13, 0, 0, g).rotation.z = Math.PI / 2;
  for (let k = 0; k < 2; k++) { const e = mesh(new THREE.BoxGeometry(.02, .16, .03), GOLD, s * .16, 0, 0, g, false); e.rotation.x = k * Math.PI / 2 + .3; } }
[[.92, WZ], [-.92, WZ], [.92, -WZ], [-.92, -WZ]].forEach(([x, z]) => wheel(x, z));
mesh(new THREE.BoxGeometry(1.7, .1, 4.6), toon(0x150f18), 0, .3, 0, car, false);

// ================================================================ the hood: an open case of cash, slips in the wind
const hood = new THREE.Group(); hood.position.set(0, .86, 0); car.add(hood);
const LEATHER = toon(0x2a1a22), BILL = toon(0x9ccc84), BAND = toon(0xf4e3b8);
const cs = new THREE.Group(); cs.position.set(-.05, 0, 1.55); cs.rotation.y = .5; cs.scale.setScalar(.85); hood.add(cs);
mesh(new RoundedBoxGeometry(.78, .12, .52, 2, .02), LEATHER, 0, .06, 0, cs);
const lid = new THREE.Group(); lid.position.set(0, .12, -.26); lid.rotation.x = -2.75; cs.add(lid); mesh(new RoundedBoxGeometry(.78, .1, .52, 2, .02), LEATHER, 0, .05, .26, lid); mesh(new THREE.BoxGeometry(.72, .02, .46), toon(0x6b1f3a), 0, -.005, .26, lid);
[-1, 1].forEach(s => { mesh(new THREE.BoxGeometry(.06, .03, .03), GOLD, s * .2, .1, .27, cs); mesh(new THREE.BoxGeometry(.04, .04, .04), GOLD, s * .37, .1, .25, cs); });
for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const st = new THREE.Group(); st.position.set(-.27 + c * .18, .11, -.16 + r * .16); st.rotation.y = (hsh(r, c) - .5) * .12; cs.add(st); mesh(new THREE.BoxGeometry(.165, .045, .075), BILL, 0, .02, 0, st); mesh(new THREE.BoxGeometry(.035, .047, .077), BAND, 0, .02, 0, st); }
function stack(x, z, ry, n) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; hood.add(g); for (let i = 0; i < n; i++) { const s = new THREE.Group(); s.position.set((hsh(i, 9) - .5) * .02, i * .045, 0); s.rotation.y = (hsh(i, 8) - .5) * .25; g.add(s); mesh(new THREE.BoxGeometry(.165, .045, .075), BILL, 0, .022, 0, s); mesh(new THREE.BoxGeometry(.035, .047, .077), BAND, 0, .022, 0, s); } }
stack(.55, 1.25, .5, 4); stack(.7, 1.45, -.3, 2); stack(-.62, 1.95, .2, 3);
const paperTex = (w, h, draw) => canvasTex(w, h, (g, W2, H2) => { g.fillStyle = '#f3ead6'; g.fillRect(0, 0, W2, H2); draw(g, W2, H2); for (let i = 0; i < 400; i++) { g.fillStyle = 'rgba(120,90,60,.05)'; g.fillRect(hsh(i, 71) * W2, hsh(i, 72) * H2, 3, 3); } });
const ticketTex = q => paperTex(160, 256, (c, w, h) => { c.fillStyle = '#1d1624'; c.font = '800 22px JB'; c.fillText('BETZ', 12, 30); c.fillRect(12, 40, w - 24, 3); c.font = '700 18px JB'; c.fillText(q[0], 12, 74); c.fillStyle = q[1] === 'YES' ? '#1f9c58' : '#d23a4a'; c.font = '900 40px RB'; c.fillText(q[1], 12, 124); c.fillStyle = '#1d1624'; c.font = '700 20px JB'; c.fillText('@ ' + q[2] + '%', 12, 158); for (let i = 0; i < 18; i++) c.fillRect(12 + i * 7, 200, (i * 7) % 3 + 2, 36); });
const TQ = [['BOND?', 'YES', 72], ['RUG?', 'NO', 82], ['2X?', 'NO', 69], ['ATH?', 'YES', 57], ['DEV SELL?', 'YES', 64], ['$1M?', 'NO', 78]];
function ticket(parent, x, y, z, ry, i) { const m = mesh(new THREE.PlaneGeometry(.13, .21), toon(0xffffff, { map: ticketTex(TQ[i % TQ.length]), side: THREE.DoubleSide }), x, y, z, parent, false); m.rotation.set(-Math.PI / 2, 0, ry); m.userData.detail = true; return m; }
const TICK = [[.35, .01, 2.0, .7, 0], [-.4, .01, 1.15, -.4, 1], [.62, .2, 1.8, .2, 2], [.1, .55, 1.0, 1.0, 3], [-.7, .8, .6, -.6, 4], [.9, .95, .3, .3, 5], [-.2, 1.25, -.2, -1.2, 0]];
TICK.slice(0, 2).forEach(([x, y, z, r, i]) => ticket(hood, x, y, z, r, i));
// brick phone + shades
const bp = new THREE.Group(); bp.position.set(.62, 0, 1.95); bp.rotation.y = -.6; hood.add(bp); const bpb = mesh(new RoundedBoxGeometry(.075, .23, .05, 2, .012), toon(0x2a2630), 0, .028, 0, bp); bpb.rotation.x = -Math.PI / 2; mesh(new THREE.CylinderGeometry(.008, .008, .12, 6), toon(0x2a2630), 0, .03, -.15, bp).rotation.x = Math.PI / 2; mesh(new THREE.BoxGeometry(.05, .002, .05), new THREE.MeshBasicMaterial({ color: 0x9fe8b4 }), 0, .055, -.06, bp, false);
const sg = new THREE.Group(); sg.position.set(-.55, .015, 1.45); sg.rotation.y = .8; hood.add(sg); [-1, 1].forEach(s => { const l = mesh(new THREE.SphereGeometry(.045, 14, 10), toon(0x15101c), s * .055, .01, 0, sg); l.scale.set(1.25, .35, .9); }); mesh(new THREE.BoxGeometry(.04, .01, .01), GOLD, 0, .018, .01, sg);


// ================================================================ light: the sun going down over the sea, violet fill, headlights
scene.add(new THREE.HemisphereLight(0x9a7ad8, 0x2a1840, .95));
const sun = new THREE.DirectionalLight(0xffa070, 2.6); sun.position.set(40, 8, 18); sun.target.position.set(0, 0, 2); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 90 }); scene.add(sun, sun.target);
const rimL = new THREE.DirectionalLight(0xff5fae, 1.1); rimL.position.set(-20, 6, -10); scene.add(rimL);
const head = new THREE.SpotLight(0xfff0d0, 40, 30, .55, .7, 1.4); head.position.set(0, .8, 2.9); head.target.position.set(0, 0, 16); scene.add(head, head.target);
// ================================================================ rig: body on hydraulics, rolling wheels, a mirror for the wet road
car.position.set(.15, 0, 0);
const body = new THREE.Group(); body.name = 'body'; [...car.children].forEach(ch => { if (ch.name !== 'wheel') body.add(ch); }); car.add(body);
[-1, 1].forEach(s => { [-.13, .13].forEach(dx => glow(0xfff0d0, .6, s * .72 + dx, .6, 3.0, body, .9)); glow(0xff3048, .5, s * .62, .62, -3.0, body, .8); });

car.updateMatrixWorld(true);
const carM = car.clone(true); carM.scale.y = -1; carM.traverse(o => { o.castShadow = false; o.layers.set(1); }); scene.add(carM); const bodyM = carM.getObjectByName('body');
const wheels = [], wheelsM = []; car.children.forEach(c => c.name === 'wheel' && wheels.push(c)); carM.children.forEach(c => c.name === 'wheel' && wheelsM.push(c));
const fronds = []; scene.traverse(o => { if (o.isMesh && o.material === frondMat) { fronds.push({ m: o, ry: o.rotation.y, rz: o.rotation.z, k: Math.random() * 6 }); o.layers.set(1); } });
// ================================================================ slips and bills blowing off the hood into the slipstream
const caseW = new THREE.Vector3();
const billTex = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#9ccc84'; g.fillRect(0, 0, w, h); g.strokeStyle = '#4f7a46'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#4f7a46'; g.beginPath(); g.arc(w / 2, h / 2, 34, 0, 7); g.fill(); g.font = '900 40px RB'; g.fillText('100', 20, 52); });
const fly = []; const NF = PHONE ? 18 : 34;
for (let i = 0; i < NF; i++) { const bill = i % 3 === 2; const m = new THREE.Mesh(bill ? new THREE.PlaneGeometry(.2, .1) : new THREE.PlaneGeometry(.13, .21), toon(0xffffff, { map: bill ? billTex : ticketTex(TQ[i % TQ.length]), side: THREE.DoubleSide })); m.castShadow = true; scene.add(m); fly.push({ m, life: -Math.random() * 6, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Vector3(), w: new THREE.Vector3() }); }
function spawn(f) { cs.getWorldPosition(caseW); f.p.copy(caseW).add(new THREE.Vector3((Math.random() - .5) * .5, .15, (Math.random() - .5) * .4)); f.v.set((Math.random() - .5) * 1.4, 1.1 + Math.random() * 1.2, -1 - Math.random() * 2); f.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); f.w.set((Math.random() - .5) * 9, (Math.random() - .5) * 9, (Math.random() - .5) * 6); f.life = 0; f.max = 3 + Math.random() * 3; }

// ================================================================ ink + grade, in real time
const near = .05, far = 420;
const cam = new THREE.PerspectiveCamera(32, 1, near, far);
let rtC, rtN; const normalMat = new THREE.MeshNormalMaterial();
const post = new THREE.ShaderMaterial({ uniforms: { tC: { value: null }, tN: { value: null }, tD: { value: null }, px: { value: new THREE.Vector2() }, time: { value: 0 }, dim: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
  fragmentShader: `uniform sampler2D tC; uniform sampler2D tN; uniform sampler2D tD; uniform vec2 px; uniform float time; uniform float dim; varying vec2 vUv;
float lin(float d){ float z = d * 2. - 1.; return (2. * ${near.toFixed(3)} * ${far.toFixed(1)}) / (${far.toFixed(1)} + ${near.toFixed(3)} - z * (${far.toFixed(1)} - ${near.toFixed(3)})); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){ vec3 c = texture2D(tC, vUv).rgb; vec3 n0 = texture2D(tN, vUv).rgb; float d0 = lin(texture2D(tD, vUv).r); float e = 0.;
  vec2 o[4]; o[0] = vec2(px.x, 0.); o[1] = vec2(-px.x, 0.); o[2] = vec2(0., px.y); o[3] = vec2(0., -px.y);
  for (int i = 0; i < 4; i++) { vec3 n = texture2D(tN, vUv + o[i]).rgb; float d = lin(texture2D(tD, vUv + o[i]).r); e = max(e, length(n - n0) * 1.3); e = max(e, abs(d - d0) / max(d0, .01) * 7.); }
  e = smoothstep(.4, .95, e) * (1. - smoothstep(25., 60., d0));
  c = mix(c, vec3(.13, .05, .17), e * .82);
  float l = dot(c, vec3(.299, .587, .114)); c = mix(vec3(l), c, 1.1); c += vec3(.02, 0., -.015) * l;
  vec2 q = vUv - .5; c *= 1. - .35 * smoothstep(.35, .95, length(q * vec2(1.25, 1.)));
  c += (hash(vUv * 900. + time) - .5) * .035;
  c = mix(c, vec3(.32, .09, .24) * (.4 + l), dim);
  gl_FragColor = vec4(c, 1.);
#include <colorspace_fragment>
}` });
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post); const qs = new THREE.Scene(); qs.add(quad); const qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
function size() { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); const pw = Math.round(w * DPR), ph = Math.round(h * DPR);
  rtC?.dispose(); rtN?.dispose(); rtC = new THREE.WebGLRenderTarget(pw, ph, { samples: 4, type: THREE.HalfFloatType }); rtN = new THREE.WebGLRenderTarget(pw, ph, { depthTexture: new THREE.DepthTexture(pw, ph) });
  post.uniforms.tC.value = rtC.texture; post.uniforms.tN.value = rtN.texture; post.uniforms.tD.value = rtN.depthTexture; post.uniforms.px.value.set(1.15 / pw, 1.15 / ph); cam.aspect = w / h; cam.updateProjectionMatrix(); }
addEventListener('resize', size); size();


// ================================================================ the cinematography: four tracking shots that breathe into each other
const P = innerWidth / innerHeight < .9;
const SHOTS = P ? [
  { p: [4.2, 1.2, 12.5], t: [-.2, 2.6, 0], f: 44 }, { p: [20, 14, 30], t: [-5, 2, 2], f: 52, m: [-2, 2, -4] }, { orbit: 1, r: 13, h: 4.2, a0: .6, a1: 2.4, t: [0, 2.4, 0], f: 48 },
  { p: [-2, 10, -20], t: [0, 2, 30], f: 50, m: [0, 2, 3] }, { p: [10, 40, -4], t: [-4, 0, 18], f: 52, m: [0, 4, 6] }, { p: [1.4, .55, 14], t: [-.2, 2.8, -2], f: 42 }] : [
  { p: [3.3, .85, 7.4], t: [-.15, 2.0, 0], f: 36 }, { p: [16, 10, 21], t: [-5, 1.6, 1], f: 40, m: [-3, 2, -5] }, { orbit: 1, r: 9.5, h: 3.2, a0: .55, a1: 2.5, t: [0, 1.9, 0], f: 38 },
  { p: [6.8, .7, .6], t: [-1.2, 2.0, .4], f: 36 }, { p: [-2.2, 7, -15], t: [0, 2.2, 28], f: 42, m: [0, 1.5, 3] }, { p: [9, 30, -8], t: [-4, 0, 16], f: 46, m: [0, 4, 5] }, { p: [1.1, .45, 9.6], t: [-.4, 2.15, -2], f: 34 }];
const sm = x => x * x * x * (x * (x * 6 - 15) + 10); const V = a => new THREE.Vector3(...a);
const SHOT = 7.5, BLEND = 2.6; let mode = 'home', dimV = 0, hopT = 4, mx = 0, my = 0;
addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
function shotAt(s, f) { if (s.orbit) { const a = s.a0 + (s.a1 - s.a0) * f; return { p: new THREE.Vector3(Math.sin(a) * s.r, s.h + Math.sin(f * Math.PI) * .8, Math.cos(a) * s.r), t: V(s.t), f: s.f }; }
  const m = s.m || [-.2, .06, .15]; return { p: V(s.p).add(new THREE.Vector3(m[0] * f, m[1] * f, m[2] * f)), t: V(s.t), f: s.f }; }
function camAt(t) { const n = SHOTS.length, i = Math.floor(t / SHOT) % n, f = (t % SHOT) / SHOT, A = shotAt(SHOTS[i], f), B = shotAt(SHOTS[(i + 1) % n], 0);
  const k = sm(Math.max(0, (t % SHOT - (SHOT - BLEND)) / BLEND)); cam.position.lerpVectors(A.p, B.p, k); const tt = new THREE.Vector3().lerpVectors(A.t, B.t, k); cam.fov = A.f + (B.f - A.f) * k;
  cam.position.x += mx * .35 + Math.sin(t * 2.3) * .015; cam.position.y += -my * .18 + Math.sin(t * 3.1) * .012; cam.lookAt(tt); cam.updateProjectionMatrix(); }
// ================================================================ the GTA radar (bottom left), drawn from the live world
const radar = document.getElementById('radar'); const rg = radar ? radar.getContext('2d') : null;
const blips = Array.from({ length: 7 }, (_, i) => ({ x: -30 + Math.random() * 60, z: Math.random() * 160 - 40, c: ['#ff4fa6', '#2fe0a8', '#ffd36b'][i % 3] }));
function drawRadar(speed, dt) { if (!rg) return; const S = radar.width, c = S / 2, k = S / 70; rg.clearRect(0, 0, S, S); rg.save(); rg.beginPath(); rg.arc(c, c, c - 3, 0, 7); rg.clip();
  rg.fillStyle = 'rgba(30,14,40,.82)'; rg.fillRect(0, 0, S, S); rg.fillStyle = 'rgba(70,140,170,.55)'; rg.fillRect(c + 6 * k, 0, S, S);
  rg.fillStyle = 'rgba(240,200,170,.35)'; rg.fillRect(c + 2.6 * k, 0, 3.4 * k, S); rg.fillStyle = 'rgba(120,100,130,.9)'; rg.fillRect(c - 7 * k, 0, 9.5 * k, S);
  rg.fillStyle = 'rgba(255,207,74,.9)'; rg.fillRect(c - 2.3 * k, 0, 2, S);
  for (const g of segs) { const y = c - g.position.z * k; rg.fillStyle = 'rgba(200,170,220,.55)'; rg.fillRect(c - 22 * k, y - 5.4 * k, 11 * k, 10.8 * k); rg.fillStyle = 'rgba(80,200,120,.8)'; rg.beginPath(); rg.arc(c + 4.9 * k, y, 2.2, 0, 7); rg.fill(); }
  for (const g of boats) { rg.fillStyle = '#fff6f2'; rg.fillRect(c + g.position.x * k * .6 - 2, c - g.position.z * k - 3, 4, 6); }
  rg.fillStyle = '#ffc65a'; rg.beginPath(); rg.arc(c + heli.position.x * k * .6, c - heli.position.z * k, 4.5, 0, 7); rg.fill();
  for (const t of traffic) { rg.fillStyle = '#fff'; rg.fillRect(c - 4.5 * k - 2, c - t.g.position.z * k - 4, 4, 8); }
  for (const b of blips) { b.z -= speed * dt; if (b.z < -50) { b.z += 200; b.x = -30 + Math.random() * 60; } const y = c - b.z * k, x = c + b.x * k * .6; rg.fillStyle = b.c; rg.beginPath(); rg.arc(x, y, 4, 0, 7); rg.fill(); rg.strokeStyle = 'rgba(0,0,0,.5)'; rg.lineWidth = 1.5; rg.stroke(); }
  rg.restore(); rg.fillStyle = '#fff6f2'; rg.beginPath(); rg.moveTo(c, c - 9); rg.lineTo(c + 6.5, c + 7); rg.lineTo(c, c + 3.5); rg.lineTo(c - 6.5, c + 7); rg.closePath(); rg.fill(); rg.strokeStyle = 'rgba(20,6,18,.9)'; rg.lineWidth = 2; rg.stroke();
  rg.strokeStyle = 'rgba(255,246,242,.75)'; rg.lineWidth = 4; rg.beginPath(); rg.arc(c, c, c - 3, 0, 7); rg.stroke(); }
// ================================================================ loop
const clock = new THREE.Clock(); let T = (+(new URLSearchParams(location.search).get('shot')) || 0) * 7.5 + .5, ready = false, frames = 0, slow = 0;
const SPEED = 13;
function frame() { requestAnimationFrame(frame); const dt = Math.min(clock.getDelta(), .05); if (document.hidden) return; const ts = mode === 'term' ? .45 : 1; T += dt * ts; const sp = SPEED * ts, d = sp * dt;
  dimV += ((mode === 'term' ? 1 : 0) - dimV) * Math.min(1, dt * 3); post.uniforms.dim.value = dimV * .55; post.uniforms.time.value = T % 10;
  camAt(T + 1);
  // the world rolls past
  for (const g of segs) { g.position.z -= d; if (g.position.z < ZMIN) g.position.z += NSEG * SEG; }
  for (const g of towers) { g.position.z -= d; if (g.position.z < ZMIN - 10) g.position.z += TSPAN; }
  for (const g of boats) { g.position.z -= d - g.userData.v * dt * ts; if (g.position.z < ZMIN - 20) g.position.z += 280; if (g.position.z > 220) g.position.z -= 280; g.position.y = Math.sin(T * 1.3 + g.position.x) * .08; g.rotation.z = Math.sin(T * 1.1 + g.position.x) * .03; }
  { const a = T * .22; heli.position.set(Math.sin(a) * 26 + 2, 17 + Math.sin(T * .5) * 2, Math.cos(a) * 20 + 14); heli.rotation.set(.12, a + Math.PI / 2 + Math.PI, Math.sin(T * .4) * .1);
    rotor.rotation.y += dt * 30; tailR.rotation.x += dt * 40; heliBlink.material.opacity = (T % 1) < .12 ? 1 : 0;
    searchCone.position.copy(heli.position).add(new THREE.Vector3(0, -1, 0)); const tgt = new THREE.Vector3(car.position.x, 0, car.position.z + Math.sin(T * .7) * 2); searchCone.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), tgt.sub(searchCone.position).normalize()); }
  for (const t of traffic) { t.g.position.z -= d + t.v * dt * ts; if (t.g.position.z < -60) t.g.position.z += 200 + Math.random() * 60; }
  roadTex.offset.y -= d / 20; seaTex.offset.x += dt * .004; seaTex.offset.y -= d / 140;
  for (const w of wheels) w.rotation.x += d / .34; for (const w of wheelsM) w.rotation.x += d / .34;
  // hydraulics: nose kicks up, the whole car hops, settles; plus road buzz
  hopT += dt; if (hopT > 8) hopT = 0; const h = hopT; let y = Math.sin(T * 23) * .006, rx = 0;
  if (h < .45) rx = -.13 * Math.sin(Math.PI * h / .45); else if (h < 1.3) { const u = (h - .45) / .85; y += .3 * Math.sin(Math.PI * u); rx = .04 * Math.sin(Math.PI * 2 * u); } else if (h < 2.2) { const u = (h - 1.3) / .9; y += .06 * Math.sin(Math.PI * u) * (1 - u); }
  body.position.y = y; body.rotation.x = rx; bodyM.position.y = y; bodyM.rotation.x = rx;
  for (const f of fronds) { f.m.rotation.y = f.ry + Math.sin(T * .9 + f.k) * .06; f.m.rotation.z = f.rz + Math.sin(T * 1.3 + f.k) * .05; }
  for (const f of fly) { f.life += dt; if (f.life < 0) { f.m.visible = false; continue; } if (!f.max || f.life > f.max || f.p.y < -.2) spawn(f);
    f.v.y -= .5 * dt; f.v.multiplyScalar(1 - .5 * dt); f.v.x += Math.sin(T * 2 + f.r.x) * .6 * dt; f.p.addScaledVector(f.v, dt); f.p.z -= d * .9; f.r.addScaledVector(f.w, dt);
    f.m.visible = true; f.m.position.copy(f.p); f.m.rotation.set(f.r.x, f.r.y, f.r.z); }
  if (mode === 'home') drawRadar(sp, dt);
  // render: colour (all layers), normals+depth (layer 0), then ink
  cam.layers.enableAll(); scene.overrideMaterial = null; R.setRenderTarget(rtC); R.render(scene, cam);
  cam.layers.set(0); scene.overrideMaterial = normalMat; const sh = R.shadowMap.autoUpdate; R.shadowMap.autoUpdate = false; R.setRenderTarget(rtN); R.render(scene, cam); R.shadowMap.autoUpdate = sh; scene.overrideMaterial = null;
  R.setRenderTarget(null); R.render(qs, qc);
  frames++; if (!ready && frames > 2) { ready = true; window.dispatchEvent(new Event('betz:scene')); }
  if (dt > .045) slow++; else slow = Math.max(0, slow - 1); if (slow > 40 && DPR > .8) { DPR = Math.max(.75, DPR - .25); R.setPixelRatio(DPR); size(); slow = 0; } }
frame();
const DPR0 = DPR; window.betzScene = { mode(m) { if (m === mode) return; mode = m; DPR = m === 'term' ? Math.min(.6, DPR0) : DPR0; R.setPixelRatio(DPR); size(); }, get ready() { return ready; } };
