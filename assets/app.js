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
function clock() { const s = (GTA - Date.now()) / 1e3; const t = s <= 0 ? 'out now' : `${s / 86400 | 0}d ${(s % 86400) / 3600 | 0}h ${(s % 3600) / 60 | 0}m ${s % 60 | 0}s`; $('#cdT').textContent = t; $('#sCd').textContent = s <= 0 ? 'out now' : t.split(' ').slice(0, 3).join(' '); }
setInterval(clock, 1000); clock();

// ---------------------------------------------------------------- state
const S = { coins: [], byMint: {}, sel: null, sort: 'mcap', q: '', board: null, pm: null, wallet: null, prov: null, focus: 0, tf: 'm', chart: null };
const MK = [['up', 'Higher in 24h?'], ['x2', '2x in 24h?'], ['rug', 'Halves in 24h?']];

// ---------------------------------------------------------------- loading screen, GTA style
const TIPS = ['Every call is free. You sign a message, nothing is sent on-chain.', 'A call is graded 24 hours after you make it, against the coin\'s live market cap.', 'Press Q and E to flip through the terminal tabs.', 'The crowd sets the odds. Zero calls means an empty bar.', 'Polymarket\'s GTA VI markets are in the terminal, with their real odds.', 'One open call per market per coin. Make it count.'];
let tipI = 0; const tipH = setInterval(() => { tipI = (tipI + 1) % TIPS.length; $('#tipT').textContent = TIPS[tipI]; }, 2600);
let sceneOk = false, coinsOk = false; const lb = $('#lbar');
function progress() { const p = (sceneOk ? 55 : 15) + (coinsOk ? 45 : 0); lb.style.width = p + '%'; $('#lbT').textContent = !sceneOk ? 'loading the street' : !coinsOk ? 'loading markets' : 'ready'; if (sceneOk && coinsOk) done(); }
function done() { if (done.d) return; done.d = 1; setTimeout(() => { $('#load').classList.add('out'); H.classList.add('go'); clearInterval(tipH); if (location.hash === '#terminal') openTerm(); }, 350); }
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
    if (!S.sel && S.coins[0]) S.sel = S.coins[0].mint; renderStats(); renderTape(); renderRows(); renderDet(); $('#upd').textContent = 'updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch (e) { coinsOk = true; progress(); $('#rows').innerHTML = `<div class="empty">couldn't reach Jupiter right now (${esc(e.message)}). retrying…</div>`; } }
function ico(c, big) { return c.icon ? `<img src="${esc(c.icon)}" alt="" loading="lazy" onerror="this.outerHTML='<div class=ph>${esc((c.symbol || '?')[0])}</div>'">` : `<div class="ph">${esc((c.symbol || '?')[0])}</div>`; }
function renderStats() { const C = S.coins; $('#sCoins').textContent = C.length; $('#nCoins').textContent = C.length; $('#sMcap').textContent = money(C.reduce((a, c) => a + c.mcap, 0)); $('#sVol').textContent = money(C.reduce((a, c) => a + c.vol24h, 0));
  const t = S.board?.totals; $('#sOpen').textContent = t ? t.open : '—'; $('#sCallers').textContent = t ? t.callers : '—'; }
function renderTape() { const C = S.coins.slice(0, 30); if (!C.length) return; const one = C.map(c => `<span class="it">${ico(c)}<b>$${esc(c.symbol)}</b><span class="mono">${money(c.mcap)}</span><span class="mono ${cls(c.ch24h)}">${pct(c.ch24h)}</span></span>`).join('');
  $('#tapeR').innerHTML = one + one; }
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
        ${mine ? `<div class="mine">your call: <b class="${mine.side === 'Y' ? 'up' : 'dn'}">${mine.side === 'Y' ? 'YES' : 'NO'}</b> at ${money(mine.mcap0)} · graded in ${left(mine.due)}</div>` : `<div class="yn"><button class="y" data-side="Y">YES</button><button class="no" data-side="N">NO</button></div>`}</div>`; }).join('')}</div>`;
  $('#cp').onclick = () => { navigator.clipboard?.writeText(c.mint); toast('contract copied'); };
  $$('#det .chip[data-tf]').forEach(b => b.onclick = () => { S.tf = b.dataset.tf; renderDet(); });
  $$('#det .mk').forEach((el, i) => { el.onmouseenter = () => focusMk(i); $$('button[data-side]', el).forEach(b => b.onclick = () => slip(c, el.dataset.k, b.dataset.side)); });
  drawChart(c.mint); }
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

