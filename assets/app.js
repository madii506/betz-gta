// betz terminal: GTA coins, crowd calls, Polymarket GTA markets, leaderboard. Everything live.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const H = document.documentElement;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = v => { v = +v || 0; const a = Math.abs(v); return '$' + (a >= 1e9 ? (v / 1e9).toFixed(2) + 'B' : a >= 1e6 ? (v / 1e6).toFixed(a >= 1e8 ? 0 : 2) + 'M' : a >= 1e3 ? (v / 1e3).toFixed(a >= 1e5 ? 0 : 1) + 'K' : v.toFixed(a >= 1 ? 2 : 6)); };
const pct = v => v == null ? '—' : (v >= 0 ? '+' : '') + (+v).toFixed(Math.abs(v) >= 100 ? 0 : 1) + '%';
const cls = v => v == null ? '' : v >= 0 ? 'up' : 'dn';
const short = w => w ? w.slice(0, 4) + '…' + w.slice(-4) : '';
const ago = t => { const s = (Date.now() - t) / 1e3; return s < 60 ? Math.max(1, s | 0) + 's' : s < 3600 ? (s / 60 | 0) + 'm' : s < 86400 ? (s / 3600 | 0) + 'h' : (s / 86400 | 0) + 'd'; };
const left = t => { const s = Math.max(0, (t - Date.now()) / 1e3); return s >= 3600 ? (s / 3600 | 0) + 'h ' + ((s % 3600) / 60 | 0) + 'm' : (s / 60 | 0) + 'm'; };
const store = { get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} } };
function toast(m, err) { const t = $('#toast'); t.textContent = m; t.className = 'on' + (err ? ' err' : ''); clearTimeout(toast.h); toast.h = setTimeout(() => t.className = '', 3200); }
async function api(p, o) { const r = await fetch(p, o); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.status); return j; }

