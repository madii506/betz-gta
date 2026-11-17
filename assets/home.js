// betz home: a live sunset street, a candy lowrider on hydraulics, slips in the wind, inked in real time
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
// ================================================================ MOOD: low sun on a deco wall, candy lowrider, cash on the hood
const WALLZ = -2.6;
const envTex = canvasTex(1024, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a1d5c'); gr.addColorStop(.35, '#8a3f86'); gr.addColorStop(.48, '#ff8c6a'); gr.addColorStop(.52, '#ffc890'); gr.addColorStop(.56, '#4a2a48'); gr.addColorStop(1, '#1a1020'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff2d0'; g.beginPath(); g.ellipse(w * .78, h * .47, 60, 24, 0, 0, 7); g.fill(); g.fillStyle = '#f39a8a'; g.fillRect(w * .1, h * .3, w * .25, h * .18); });
envTex.mapping = THREE.EquirectangularReflectionMapping;
const pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromEquirectangular(envTex).texture; scene.environmentIntensity = .9;
scene.background = new THREE.Color(0x2a1d4c);
const sky = canvasTex(1024, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#34245f'); gr.addColorStop(.45, '#9a4a8c'); gr.addColorStop(.78, '#f07d6a'); gr.addColorStop(1, '#ffb878'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 22; i++) { const x = hsh(i, 1) * w, y = h * (.3 + hsh(i, 2) * .45), rw = 80 + hsh(i, 3) * 240, rh = 6 + hsh(i, 4) * 12; g.fillStyle = `rgba(255,${160 + hsh(i, 5) * 60 | 0},${150 + hsh(i, 6) * 50 | 0},${.15 + hsh(i, 7) * .2})`; g.beginPath(); g.ellipse(x, y, rw, rh, 0, 0, 7); g.fill(); } });
const skyM = new THREE.Mesh(new THREE.PlaneGeometry(220, 50), new THREE.MeshBasicMaterial({ map: sky, fog: false })); skyM.position.set(0, 14, -40); scene.add(skyM);
const stucco = canvasTex(2048, 512, (g, w, h) => { g.fillStyle = '#f3a294'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { const x = hsh(i, 11) * w, y = hsh(i, 12) * h, r = 10 + hsh(i, 13) * 40; g.fillStyle = hsh(i, 14) > .5 ? 'rgba(255,200,185,.05)' : 'rgba(170,70,90,.04)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  const gb2 = g.createLinearGradient(0, h * .8, 0, h); gb2.addColorStop(0, 'rgba(120,40,80,0)'); gb2.addColorStop(1, 'rgba(120,40,80,.25)'); g.fillStyle = gb2; g.fillRect(0, h * .8, w, h * .2); });
// the deco wall: stucco, speed lines, glass blocks, a fin, a planter
const wall = mesh(new THREE.PlaneGeometry(120, 3.0), toon(0xffffff, { map: stucco }), 0, 1.5, WALLZ, scene, false);
[2.42, 2.56].forEach(y => mesh(new THREE.BoxGeometry(120, .05, .08), toon(0xf9c3b4), 0, y, WALLZ + .04));
mesh(new THREE.BoxGeometry(120, .3, .34), toon(0xf6c2b0), 0, 3.05, WALLZ + .1); mesh(new THREE.BoxGeometry(120, .12, .4), toon(0xfbd6c6), 0, 3.24, WALLZ + .12); mesh(new THREE.BoxGeometry(120, .18, .2), toon(0xe9806f), 0, .09, WALLZ + .05, scene, false);
const gb = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#c9dfe0'; g.fillRect(0, 0, w, h); const n = 8, s = w / n; for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const gr = g.createRadialGradient(i * s + s / 2, k * s + s / 2, 4, i * s + s / 2, k * s + s / 2, s * .6); gr.addColorStop(0, '#fff3d8'); gr.addColorStop(.6, '#9fc8d0'); gr.addColorStop(1, '#6f9aa8'); g.fillStyle = gr; g.fillRect(i * s + 3, k * s + 3, s - 6, s - 6); } });
function glassBlocks(x, y, w, h) { mesh(new THREE.BoxGeometry(w + .14, h + .14, .08), toon(0xfbd6c6), x, y, WALLZ + .03); const m = mesh(new THREE.PlaneGeometry(w, h), toon(0xffffff, { map: gb }), x, y, WALLZ + .075, scene, false); m.userData.detail = true; }
function fin(x) { mesh(new RoundedBoxGeometry(.32, 3.9, .34, 2, .06), toon(0xf6c2b0), x, 1.95, WALLZ + .17); [3.3, 3.55, 3.8].forEach(y => mesh(new THREE.BoxGeometry(.36, .05, .38), toon(0xe9806f), x, y, WALLZ + .17)); }
const sign = canvasTex(1024, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.font = '900 210px RB'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(80,20,60,.35)'; g.fillText('betz', w / 2 + 10, h / 2 + 12); g.fillStyle = '#fff4ea'; g.fillText('betz', w / 2, h / 2); });
// ground: sidewalk, curb, asphalt with a dark wet patch
const asphalt = canvasTex(1024, 1024, (g, w, h) => { g.fillStyle = '#5e4a63'; g.fillRect(0, 0, w, h); for (let i = 0; i < 9000; i++) { g.fillStyle = hsh(i, 31) > .5 ? 'rgba(255,220,220,.05)' : 'rgba(20,8,30,.08)'; g.fillRect(hsh(i, 32) * w, hsh(i, 33) * h, 2, 2); } for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(25,10,30,.18)'; g.beginPath(); g.ellipse(hsh(i, 61) * w, hsh(i, 62) * h, 60 + hsh(i, 63) * 120, 30 + hsh(i, 64) * 60, hsh(i, 65) * 3, 0, 7); g.fill(); } });
asphalt.wrapS = asphalt.wrapT = THREE.RepeatWrapping; asphalt.repeat.set(5, 5);
const ground = mesh(new THREE.PlaneGeometry(160, 80), new THREE.MeshStandardMaterial({ map: asphalt, roughness: .45, metalness: .1, envMapIntensity: .35, transparent: true, opacity: .72 }), 0, 0, 0, scene, false); ground.rotation.x = -Math.PI / 2;
mesh(new THREE.BoxGeometry(120, .16, 1.3), toon(0xe7c9bd), 0, .08, WALLZ + .65, scene, false); mesh(new THREE.BoxGeometry(120, .16, .12), toon(0xf2c23c), 0, .08, WALLZ + 1.32, scene, false);
const frondTex = canvasTex(1024, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#fff';
  g.beginPath(); g.moveTo(0, h / 2 - 7); g.lineTo(w, h / 2 - 1); g.lineTo(w, h / 2 + 1); g.lineTo(0, h / 2 + 7); g.fill();
  for (let i = 0; i < 70; i++) { const x = 10 + i * 14.3, t = x / w, len = (h / 2 - 4) * Math.sin(Math.PI * Math.min(1, t * 1.1 + .05)) * (.8 + .2 * hsh(i, 41)), wd = 7 - t * 4;
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x - wd, h / 2); g.lineTo(x + wd, h / 2); g.lineTo(x + len * .55 + 2, h / 2 + s * len); g.closePath(); g.fill(); } } }, false);
frondTex.generateMipmaps = false; frondTex.minFilter = THREE.LinearFilter;
const frondMat = toon(0x3c8a4a, { alphaMap: frondTex, alphaTest: .4, side: THREE.DoubleSide, transparent: false });
const frondDepth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaMap: frondTex, alphaTest: .4, side: THREE.DoubleSide });
const barkTex = canvasTex(64, 512, (g, w, h) => { g.fillStyle = '#9a7a62'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 14) { g.fillStyle = 'rgba(70,40,40,.45)'; g.fillRect(0, y, w, 4); g.fillStyle = 'rgba(255,220,190,.2)'; g.fillRect(0, y + 5, w, 2); } });
barkTex.wrapT = THREE.RepeatWrapping; barkTex.repeat.set(1, 3);
function palm(x, z, hgt, lean, seed) { const grp = new THREE.Group(); grp.position.set(x, 0, z); scene.add(grp);
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
// ================================================================ light: low sun from the right, violet fill
scene.add(new THREE.HemisphereLight(0x8a5ab0, 0x2a1840, .85));
const sun = new THREE.DirectionalLight(0xffb27a, 2.9); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
const sc = sun.shadow.camera; sc.left = -10; sc.right = 10; sc.top = 8; sc.bottom = -4; sc.near = .5; sc.far = 50; scene.add(sun, sun.target);
const rim = new THREE.DirectionalLight(0xff6fb0, 1.2); rim.position.set(-6, 3, -4); scene.add(rim);
car.position.set(-1.4, 0, .1); car.rotation.y = .82;

const markTex = canvasTex(1024, 1024, (g, w, h) => { g.clearRect(0, 0, w, h); const cx = w / 2, cy = h / 2, R0 = w * .44, w0 = -Math.PI / 2, w1 = w0 + Math.PI * 2 * .28, gp = .055;
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R0, w1 + gp, w0 + Math.PI * 2 - gp); g.closePath(); g.fill();
  const mid = (w0 + w1) / 2, ox = Math.cos(mid) * R0 * .1, oy = Math.sin(mid) * R0 * .1; g.beginPath(); g.moveTo(cx + ox, cy + oy); g.arc(cx + ox, cy + oy, R0, w0 + gp * .4, w1 - gp * .4); g.closePath(); g.fill();
  g.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(0,0,0,${.15 + hsh(i, 91) * .35})`; g.beginPath(); g.arc(hsh(i, 92) * w, hsh(i, 93) * h, 2 + hsh(i, 94) * 7, 0, 7); g.fill(); } }, false);
// (no wall mural on the home screen)
// (the wordmark lives in the page, not on the wall)
palm(-8.5, 4.5, 6.4, .6, 5); palm(6.6, 3.8, 6.0, -.8, 3); [[-.6, 6.0, -.5], [-4.2, 5.6, .3], [7.4, 6.2, -.4]].forEach(([x, h, l], i) => palm(x, WALLZ - 1.8 - (i % 2) * 1.4, h, l, 20 + i));
sun.position.set(9, 4.2, 7); sun.target.position.set(-1, 1, -2); sun.shadow.mapSize.set(2048, 2048);


// ================================================================ rig: body on hydraulics, a mirror for the wet street
const body = new THREE.Group(); body.name = 'body'; [...car.children].forEach(ch => { if (ch.name !== 'wheel') body.add(ch); }); car.add(body);
car.updateMatrixWorld(true);
const carM = car.clone(true); carM.scale.y = -1; carM.traverse(o => { o.castShadow = false; o.layers.set(1); }); scene.add(carM); const bodyM = carM.getObjectByName('body');
const fronds = []; scene.traverse(o => { if (o.isMesh && o.material === frondMat) { fronds.push({ m: o, ry: o.rotation.y, rz: o.rotation.z, k: Math.random() * 6 }); o.layers.set(1); } });
// ================================================================ slips and bills in the wind
const caseW = new THREE.Vector3(); cs.getWorldPosition(caseW);
const billTex = canvasTex(256, 128, (g, w, h) => { g.fillStyle = '#9ccc84'; g.fillRect(0, 0, w, h); g.strokeStyle = '#4f7a46'; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16); g.fillStyle = '#4f7a46'; g.beginPath(); g.arc(w / 2, h / 2, 34, 0, 7); g.fill(); g.font = '900 40px RB'; g.fillText('100', 20, 52); });
const fly = []; const NF = PHONE ? 16 : 30;
for (let i = 0; i < NF; i++) { const bill = i % 3 === 2; const m = new THREE.Mesh(bill ? new THREE.PlaneGeometry(.2, .1) : new THREE.PlaneGeometry(.13, .21), toon(0xffffff, { map: bill ? billTex : ticketTex(TQ[i % TQ.length]), side: THREE.DoubleSide })); m.castShadow = true; scene.add(m); fly.push({ m, life: -Math.random() * 7, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Vector3(), w: new THREE.Vector3() }); }
function spawn(f) { f.p.copy(caseW).add(new THREE.Vector3((Math.random() - .5) * .5, .15, (Math.random() - .5) * .4)); f.v.set(-.25 + Math.random() * .6, .7 + Math.random() * .8, .35 + Math.random() * .6); f.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6); f.w.set((Math.random() - .5) * 6, (Math.random() - .5) * 6, (Math.random() - .5) * 4); f.life = 0; f.max = 5 + Math.random() * 4; }
// ================================================================ ink + grade, in real time
const near = .05, far = 120;
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
// ================================================================ the cinematography: three shots that breathe into each other
const P = innerWidth / innerHeight < .9;
const SHOTS = P ? [
  { p: [2.6, 1.1, 8.6], t: [-.6, 1.2, -.3], f: 44 }, { p: [1.6, .55, 5.6], t: [-1.2, .9, .3], f: 46 }, { p: [.4, 2.6, 5.4], t: [-1.0, .9, .3], f: 42 }] : [
  { p: [2.4, .62, 7.6], t: [-.9, 1.75, -.6], f: 34 }, { p: [3.6, .5, 3.6], t: [-1.5, 1.25, .3], f: 38 }, { p: [1.4, 2.0, 5.2], t: [-1.3, 1.45, .2], f: 36 }];
const sm = x => x * x * x * (x * (x * 6 - 15) + 10); const V = (a) => new THREE.Vector3(...a);
const SHOT = 9, BLEND = 3.2; let mode = 'home', dimT = 0, dimV = 0, hopT = 3, mx = 0, my = 0;
addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
function camAt(t) { const n = SHOTS.length, i = Math.floor(t / SHOT) % n, f = (t % SHOT) / SHOT, a = SHOTS[i], b = SHOTS[(i + 1) % n];
  const drift = f * .35; const pa = V(a.p).add(new THREE.Vector3(-drift, drift * .15, -drift * .6)), ta = V(a.t);
  const k = sm(Math.max(0, (t % SHOT - (SHOT - BLEND)) / BLEND)); const pb = V(b.p), tb = V(b.t);
  cam.position.lerpVectors(pa, pb, k); const tt = new THREE.Vector3().lerpVectors(ta, tb, k); cam.fov = a.f + (b.f - a.f) * k;
  cam.position.x += mx * .35 + Math.sin(t * .7) * .03; cam.position.y += -my * .18 + Math.sin(t * 1.1) * .02; cam.lookAt(tt); cam.updateProjectionMatrix(); }
// ================================================================ loop
const clock = new THREE.Clock(); let T = 0, ready = false, frames = 0, slow = 0;
const sky0 = sky.offset.x;
function frame() { requestAnimationFrame(frame); const dt = Math.min(clock.getDelta(), .05); if (document.hidden) return; T += dt * (mode === 'term' ? .45 : 1);
  dimV += ((mode === 'term' ? 1 : 0) - dimV) * Math.min(1, dt * 3); post.uniforms.dim.value = dimV * .55; post.uniforms.time.value = T % 10;
  camAt(T + 2);
  // hydraulics: the nose kicks up, the whole car hops, it settles
  hopT += dt; if (hopT > 7.5) hopT = 0; const h = hopT; let y = 0, rx = 0;
  if (h < .45) { rx = -.13 * Math.sin(Math.PI * h / .45); } else if (h < 1.3) { const u = (h - .45) / .85; y = .3 * Math.sin(Math.PI * u); rx = .04 * Math.sin(Math.PI * 2 * u); } else if (h < 2.2) { const u = (h - 1.3) / .9; y = .06 * Math.sin(Math.PI * u) * (1 - u); }
  body.position.y = y; body.rotation.x = rx; bodyM.position.y = y; bodyM.rotation.x = rx;
  for (const f of fronds) { f.m.rotation.y = f.ry + Math.sin(T * .9 + f.k) * .05; f.m.rotation.z = f.rz + Math.sin(T * 1.3 + f.k) * .04; }
  sky.offset.x = sky0 + T * .002; cs.getWorldPosition(caseW);
  for (const f of fly) { f.life += dt; if (f.life < 0) { f.m.visible = false; continue; } if (f.life === dt || !f.max || f.life > f.max || f.p.y < -.2) { spawn(f); }
    f.v.y -= .22 * dt; f.v.multiplyScalar(1 - .35 * dt); f.v.x += Math.sin(T * 2 + f.r.x) * .4 * dt; f.p.addScaledVector(f.v, dt); f.r.addScaledVector(f.w, dt);
    f.m.visible = true; f.m.position.copy(f.p); f.m.rotation.set(f.r.x, f.r.y, f.r.z); }
  // render: colour (all layers), normals+depth (layer 0), then ink
  cam.layers.enableAll(); scene.overrideMaterial = null; R.setRenderTarget(rtC); R.render(scene, cam);
  cam.layers.set(0); scene.overrideMaterial = normalMat; const sh = R.shadowMap.autoUpdate; R.shadowMap.autoUpdate = false; R.setRenderTarget(rtN); R.render(scene, cam); R.shadowMap.autoUpdate = sh; scene.overrideMaterial = null;
  R.setRenderTarget(null); R.render(qs, qc);
  frames++; if (!ready && frames > 2) { ready = true; window.dispatchEvent(new Event('betz:scene')); }
  if (dt > .045) slow++; else slow = Math.max(0, slow - 1); if (slow > 40 && DPR > .8) { DPR = Math.max(.75, DPR - .25); R.setPixelRatio(DPR); size(); slow = 0; } }
frame();
const DPR0 = DPR; window.betzScene = { mode(m) { if (m === mode) return; mode = m; DPR = m === 'term' ? Math.min(.6, DPR0) : DPR0; R.setPixelRatio(DPR); size(); }, get ready() { return ready; } };