// ---------------------------------------------------------------- board, feed, my calls
async function loadBoard() { try { S.board = await api('/api/board' + (S.wallet ? '?wallet=' + S.wallet : '')); renderStats(); renderFeed(); renderBoard(); renderMine(); renderRows(); if (!document.activeElement?.closest?.('#det')) renderDetSoft(); } catch (e) { $('#feed').innerHTML = `<div class="empty">calls are offline: ${esc(e.message)}</div>`; } }
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
async function loadPM() { try { S.pm = await api('/api/pm'); const E = S.pm.events || []; $('#nPoly').textContent = E.length;
    $('#pm').innerHTML = E.length ? E.map(e => `<div class="ev"><div class="t">${e.image ? `<img src="${esc(e.image)}" alt="" loading="lazy">` : ''}<h3>${esc(e.title)}</h3></div>
      ${e.markets.slice(0, 4).map(m => `<div class="m"><span>${esc(m.label || m.q)}</span><b>${Math.round(m.yes * 100)}%</b><div class="bar"><i style="width:${m.yes * 100}%"></i><u style="width:${(1 - m.yes) * 100}%"></u></div></div>`).join('')}
      <div class="meta"><span>vol ${money(e.vol)}</span><span>${e.end ? 'ends ' + new Date(e.end).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span></div>
      <a class="go" href="${esc(e.url)}" target="_blank" rel="noopener">trade on polymarket ↗</a></div>`).join('') : '<div class="empty">no open GTA markets on Polymarket right now.</div>'; }
  catch (e) { $('#pm').innerHTML = `<div class="empty">couldn't reach Polymarket (${esc(e.message)}).</div>`; } }

// ---------------------------------------------------------------- tabs + keys
const TABS = $$('.tab').map(t => t.dataset.t);
function tab(t) { $$('.tab').forEach(b => b.classList.toggle('on', b.dataset.t === t)); $$('.pane').forEach(p => p.classList.toggle('on', p.dataset.p === t)); S.tab = t; if (t === 'markets') renderDet(); }
$$('.tab').forEach(b => b.onclick = () => tab(b.dataset.t)); S.tab = 'markets';
addEventListener('keydown', e => { if (e.target.matches('input')) { if (e.key === 'Escape') e.target.blur(); return; } if ($('.modal.on')) { if (e.key === 'Escape') closeModals(); if (e.key === 'Enter' && $('#mCall.on')) $('#sign').click(); return; }
  const k = e.key.toLowerCase();
  if (!H.classList.contains('term')) { if (k === 'enter') openTerm(); return; }
  if (k === 'escape') return openHome();
  if (k === 'q' || k === 'e') { const i = TABS.indexOf(S.tab); tab(TABS[(i + (k === 'e' ? 1 : TABS.length - 1)) % TABS.length]); return; }
  if (S.tab !== 'markets') return;
  if (k === 'arrowdown' || k === 'arrowup') { e.preventDefault(); const C = sorted(), i = C.findIndex(c => c.mint === S.sel), n = C[Math.max(0, Math.min(C.length - 1, i + (k === 'arrowdown' ? 1 : -1)))]; if (n) select(n.mint, 1); }
  if (k === '1' || k === '2' || k === '3') focusMk(+k - 1);
  if (k === '/') { e.preventDefault(); $('#q').focus(); }
  if (k === 'y' || k === 'n') { const c = S.byMint[S.sel]; if (c && !myOpen(c.mint, MK[S.focus][0])) slip(c, MK[S.focus][0], k === 'y' ? 'Y' : 'N'); } });

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
    await api('/api/call', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }); closeModals(); toast(`called ${side === 'Y' ? 'YES' : 'NO'} on $${c.symbol}`); await loadBoard(); renderDet(); }
  catch (e) { toast(e.message || 'cancelled', 1); } finally { btn.disabled = false; btn.textContent = 'sign the call'; } };

// ---------------------------------------------------------------- go
loadCoins(); loadBoard(); loadPM();
setInterval(loadCoins, 30000); setInterval(loadBoard, 15000); setInterval(loadPM, 120000);
setInterval(() => { if (S.tab === 'mine') renderMine(); }, 30000);
addEventListener('resize', () => { if (S.tab === 'markets' && S.sel) drawChart(S.sel); });