// ---------------------------------------------------------------- the mark: a coin cut into its odds
(function mark() { const cx = 100, cy = 100, R = 88, P = a => [cx + R * Math.cos(a * Math.PI / 180), cy + R * Math.sin(a * Math.PI / 180)];
  const w0 = -90, w1 = w0 + 360 * .28, g = 3.2, mid = (w0 + w1) / 2 * Math.PI / 180, ox = Math.cos(mid) * R * .1, oy = Math.sin(mid) * R * .1;
  const arc = (a0, a1, dx = 0, dy = 0) => { const [x0, y0] = P(a0), [x1, y1] = P(a1); return `M${cx + dx} ${cy + dy}L${x0 + dx} ${y0 + dy}A${R} ${R} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1 + dx} ${y1 + dy}Z`; };
  const body = arc(w1 + g, w0 + 360 - g), wedge = arc(w0 + g * .4, w1 - g * .4, ox, oy);
  $$('svg path.body').forEach(p => p.setAttribute('d', body)); $$('svg path.wedge').forEach(p => p.setAttribute('d', wedge));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="40" fill="#4a1238"/><g transform="translate(20 20) scale(.8)"><path fill="#fff6f2" d="${body}"/><path fill="#fff6f2" d="${wedge}"/></g></svg>`;
  $('link[rel=icon]').href = 'data:image/svg+xml,' + encodeURIComponent(svg); })();

// ---------------------------------------------------------------- GTA VI clock
const GTA = Date.parse('2026-11-19T00:00:00-05:00');
function clock() { const s = (GTA - Date.now()) / 1e3; const t = s <= 0 ? 'out now' : `${s / 86400 | 0}d ${(s % 86400) / 3600 | 0}h ${(s % 3600) / 60 | 0}m ${s % 60 | 0}s`; $('#sCd').textContent = s <= 0 ? 'out now' : t.split(' ').slice(0, 3).join(' '); const hb = $('#hubCd'); if (hb) hb.textContent = s <= 0 ? 'OUT NOW' : t; }
setInterval(clock, 1000); clock();

// ---------------------------------------------------------------- state
const S = { coins: [], byMint: {}, sel: null, sort: 'mcap', q: '', board: null, pm: null, wallet: null, prov: null, focus: 0, tf: 'm', chart: null };
const MK = [['up', 'Higher in 24h?'], ['x2', '2x in 24h?'], ['rug', 'Halves in 24h?']];

// ---------------------------------------------------------------- loading: one line, nothing else
let sceneOk = false, coinsOk = false; const lb = $('#lbar');
function progress() { lb.style.width = ((sceneOk ? 60 : 18) + (coinsOk ? 40 : 0)) * 2.4 + 'px'; if (sceneOk && coinsOk) done(); }
function done() { if (done.d) return; done.d = 1; setTimeout(() => { $('#load').classList.add('out'); H.classList.add('go'); if (location.hash === '#terminal') openTerm(); }, 400); }
addEventListener('betz:scene', () => { sceneOk = true; progress(); });
setTimeout(() => { sceneOk = true; coinsOk = true; progress(); }, 9000);
progress();

// ---------------------------------------------------------------- home <-> terminal
function openTerm() { H.classList.add('term'); window.betzScene?.mode('term'); if (location.hash !== '#terminal') history.replaceState(null, '', '#terminal'); }
function openHome() { H.classList.remove('term'); window.betzScene?.mode('home'); history.replaceState(null, '', location.pathname); }
$('#enter').onclick = openTerm; $('#toHome').onclick = openHome;
$('#hconn').onclick = () => connect(); $('#wal').onclick = () => S.wallet ? disconnect() : connect();

// ---------------------------------------------------------------- coins
async function loadCoins() { try { const j = await api('/api/coins'); S.coins = j.coins || []; S.byMint = Object.fromEntries(S.coins.map(c => [c.mint, c])); coinsOk = true; progress();
    if (!S.sel && S.coins[0]) S.sel = S.coins[0].mint; renderStats(); renderRows(); renderDet(); renderMovers(); renderMap(); renderHub(); $('#upd').textContent = 'updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch (e) { coinsOk = true; progress(); $('#rows').innerHTML = `<div class="empty">couldn't reach Jupiter right now (${esc(e.message)}). retrying…</div>`; } }
function ico(c, big) { return c.icon ? `<img src="${esc(c.icon)}" alt="" loading="lazy" onerror="this.outerHTML='<div class=ph>${esc((c.symbol || '?')[0])}</div>'">` : `<div class="ph">${esc((c.symbol || '?')[0])}</div>`; }
function renderStats() { const C = S.coins; $('#sCoins').textContent = C.length; $('#nCoins').textContent = C.length; $('#sMcap').textContent = money(C.reduce((a, c) => a + c.mcap, 0)); $('#sVol').textContent = money(C.reduce((a, c) => a + c.vol24h, 0));
  const t = S.board?.totals; $('#sOpen').textContent = t ? t.open : '—'; $('#sCallers').textContent = t ? t.callers : '—'; }
function callsOn(m) { const o = S.board?.odds?.[m]; return o ? Object.values(o).reduce((a, x) => a + x.y + x.n, 0) : 0; }
function upShare(m) { const o = S.board?.odds?.[m]?.up; return o && o.y + o.n ? o.y / (o.y + o.n) : null; }
function sorted() { let C = S.coins.slice(); const q = S.q.trim().toLowerCase(); if (q) C = C.filter(c => (c.name + ' ' + c.symbol + ' ' + c.mint).toLowerCase().includes(q));
  const k = S.sort; C.sort((a, b) => k === 'new' ? new Date(b.created || 0) - new Date(a.created || 0) : k === 'called' ? callsOn(b.mint) - callsOn(a.mint) || b.mcap - a.mcap : (b[k] ?? -1e9) - (a[k] ?? -1e9)); return C; }
function renderRows() { const C = sorted(); if (!C.length) { $('#rows').innerHTML = '<div class="empty">no GTA coin matches that.</div>'; return; }
  $('#rows').innerHTML = C.map(c => { const u = upShare(c.mint), n = callsOn(c.mint);
    return `<div class="row${c.mint === S.sel ? ' on' : ''}" data-m="${c.mint}">${ico(c)}<div class="nm"><b>${esc(c.name)}</b><span>$${esc(c.symbol)} · ${n} call${n === 1 ? '' : 's'}</span></div><div class="rt"><b>${money(c.mcap)}</b><br><span class="${cls(c.ch24h)}">${pct(c.ch24h)}</span>${u == null ? '' : `<div class="minibar"><i style="width:${u * 100}%"></i><u style="width:${(1 - u) * 100}%"></u></div>`}</div></div>`; }).join('');
  $$('#rows .row').forEach(r => r.onclick = () => select(r.dataset.m)); }
function select(m, scroll) { S.sel = m; S.focus = 0; $$('#rows .row').forEach(r => r.classList.toggle('on', r.dataset.m === m)); if (scroll) $(`#rows .row[data-m="${m}"]`)?.scrollIntoView({ block: 'nearest' }); renderDet(); }
$('#q').oninput = e => { S.q = e.target.value; renderRows(); };
$$('.chip[data-s]').forEach(b => b.onclick = () => { S.sort = b.dataset.s; $$('.chip[data-s]').forEach(x => x.classList.toggle('on', x === b)); renderRows(); });

// ---------------------------------------------------------------- the coin: header, stats, chart, three markets
function myOpen(m, k) { return (S.board?.mine || []).find(c => c.mint === m && c.mkt === k && c.status === 'open'); }
function renderDet() { const c = S.byMint[S.sel]; const D = $('#det'); if (!c) { D.innerHTML = '<div class="empty">pick a GTA coin.</div>'; return; }
  const odds = S.board?.odds?.[c.mint] || {};
  D.innerHTML = `<div class="dh">${ico(c, 1)}<div><h2>${esc(c.name)}</h2><div class="sub"><span>$${esc(c.symbol)}</span><button id="cp">${short(c.mint)} ⧉</button><a href="https://pump.fun/coin/${c.mint}" target="_blank" rel="noopener">pump.fun ↗</a><a href="https://dexscreener.com/solana/${c.mint}" target="_blank" rel="noopener">chart ↗</a><a href="https://jup.ag/tokens/${c.mint}" target="_blank" rel="noopener">jup ↗</a></div></div>
    <div class="px"><b>${money(c.mcap)}</b><span class="${cls(c.ch24h)}">${pct(c.ch24h)} 24h</span></div></div>
    <div class="grid"><div><span>price</span><b>${money(c.price)}</b></div><div><span>1h</span><b class="${cls(c.ch1h)}">${pct(c.ch1h)}</b></div><div><span>24h volume</span><b>${money(c.vol24h)}</b></div><div><span>holders</span><b>${(c.holders || 0).toLocaleString()}</b></div>
    <div><span>liquidity</span><b>${money(c.liq)}</b></div><div><span>buys / sells 24h</span><b>${(c.buys24h || 0).toLocaleString()} / ${(c.sells24h || 0).toLocaleString()}</b></div><div><span>launchpad</span><b>${esc(c.launchpad || '—')}</b></div><div><span>age</span><b>${c.created ? ago(new Date(c.created).getTime()) : '—'}</b></div></div>
    <div class="chart"><div class="tf"><button class="chip${S.tf === 'm' ? ' on' : ''}" data-tf="m">15m</button><button class="chip${S.tf === 'h' ? ' on' : ''}" data-tf="h">1h</button></div><canvas id="cv"></canvas><div class="em" id="cvE">loading chart…</div></div>
    <div class="mkts">${MK.map(([k, q], i) => { const o = odds[k] || { y: 0, n: 0 }, n = o.y + o.n, y = n ? o.y / n : null, mine = myOpen(c.mint, k);
      return `<div class="mk${S.focus === i ? ' f' : ''}" data-k="${k}"><div class="q"><kbd>${i + 1}</kbd>${q}</div>
        <div class="od"><span class="up">YES ${y == null ? '—' : Math.round(y * 100) + '%'}</span><span class="dn">NO ${y == null ? '—' : Math.round((1 - y) * 100) + '%'}</span></div>
        <div class="bar"><i style="width:${y == null ? 0 : y * 100}%"></i><u style="width:${y == null ? 0 : (1 - y) * 100}%"></u></div>
        <div class="n">${n ? n + ' open call' + (n === 1 ? '' : 's') : 'no calls yet · be first'}</div>
        ${mine ? `<div class="mine">your call: <b class="${mine.side === 'Y' ? 'up' : 'dn'}">${mine.side === 'Y' ? 'YES' : 'NO'}</b> at ${money(mine.mcap0)} · graded in ${left(mine.due)}</div>` : `<div class="yn"><button class="y" data-side="Y">YES</button><button class="no" data-side="N">NO</button></div>`}</div>`; }).join('')}</div>
    <div class="two"><div class="box"><div class="bh">live trades <span class="sp"></span><small>top pool · GeckoTerminal</small></div><div id="trs"><div class="empty">loading…</div></div></div>
    <div class="box"><div class="bh">top holders <span class="sp"></span><small id="t10"></small></div><div id="hds"><div class="empty">loading…</div></div></div></div>`;
  $('#cp').onclick = () => { navigator.clipboard?.writeText(c.mint); toast('contract copied'); };
  $$('#det .chip[data-tf]').forEach(b => b.onclick = () => { S.tf = b.dataset.tf; renderDet(); });
  $$('#det .mk').forEach((el, i) => { el.onmouseenter = () => focusMk(i); $$('button[data-side]', el).forEach(b => b.onclick = () => slip(c, el.dataset.k, b.dataset.side)); });
  drawChart(c.mint); extras(c.mint); }
function focusMk(i) { S.focus = i; $$('#det .mk').forEach((el, k) => el.classList.toggle('f', k === i)); }
async function drawChart(mint) { const cv = $('#cv'), E = $('#cvE'); if (!cv) return; const key = mint + S.tf; let d = S.chart?.key === key ? S.chart.d : null;
  if (!d) { try { d = await api(`/api/chart?mint=${mint}&tf=${S.tf}`); S.chart = { key, d }; } catch (e) { d = { candles: [] }; } }
  if (S.sel !== mint || !$('#cv')) return; const C = d.candles || []; if (C.length < 3) { if (E) E.textContent = 'no chart data for this coin yet'; return; } E?.remove();
  const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2); if (r.width < 20 || r.height < 20) return; cv.width = r.width * dpr; cv.height = r.height * dpr; const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const W = r.width, Hh = r.height, pad = 14, lo = Math.min(...C.map(x => x.l)), hi = Math.max(...C.map(x => x.h)), X = i => pad + i / (C.length - 1) * (W - pad * 2 - 54), Y = v => pad + 18 + (1 - (v - lo) / (hi - lo || 1)) * (Hh - pad * 2 - 30);
  const up = C[C.length - 1].c >= C[0].o, col = up ? '#2fe0a8' : '#ff5a6a';
  g.strokeStyle = 'rgba(255,246,242,.07)'; g.lineWidth = 1; for (let k = 0; k < 4; k++) { const y = pad + 18 + k * (Hh - pad * 2 - 30) / 3; g.beginPath(); g.moveTo(pad, y); g.lineTo(W - pad - 54, y); g.stroke(); g.fillStyle = 'rgba(255,246,242,.38)'; g.font = '500 10px JB'; g.fillText(money(hi - k * (hi - lo) / 3), W - pad - 50, y + 3); }
  const grd = g.createLinearGradient(0, 0, 0, Hh); grd.addColorStop(0, up ? 'rgba(47,224,168,.32)' : 'rgba(255,90,106,.32)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.beginPath(); C.forEach((x, i) => i ? g.lineTo(X(i), Y(x.c)) : g.moveTo(X(i), Y(x.c))); g.lineTo(X(C.length - 1), Hh); g.lineTo(X(0), Hh); g.closePath(); g.fillStyle = grd; g.fill();
  g.beginPath(); C.forEach((x, i) => i ? g.lineTo(X(i), Y(x.c)) : g.moveTo(X(i), Y(x.c))); g.strokeStyle = col; g.lineWidth = 2; g.shadowColor = col; g.shadowBlur = 10; g.stroke(); g.shadowBlur = 0;
  const lx = X(C.length - 1), ly = Y(C[C.length - 1].c); g.fillStyle = col; g.beginPath(); g.arc(lx, ly, 4, 0, 7); g.fill();
  const img = g.getImageData(0, 0, cv.width, cv.height);
  cv.onmousemove = e => { const b = cv.getBoundingClientRect(), mx = e.clientX - b.left, i = Math.max(0, Math.min(C.length - 1, Math.round((mx - pad) / (W - pad * 2 - 54) * (C.length - 1)))); g.putImageData(img, 0, 0); g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const x = X(i), y = Y(C[i].c); g.strokeStyle = 'rgba(255,246,242,.35)'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x, 0); g.lineTo(x, Hh); g.stroke(); g.setLineDash([]); g.fillStyle = '#fff6f2'; g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill();
    const tx = `${money(C[i].c)} · ${new Date(C[i].t).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`; g.font = '600 11px JB'; const tw = g.measureText(tx).width + 14; const bx = Math.min(Math.max(x - tw / 2, 4), W - tw - 4);
    g.fillStyle = 'rgba(20,6,18,.9)'; g.fillRect(bx, 8, tw, 22); g.fillStyle = '#fff6f2'; g.fillText(tx, bx + 7, 23); g.restore(); };
  cv.onmouseleave = () => g.putImageData(img, 0, 0); }

async function extras(mint) {
  api('/api/trades?mint=' + mint).then(j => { if (S.sel !== mint || !$('#trs')) return; const T = j.trades || [];
    $('#trs').innerHTML = T.length ? T.slice(0, 14).map(t => `<div class="tr"><span class="pill ${t.buy ? 'Y' : 'N'}">${t.buy ? 'BUY' : 'SELL'}</span><span>${money(t.usd)}</span><a class="when" href="https://solscan.io/tx/${esc(t.tx)}" target="_blank" rel="noopener">${short(t.wallet)}</a><span class="when">${ago(t.ts)}</span></div>`).join('') : '<div class="empty">no recent trades.</div>'; }).catch(() => { if ($('#trs')) $('#trs').innerHTML = '<div class="empty">trades unavailable right now.</div>'; });
  api('/api/holders?mint=' + mint).then(j => { if (S.sel !== mint || !$('#hds')) return; const Hs = j.holders || []; const t10 = j.top10 || 0;
    $('#t10').innerHTML = Hs.length ? `<span class="risk" style="background:${t10 > .5 ? 'rgba(255,90,106,.2);color:#ff5a6a' : t10 > .3 ? 'rgba(255,198,90,.2);color:#ffc65a' : 'rgba(47,224,168,.18);color:#2fe0a8'}">top 10 hold ${(t10 * 100).toFixed(1)}%</span>` : '';
    $('#hds').innerHTML = Hs.length ? Hs.slice(0, 10).map((h, i) => `<div class="hd"><span class="when">${i + 1}</span><a href="https://solscan.io/account/${esc(h.owner || h.account)}" target="_blank" rel="noopener">${short(h.owner || h.account)}</a><b>${(h.pct * 100).toFixed(2)}%</b><div class="hb"><i style="width:${Math.min(100, h.pct * 100 * 2)}%"></i></div></div>`).join('') : '<div class="empty">holders unavailable.</div>'; }).catch(() => { if ($('#hds')) $('#hds').innerHTML = '<div class="empty">holders unavailable right now.</div>'; }); }

// ---------------------------------------------------------------- movers: six ways to read the GTA trenches
function renderMovers() { const C = S.coins; if (!C.length) return; const L = (t, sub, list, f) => `<div class="mv"><h4>${t}<span>${sub}</span></h4>${list.slice(0, 8).map((c, i) => `<div class="r" data-m="${c.mint}"><i>${i + 1}</i>${ico(c)}<span>$${esc(c.symbol)}</span><b class="${f(c)[1]}">${f(c)[0]}</b></div>`).join('')}</div>`;
  const by = (k, d = -1) => C.filter(c => c[k] != null).slice().sort((a, b) => d * (a[k] - b[k]));
  $('#movers').innerHTML = [L('top gainers', '24h', by('ch24h'), c => [pct(c.ch24h), cls(c.ch24h)]), L('biggest drops', '24h', by('ch24h', 1), c => [pct(c.ch24h), cls(c.ch24h)]), L('hot right now', '1h', by('ch1h'), c => [pct(c.ch1h), cls(c.ch1h)]),
    L('most volume', '24h', by('vol24h'), c => [money(c.vol24h), '']), L('most holders', 'now', by('holders'), c => [(c.holders || 0).toLocaleString(), '']), L('newest', 'age', C.slice().sort((a, b) => new Date(b.created || 0) - new Date(a.created || 0)), c => [c.created ? ago(new Date(c.created).getTime()) : '—', ''])].join('');
  $$('#movers .r').forEach(r => r.onclick = () => { tab('markets'); select(r.dataset.m, 1); }); }

// ---------------------------------------------------------------- the map: every GTA coin as a blip
let mapPts = [];
function renderMap() { const cv = $('#mapc'); if (!cv || S.tab !== 'map') return; const r = cv.getBoundingClientRect(); if (r.width < 50) return; const dpr = Math.min(devicePixelRatio || 1, 2); cv.width = r.width * dpr; cv.height = r.height * dpr; const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const W = r.width, Hh = r.height, C = S.coins.filter(c => c.mcap > 0); if (!C.length) return; const lm = C.map(c => Math.log10(c.mcap)), lo = Math.min(...lm) - .1, hi = Math.max(...lm) + .1; const ch = C.map(c => Math.max(-90, Math.min(200, c.ch24h || 0))); const cmax = Math.max(30, ...ch.map(Math.abs));
  const X = v => 60 + (Math.log10(v) - lo) / (hi - lo) * (W - 120), Y = v => Hh / 2 - v / cmax * (Hh / 2 - 50);
  g.strokeStyle = 'rgba(25,211,197,.08)'; g.lineWidth = 1; for (let x = 0; x < W; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, Hh); g.stroke(); } for (let y = 0; y < Hh; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  const T = performance.now() / 1000; for (let k = 1; k <= 3; k++) { g.strokeStyle = `rgba(255,246,242,${.05 / k})`; g.beginPath(); g.arc(W / 2, Hh / 2, k * Math.min(W, Hh) / 6, 0, 7); g.stroke(); }
  g.strokeStyle = 'rgba(255,246,242,.25)'; g.setLineDash([4, 6]); g.beginPath(); g.moveTo(0, Hh / 2); g.lineTo(W, Hh / 2); g.stroke(); g.setLineDash([]);
  g.fillStyle = 'rgba(255,246,242,.4)'; g.font = '600 10px JB'; g.fillText('+' + Math.round(cmax) + '%', 10, 56); g.fillText('-' + Math.round(cmax) + '%', 10, Hh - 44); g.fillText(money(10 ** lo), 60, Hh - 12); g.fillText(money(10 ** hi), W - 110, Hh - 12);
  const vmax = Math.max(...C.map(c => c.vol24h || 0), 1); mapPts = C.map((c, i) => ({ c, x: X(c.mcap), y: Y(ch[i]), r: 5 + Math.sqrt((c.vol24h || 0) / vmax) * 26 }));
  for (const p of mapPts) { const up = (p.c.ch24h || 0) >= 0, col = up ? '47,224,168' : '255,90,106'; const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2); gr.addColorStop(0, `rgba(${col},.35)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.r * 2, 0, 7); g.fill();
    g.fillStyle = `rgba(${col},.9)`; g.beginPath(); g.arc(p.x, p.y, p.r * .45, 0, 7); g.fill(); g.strokeStyle = p.c.mint === S.sel ? '#fff6f2' : `rgba(${col},.6)`; g.lineWidth = p.c.mint === S.sel ? 2.5 : 1; g.beginPath(); g.arc(p.x, p.y, p.r * .8, 0, 7); g.stroke();
    if (p.r > 12 || p.c.mint === S.sel) { g.fillStyle = '#fff6f2'; g.font = '700 11px Rubik'; g.fillText('$' + p.c.symbol, p.x + p.r * .9, p.y + 4); } } }
(() => { const cv = $('#mapc'), tip = $('#mtip'); const hit = e => { const b = cv.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top; let best = null, bd = 1e9; for (const p of mapPts) { const d = Math.hypot(p.x - x, p.y - y); if (d < Math.max(14, p.r) && d < bd) { bd = d; best = p; } } return [best, x, y]; };
  cv.onmousemove = e => { const [p, x, y] = hit(e); if (!p) { tip.style.display = 'none'; return; } tip.style.display = 'block'; tip.style.left = Math.min(x + 14, cv.clientWidth - 180) + 'px'; tip.style.top = (y + 14) + 'px'; tip.innerHTML = `<b>$${esc(p.c.symbol)}</b> ${esc(p.c.name)}<br>${money(p.c.mcap)} · <span class="${cls(p.c.ch24h)}">${pct(p.c.ch24h)}</span> · vol ${money(p.c.vol24h)}`; };
  cv.onmouseleave = () => tip.style.display = 'none'; cv.onclick = e => { const [p] = hit(e); if (p) { tab('markets'); select(p.c.mint, 1); } }; })();

// ---------------------------------------------------------------- GTA VI hub
function renderHub() { const C = S.coins, B = S.board, E = (S.pm?.events || []).slice(0, 3); if (!$('#hub')) return;
  const tot = C.reduce((a, c) => a + c.mcap, 0), vol = C.reduce((a, c) => a + c.vol24h, 0), up = C.filter(c => (c.ch24h || 0) >= 0).length;
  const sent = C.map(c => { const o = B?.odds?.[c.mint]?.up; return o && o.y + o.n ? { c, y: o.y / (o.y + o.n), n: o.y + o.n } : null; }).filter(Boolean).sort((a, b) => b.y - a.y);
  $('#hub').innerHTML = `<div class="hc"><h4>GTA VI release</h4><div class="big" id="hubCd">—</div><div class="kv"><div><span>GTA coins</span><b>${C.length}</b></div><div><span>combined mcap</span><b>${money(tot)}</b></div><div><span>24h volume</span><b>${money(vol)}</b></div><div><span>green today</span><b>${up} / ${C.length}</b></div><div><span>open calls</span><b>${B?.totals?.open ?? '—'}</b></div><div><span>callers</span><b>${B?.totals?.callers ?? '—'}</b></div></div></div>
    <div class="hc"><h4>Polymarket says</h4>${E.length ? E.map(e => `<div style="margin-bottom:14px"><div style="font-weight:700;margin-bottom:6px">${esc(e.title)}</div>${e.markets.slice(0, 2).map(m => `<div class="ev"><div class="m" style="padding:0;border:0"><span>${esc(m.label || m.q)}</span><b>${Math.round(m.yes * 100)}%</b><div class="bar"><i style="width:${m.yes * 100}%"></i><u style="width:${(1 - m.yes) * 100}%"></u></div></div></div>`).join('')}</div>`).join('') : '<div class="empty">loading…</div>'}</div>
    <div class="hc sent"><h4>crowd: most bullish (higher in 24h)</h4>${sent.length ? sent.slice(0, 6).map(x => `<div class="r" data-m="${x.c.mint}"><span>$${esc(x.c.symbol)}</span><div class="bar"><i style="width:${x.y * 100}%"></i><u style="width:${(1 - x.y) * 100}%"></u></div><b class="up mono">${Math.round(x.y * 100)}%</b></div>`).join('') : '<div class="empty">no calls yet. be the first.</div>'}</div>
    <div class="hc sent"><h4>crowd: most bearish</h4>${sent.length ? sent.slice().reverse().slice(0, 6).map(x => `<div class="r" data-m="${x.c.mint}"><span>$${esc(x.c.symbol)}</span><div class="bar"><i style="width:${x.y * 100}%"></i><u style="width:${(1 - x.y) * 100}%"></u></div><b class="dn mono">${Math.round((1 - x.y) * 100)}%</b></div>`).join('') : '<div class="empty">no calls yet.</div>'}</div>`;
  $$('#hub .r[data-m]').forEach(r => r.onclick = () => { tab('markets'); select(r.dataset.m, 1); }); clock(); }

// ---------------------------------------------------------------- board, feed, my calls
async function loadBoard() { try { S.board = await api('/api/board' + (S.wallet ? '?wallet=' + S.wallet : '')); renderStats(); renderFeed(); renderBoard(); renderMine(); renderRows(); if (S.tab === 'hub') renderHub(); if (!document.activeElement?.closest?.('#det')) renderDetSoft(); } catch (e) { $('#feed').innerHTML = `<div class="empty">calls are offline: ${esc(e.message)}</div>`; } }
function renderDetSoft() { const c = S.byMint[S.sel]; if (!c || !$('#det .mkts')) return renderDet(); const odds = S.board?.odds?.[c.mint] || {};
  $$('#det .mk').forEach(el => { const k = el.dataset.k, o = odds[k] || { y: 0, n: 0 }, n = o.y + o.n, y = n ? o.y / n : null; $('.od', el).innerHTML = `<span class="up">YES ${y == null ? '—' : Math.round(y * 100) + '%'}</span><span class="dn">NO ${y == null ? '—' : Math.round((1 - y) * 100) + '%'}</span>`;
    $('.bar i', el).style.width = (y == null ? 0 : y * 100) + '%'; $('.bar u', el).style.width = (y == null ? 0 : (1 - y) * 100) + '%'; $('.n', el).textContent = n ? n + ' open call' + (n === 1 ? '' : 's') : 'no calls yet · be first'; }); }
const mq = k => (MK.find(m => m[0] === k) || [, k])[1];
function renderFeed() { const R = S.board?.recent || []; $('#nRecent').textContent = (S.board?.totals?.calls || 0) + ' total';
  if (!S.board?.store) { $('#feed').innerHTML = '<div class="empty">calls open the moment storage is connected.</div>'; return; }
  $('#feed').innerHTML = R.length ? R.map(c => { const k = S.byMint[c.mint]; return `<div class="fi"><span class="pill ${c.side}">${c.side === 'Y' ? 'YES' : 'NO'}</span><span><b>$${esc(k?.symbol || short(c.mint))}</b> · ${mq(c.mkt)}<br><span class="when">${short(c.wallet)} at ${money(c.mcap0)}</span></span><span class="when">${c.status === 'open' ? ago(c.ts) : `<span class="pill ${c.status}">${c.status}</span>`}</span></div>`; }).join('') : '<div class="empty">no calls yet. the first one lands here.</div>'; }
function renderBoard() { const B = S.board?.board || []; if (!B.length) { $('#board').innerHTML = '<div class="empty">no graded calls yet. the first winners show up 24 hours after the first calls.</div>'; return; }
  $('#board').innerHTML = `<table><thead><tr><th>#</th><th>caller</th><th>won</th><th>lost</th><th>open</th><th>accuracy</th><th>best streak</th></tr></thead><tbody>${B.map((w, i) => `<tr class="${w.wallet === S.wallet ? 'me' : ''}"><td class="rk">${i + 1}</td><td>${short(w.wallet)}</td><td class="up">${w.won}</td><td class="dn">${w.lost}</td><td>${w.open}</td><td>${w.acc == null ? '—' : Math.round(w.acc * 100) + '%'}</td><td>${w.best}</td></tr>`).join('')}</tbody></table>`; }
function renderMine() { const M = S.board?.mine || []; $('#nMine').textContent = M.length;
  if (!S.wallet) { $('#mine').innerHTML = '<div class="empty">connect a wallet to see your calls.</div>'; $('#mineSum').textContent = ''; return; }
  const w = M.filter(c => c.status === 'won').length, l = M.filter(c => c.status === 'lost').length; $('#mineSum').textContent = `${M.length} calls · ${w} won · ${l} lost`;
  $('#mine').innerHTML = M.length ? M.map(c => { const k = S.byMint[c.mint]; return `<div class="fi"><span class="pill ${c.side}">${c.side === 'Y' ? 'YES' : 'NO'}</span><span><b>$${esc(k?.symbol || short(c.mint))}</b> · ${mq(c.mkt)}<br><span class="when">called at ${money(c.mcap0)}${c.mcap1 ? ' · graded at ' + money(c.mcap1) : ''}</span></span><span class="when">${c.status === 'open' ? 'graded in ' + left(c.due) : `<span class="pill ${c.status}">${c.status}</span>`}</span></div>`; }).join('') : '<div class="empty">no calls yet. pick a GTA coin and hit YES or NO.</div>'; }

// ---------------------------------------------------------------- polymarket
async function loadPM() { try { S.pm = await api('/api/pm'); const E = S.pm.events || []; $('#nPoly').textContent = E.length; if (S.tab === 'hub') renderHub();
    $('#pm').innerHTML = E.length ? E.map(e => `<div class="ev"><div class="t">${e.image ? `<img src="${esc(e.image)}" alt="" loading="lazy">` : ''}<h3>${esc(e.title)}</h3></div>
      ${e.markets.slice(0, 4).map(m => `<div class="m"><span>${esc(m.label || m.q)}</span><b>${Math.round(m.yes * 100)}%</b><div class="bar"><i style="width:${m.yes * 100}%"></i><u style="width:${(1 - m.yes) * 100}%"></u></div></div>`).join('')}
      <div class="meta"><span>vol ${money(e.vol)}</span><span>${e.end ? 'ends ' + new Date(e.end).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span></div>
      <a class="go" href="${esc(e.url)}" target="_blank" rel="noopener">trade on polymarket ↗</a></div>`).join('') : '<div class="empty">no open GTA markets on Polymarket right now.</div>'; }
  catch (e) { $('#pm').innerHTML = `<div class="empty">couldn't reach Polymarket (${esc(e.message)}).</div>`; } }

// ---------------------------------------------------------------- tabs + keys
const TABS = $$('.tab').map(t => t.dataset.t);
function tab(t) { $$('.tab').forEach(b => b.classList.toggle('on', b.dataset.t === t)); $$('.pane').forEach(p => p.classList.toggle('on', p.dataset.p === t)); S.tab = t; if (t === 'markets') renderDet(); if (t === 'map') requestAnimationFrame(renderMap); if (t === 'hub') renderHub(); if (t === 'movers') renderMovers(); }
$$('.tab').forEach(b => b.onclick = () => tab(b.dataset.t)); S.tab = 'markets';
addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (!H.classList.contains('term')) openTerm(); pal(); return; } if (e.target.matches('input')) { if (e.key === 'Escape') e.target.blur(); return; } if ($('.modal.on')) { if (e.key === 'Escape') closeModals(); if (e.key === 'Enter' && $('#mCall.on')) $('#sign').click(); return; }
  const k = e.key.toLowerCase();
  if (!H.classList.contains('term')) { if (k === 'enter') openTerm(); return; }
  if (k === 'escape') return openHome();
  if (k === 'q' || k === 'e') { const i = TABS.indexOf(S.tab); tab(TABS[(i + (k === 'e' ? 1 : TABS.length - 1)) % TABS.length]); return; }
  if (S.tab !== 'markets') return;
  if (k === 'arrowdown' || k === 'arrowup') { e.preventDefault(); const C = sorted(), i = C.findIndex(c => c.mint === S.sel), n = C[Math.max(0, Math.min(C.length - 1, i + (k === 'arrowdown' ? 1 : -1)))]; if (n) select(n.mint, 1); }
  if (k === '1' || k === '2' || k === '3') focusMk(+k - 1);
  if (k === '/') { e.preventDefault(); $('#q').focus(); }
  if (k === 'y' || k === 'n') { const c = S.byMint[S.sel]; if (c && !myOpen(c.mint, MK[S.focus][0])) slip(c, MK[S.focus][0], k === 'y' ? 'Y' : 'N'); } });

// ---------------------------------------------------------------- ⌘K palette
let palSel = 0, palItems = [];
function pal() { $('#mPal').classList.add('on'); const q = $('#palq'); q.value = ''; palList(''); setTimeout(() => q.focus(), 30); }
function palList(q) { q = q.trim().toLowerCase(); const tabsL = $$('.tab').map(b => ({ k: 'tab', t: b.dataset.t, label: b.textContent.replace(/\d+|—/g, '').trim() }));
  const coins = S.coins.filter(c => !q || (c.name + ' ' + c.symbol + ' ' + c.mint).toLowerCase().includes(q)).slice(0, 8).map(c => ({ k: 'coin', m: c.mint, label: `$${c.symbol} · ${c.name}`, sub: money(c.mcap) }));
  palItems = [...tabsL.filter(t => !q || t.label.toLowerCase().includes(q)).map(t => ({ ...t, sub: 'tab' })), ...coins]; palSel = 0; drawPal(); }
function drawPal() { $('#palr').innerHTML = palItems.map((it, i) => `<div class="pr${i === palSel ? ' on' : ''}" data-i="${i}">${esc(it.label)}<span>${esc(it.sub || '')}</span></div>`).join('') || '<div class="empty">nothing found.</div>'; $$('#palr .pr').forEach(r => r.onclick = () => palGo(+r.dataset.i)); }
function palGo(i) { const it = palItems[i]; if (!it) return; closeModals(); if (it.k === 'tab') tab(it.t); else { tab('markets'); select(it.m, 1); } }
$('#palq').oninput = e => palList(e.target.value);
$('#palq').onkeydown = e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); palSel = Math.max(0, Math.min(palItems.length - 1, palSel + (e.key === 'ArrowDown' ? 1 : -1))); drawPal(); } if (e.key === 'Enter') palGo(palSel); if (e.key === 'Escape') closeModals(); };

// ---------------------------------------------------------------- wallets (Phantom, Solflare, Backpack): connect + sign message only
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function b58(bytes) { let n = 0n; for (const b of bytes) n = n * 256n + BigInt(b); let s = ''; while (n > 0n) { s = B58[Number(n % 58n)] + s; n /= 58n; } for (const b of bytes) { if (b) break; s = '1' + s; } return s; }
function wallets() { const L = []; const ph = window.phantom?.solana; if (ph?.isPhantom) L.push({ id: 'phantom', name: 'Phantom', p: ph, icon: 'https://phantom.app/img/phantom-icon-purple.svg' });
  if (window.solflare?.isSolflare) L.push({ id: 'solflare', name: 'Solflare', p: window.solflare }); if (window.backpack?.connect) L.push({ id: 'backpack', name: 'Backpack', p: window.backpack });
  if (!L.length && window.solana?.connect) L.push({ id: 'injected', name: 'Solana wallet', p: window.solana }); return L; }
function closeModals() { $$('.modal').forEach(m => m.classList.remove('on')); }
$$('[data-x]').forEach(b => b.onclick = closeModals); $$('.modal').forEach(m => m.onclick = e => { if (e.target === m) closeModals(); });
function connect() { return new Promise(res => { const L = wallets(); const box = $('#wList');
  box.innerHTML = L.length ? L.map((w, i) => `<button class="wopt" data-i="${i}">${w.name}<span>detected</span></button>`).join('') : `<div class="mnote">No Solana wallet found in this browser. Install <a href="https://phantom.app" target="_blank" rel="noopener"><u>Phantom</u></a>, <a href="https://solflare.com" target="_blank" rel="noopener"><u>Solflare</u></a> or <a href="https://backpack.app" target="_blank" rel="noopener"><u>Backpack</u></a>, or open betz in your wallet's browser.</div>`;
  $$('.wopt', box).forEach(b => b.onclick = async () => { const w = L[+b.dataset.i]; try { const r = await w.p.connect(); const pk = (r?.publicKey || w.p.publicKey)?.toString(); if (!pk) throw new Error('no public key');
    S.wallet = pk; S.prov = w.p; store.set('betz:w', w.id); closeModals(); walletUI(); loadBoard(); toast('connected ' + short(pk)); res(true); } catch (e) { toast(e.message || 'connection cancelled', 1); res(false); } });
  $('#mWal').classList.add('on'); }); }
async function disconnect() { try { await S.prov?.disconnect?.(); } catch (_) {} S.wallet = null; S.prov = null; store.set('betz:w', ''); walletUI(); loadBoard(); toast('disconnected'); }
function walletUI() { const on = !!S.wallet; $('#wal').classList.toggle('on', on); $('#hconn').classList.toggle('on', on); $('#walT').textContent = on ? short(S.wallet) : 'connect'; $('#hconn span').textContent = on ? short(S.wallet) : 'connect wallet'; }
(async () => { const id = store.get('betz:w'); if (!id) return; await new Promise(r => setTimeout(r, 500)); const w = wallets().find(x => x.id === id); if (!w) return; try { const r = await w.p.connect({ onlyIfTrusted: true }); const pk = (r?.publicKey || w.p.publicKey)?.toString(); if (pk) { S.wallet = pk; S.prov = w.p; walletUI(); loadBoard(); } } catch (_) {} })();

// ---------------------------------------------------------------- the bet slip: sign a message, store the call
const msgOf = b => `betz call\ncoin: ${b.mint}\nmarket: ${b.mkt}\nside: ${b.side === 'Y' ? 'YES' : 'NO'}\ntime: ${b.ts}`;
let pending = null;
function slip(c, k, side) { pending = { c, k, side }; const due = new Date(Date.now() + 864e5);
  $('#slip').innerHTML = `BETZ BET SLIP<br>────────────────<br>$${esc(c.symbol)} · ${esc(c.name)}<br>${mq(k)}<div class="big" style="color:${side === 'Y' ? '#0f8a5f' : '#c42a3a'}">${side === 'Y' ? 'YES' : 'NO'}</div>called at ${money(c.mcap)} mcap<br>graded ${due.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}<br>stake: free`;
  $('#mCall').classList.add('on'); }
$('#sign').onclick = async () => { if (!pending) return; if (!S.wallet && !(await connect())) return; const { c, k, side } = pending; const b = { wallet: S.wallet, mint: c.mint, mkt: k, side, ts: Date.now() };
  const btn = $('#sign'); btn.disabled = true; btn.textContent = 'check your wallet…';
  try { if (!S.prov?.signMessage) throw new Error('this wallet cannot sign messages'); const r = await S.prov.signMessage(new TextEncoder().encode(msgOf(b)), 'utf8'); const sig = r?.signature || r; b.sig = b58(new Uint8Array(sig));
    await api('/api/call', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }); closeModals(); toast(`called ${side === 'Y' ? 'YES' : 'NO'} on $${c.symbol}`); await loadBoard(); renderDet(); share(c, k, side); }
  catch (e) { toast(e.message || 'cancelled', 1); } finally { btn.disabled = false; btn.textContent = 'sign the call'; } };

function share(c, k, side) { const cv = $('#card'), g = cv.getContext('2d'), W = 1200, Hh = 675; const gr = g.createLinearGradient(0, 0, W, Hh); gr.addColorStop(0, '#4a1238'); gr.addColorStop(1, '#1a0717'); g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
  g.fillStyle = 'rgba(255,79,166,.18)'; g.beginPath(); g.arc(W * .85, Hh * .1, 380, 0, 7); g.fill(); g.fillStyle = '#fff6f2'; g.font = '900 64px RB'; g.fillText('betz', 70, 110); g.font = '700 22px Rubik'; g.globalAlpha = .7; g.fillText('PREDICTION MARKETS FOR EVERY GTA COIN', 70, 150); g.globalAlpha = 1;
  g.font = '900 54px RB'; g.fillText('$' + c.symbol, 70, 290); g.font = '500 30px Rubik'; g.globalAlpha = .8; g.fillText(mq(k), 70, 340); g.globalAlpha = 1;
  g.font = '900 210px RB'; g.fillStyle = side === 'Y' ? '#2fe0a8' : '#ff5a6a'; g.fillText(side === 'Y' ? 'YES' : 'NO', 62, 540); g.fillStyle = '#fff6f2'; g.font = '600 26px JB'; g.fillText(`called at ${money(c.mcap)} · graded in 24h · free`, 70, 610);
  $('#dl').onclick = () => { const a = document.createElement('a'); a.download = `betz-${c.symbol}-${side === 'Y' ? 'yes' : 'no'}.png`; a.href = cv.toDataURL('image/png'); a.click(); };
  $('#tw').href = 'https://x.com/intent/post?text=' + encodeURIComponent(`I called ${side === 'Y' ? 'YES' : 'NO'} on $${c.symbol}: ${mq(k)}\ncalled at ${money(c.mcap)}, graded on-chain in 24h.\n\n${location.origin}`); $('#mShare').classList.add('on'); }

// ---------------------------------------------------------------- go
loadCoins(); loadBoard(); loadPM();
setInterval(loadCoins, 30000); setInterval(loadBoard, 15000); setInterval(loadPM, 120000);
setInterval(() => { if (S.tab === 'mine') renderMine(); }, 30000);
addEventListener('resize', () => { if (S.tab === 'markets' && S.sel) drawChart(S.sel); if (S.tab === 'map') renderMap(); });
