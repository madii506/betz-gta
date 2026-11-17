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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><g transform="translate(10 10) scale(.9)" stroke="#4a1238" stroke-width="10" stroke-linejoin="round" paint-order="stroke"><path fill="#fff6f2" d="${body}"/><path fill="#fff6f2" d="${wedge}"/></g></svg>`;
  $('link[rel=icon]').href = 'data:image/svg+xml,' + encodeURIComponent(svg); })();

// ---------------------------------------------------------------- GTA VI clock
const GTA = Date.parse('2026-11-19T00:00:00-05:00');
function clock() { const s = (GTA - Date.now()) / 1e3; const t = s <= 0 ? 'out now' : `${s / 86400 | 0}d ${(s % 86400) / 3600 | 0}h ${(s % 3600) / 60 | 0}m ${s % 60 | 0}s`; $('#sCd').textContent = s <= 0 ? 'out now' : t.split(' ').slice(0, 3).join(' '); const hb = $('#hubCd'); if (hb) hb.textContent = s <= 0 ? 'OUT NOW' : t; }
setInterval(clock, 1000); clock();

// ---------------------------------------------------------------- state
const S = { coins: [], byMint: {}, sel: null, sort: 'mcap', q: '', board: null, pm: null, wallet: null, prov: null, focus: 0, tf: 'm', chart: null, cmode: store.get('betz:cm') || 'l', watch: (() => { try { return JSON.parse(store.get('betz:watch') || '[]'); } catch (_) { return []; } })() };
const MK = [['up', 'Higher in 24h?'], ['p50', '+50% in 24h?'], ['x2', '2x in 24h?'], ['x10', '10x in 24h?'], ['rug', 'Halves in 24h?']];

// ---------------------------------------------------------------- loading: one line, nothing else
let sceneOk = false, coinsOk = false; const lb = $('#lbar');
function progress() { lb.style.width = ((sceneOk ? 60 : 18) + (coinsOk ? 40 : 0)) * 2.4 + 'px'; if (sceneOk && coinsOk) done(); }
function done() { if (done.d) return; done.d = 1; setTimeout(() => { $('#load').classList.add('out'); H.classList.add('go'); if (location.hash === '#terminal') { openTerm(); loadTicker(); } }, 400); }
addEventListener('betz:scene', () => { sceneOk = true; progress(); });
setTimeout(() => { sceneOk = true; coinsOk = true; progress(); }, 9000);
progress();

// ---------------------------------------------------------------- home <-> terminal
function openTerm() { if (!H.classList.contains('term')) { const w = $('#wipe'); w.classList.remove('go'); void w.offsetWidth; w.classList.add('go'); } H.classList.add('term'); window.betzScene?.mode('term'); if (location.hash !== '#terminal') history.replaceState(null, '', '#terminal'); }
function openHome() { H.classList.remove('term'); window.betzScene?.mode('home'); history.replaceState(null, '', location.pathname); }
$('#enter').onclick = () => { openTerm(); loadTicker(); }; $('#toHome').onclick = openHome;
$('#hconn').onclick = () => connect(); $('#wal').onclick = () => S.wallet ? disconnect() : connect();

// ---------------------------------------------------------------- the GTA money counter on the street
let cashV = 0; function cashTo(v) { const a = cashV, t0 = performance.now(); const step = t => { const k = Math.min(1, (t - t0) / 1600), e = 1 - Math.pow(1 - k, 3); cashV = a + (v - a) * e; $('#cash').textContent = '$' + Math.round(cashV).toLocaleString('en-US'); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }

// ---------------------------------------------------------------- coins
async function loadCoins() { try { const j = await api('/api/coins'); S.prev = Object.fromEntries((S.coins || []).map(c => [c.mint, c.mcap])); S.coins = j.coins || []; S.byMint = Object.fromEntries(S.coins.map(c => [c.mint, c])); coinsOk = true; progress();
    if (!S.sel && S.coins[0]) S.sel = S.coins[0].mint; renderStats(); renderRows(true); checkAlerts(); if (!$('#det .mkts')) renderDet(); else softHead(); renderMovers(); renderMap(); renderHub(); $('#upd').textContent = 'updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch (e) { coinsOk = true; progress(); $('#rows').innerHTML = `<div class="empty">couldn't reach Jupiter right now (${esc(e.message)}). retrying…</div>`; } }
function ico(c, big) { return c.icon ? `<img src="${esc(c.icon)}" alt="" loading="lazy" onerror="this.outerHTML='<div class=ph>${esc((c.symbol || '?')[0])}</div>'">` : `<div class="ph">${esc((c.symbol || '?')[0])}</div>`; }
function renderStats() { const C = S.coins; if (C.length && $('#fCoins')) $('#fCoins').textContent = C.length; $('#sCoins').textContent = C.length; $('#nCoins').textContent = C.length; countUp($('#sMcap'), C.reduce((a, c) => a + c.mcap, 0), money); countUp($('#sVol'), C.reduce((a, c) => a + c.vol24h, 0), money);
  const t = S.board?.totals; $('#sOpen').textContent = t ? t.open : '—'; $('#sCallers').textContent = t ? t.callers : '—'; }
// ---------------------------------------------------------------- wanted level, sparkline, rank
function heat(c) { const v = Math.max(Math.abs(c.ch24h || 0), Math.abs(c.st?.h1?.pc || c.ch1h || 0) * 4); return v >= 120 ? 5 : v >= 60 ? 4 : v >= 30 ? 3 : v >= 15 ? 2 : v >= 5 ? 1 : 0; }
function wanted(c) { const h = heat(c); return `<span class="wanted" title="wanted level: how wild it moves">${[0, 1, 2, 3, 4].map(i => `<i class="${i < h ? 'on' : ''}">★</i>`).join('')}</span>`; }
function spark(c) { const st = c.st || {}, p = c.price || 1; const at = pc => pc == null ? null : p / (1 + pc / 100); let pts = [at(st.h24?.pc ?? c.ch24h), at(st.h6?.pc), at(st.h1?.pc ?? c.ch1h), at(st.m5?.pc), p];
  pts = pts.map((v, i) => v == null ? null : v); for (let i = 0; i < pts.length; i++) if (pts[i] == null) pts[i] = pts[i - 1] ?? pts.find(x => x != null);
  const lo = Math.min(...pts), hi = Math.max(...pts), xs = [0, 30, 50, 60, 64], Y = v => 22 - (v - lo) / (hi - lo || 1) * 18; const up = pts[4] >= pts[0], col = up ? '#2fe0a8' : '#ff5a6a';
  const d = pts.map((v, i) => (i ? 'L' : 'M') + xs[i] + ' ' + Y(v).toFixed(1)).join(' ');
  return `<svg class="spk" viewBox="0 0 64 26" preserveAspectRatio="none"><path d="${d} L64 26 L0 26Z" fill="${col}" opacity=".14"/><path d="${d}" fill="none" stroke="${col}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="64" cy="${Y(pts[4]).toFixed(1)}" r="2" fill="${col}"/></svg>`; }
const TIERS = [[0, 'rookie'], [1, 'runner'], [5, 'hustler'], [15, 'made'], [40, 'kingpin']];
function tier(won) { let t = 0; TIERS.forEach((x, i) => { if (won >= x[0]) t = i; }); return `<span class="tier t${t}">${TIERS[t][1]}</span>`; }
function countUp(el, to, fmt) { if (!el) return; const from = +el.dataset.v || 0, t0 = performance.now(); el.dataset.v = to; const step = t => { const k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
function softHead() { const c = S.byMint[S.sel]; if (!c) return; const b = $('#det .dh .px b'); if (b) countUp(b, c.mcap, money); }
function callsOn(m) { const o = S.board?.odds?.[m]; return o ? Object.values(o).reduce((a, x) => a + x.y + x.n, 0) : 0; }
function upShare(m) { const o = S.board?.odds?.[m]?.up; return o && o.y + o.n ? o.y / (o.y + o.n) : null; }
function sorted() { let C = S.coins.slice(); const q = S.q.trim().toLowerCase(); if (q) C = C.filter(c => (c.name + ' ' + c.symbol + ' ' + c.mint).toLowerCase().includes(q));
  const k = S.sort; if (k === 'watch') C = C.filter(c => watching(c.mint)); C.sort((a, b) => k === 'new' ? new Date(b.created || 0) - new Date(a.created || 0) : k === 'called' ? callsOn(b.mint) - callsOn(a.mint) || b.mcap - a.mcap : (b[k === 'watch' ? 'mcap' : k] ?? -1e9) - (a[k === 'watch' ? 'mcap' : k] ?? -1e9)); return C; }
function renderRows(flash) { const C = sorted(); if (!C.length) { $('#rows').innerHTML = S.sort === 'watch' ? '<div class="empty">your watchlist is empty. hit ☆ watch on a coin.</div>' : '<div class="empty">no GTA coin matches that.</div>'; return; }
  $('#rows').innerHTML = C.map(c => { const u = upShare(c.mint), n = callsOn(c.mint);
    const pv = flash && S.prev ? S.prev[c.mint] : null, fl = pv && c.mcap !== pv ? (c.mcap > pv ? ' fu' : ' fd') : '';
    return `<div class="row${c.mint === S.sel ? ' on' : ''}${fl}" data-m="${c.mint}">${ico(c)}<div class="nm"><b>${watching(c.mint) ? '<span class="stw">★</span> ' : ''}${esc(c.name)}</b><span>$${esc(c.symbol)}${wanted(c)}${n ? ' · ' + n : ''}</span></div>${spark(c)}<div class="rt"><b>${money(c.mcap)}</b><br><span class="${cls(c.ch24h)}">${pct(c.ch24h)}</span>${u == null ? '' : `<div class="minibar"><i style="width:${u * 100}%"></i><u style="width:${(1 - u) * 100}%"></u></div>`}</div></div>`; }).join('');
  $$('#rows .row').forEach(r => r.onclick = () => select(r.dataset.m)); }
function select(m, scroll) { S.sel = m; S.focus = 0; $$('#rows .row').forEach(r => r.classList.toggle('on', r.dataset.m === m)); if (scroll) $(`#rows .row[data-m="${m}"]`)?.scrollIntoView({ block: 'nearest' }); renderDet(); }
$('#q').oninput = e => { S.q = e.target.value; renderRows(); };
$$('.chip[data-s]').forEach(b => b.onclick = () => { S.sort = b.dataset.s; $$('.chip[data-s]').forEach(x => x.classList.toggle('on', x === b)); renderRows(); });

// ---------------------------------------------------------------- the coin: header, stats, chart, three markets
function myOpen(m, k) { return (S.board?.mine || []).find(c => c.mint === m && c.mkt === k && c.status === 'open'); }
function renderDet() { const c = S.byMint[S.sel]; const D = $('#det'); if (!c) { D.innerHTML = '<div class="empty">pick a GTA coin.</div>'; return; }
  const odds = S.board?.odds?.[c.mint] || {};
  D.innerHTML = `<div class="dh">${ico(c, 1)}<div><h2>${esc(c.name)}</h2><div class="sub"><span>$${esc(c.symbol)}</span><button id="cp">${short(c.mint)} ⧉</button><a href="https://pump.fun/coin/${c.mint}" target="_blank" rel="noopener">pump.fun ↗</a><a href="https://dexscreener.com/solana/${c.mint}" target="_blank" rel="noopener">chart ↗</a><a href="https://jup.ag/tokens/${c.mint}" target="_blank" rel="noopener">jup ↗</a>${c.twitter ? `<a href="${esc(c.twitter)}" target="_blank" rel="noopener">𝕏 ↗</a>` : ''}${c.website ? `<a href="${esc(c.website)}" target="_blank" rel="noopener">site ↗</a>` : ''}${c.dev ? `<a href="https://solscan.io/account/${esc(c.dev)}" target="_blank" rel="noopener">dev ${short(c.dev)}</a>` : ''}<button id="bell" class="bell${alertOf(c.mint) ? ' on' : ''}">${alertOf(c.mint) ? '🔔 alert set' : '🔔 alert'}</button><button id="star">${watching(c.mint) ? '★ watching' : '☆ watch'}</button></div></div>
    <div class="px"><div class="wl2">WANTED ${wanted(c)}</div><b data-v="${c.mcap}">${money(c.mcap)}</b><span class="${cls(c.ch24h)}">${pct(c.ch24h)} 24h</span></div></div>
    <div class="grid"><div><span>price</span><b>${money(c.price)}</b></div><div><span>1h</span><b class="${cls(c.ch1h)}">${pct(c.ch1h)}</b></div><div><span>24h volume</span><b>${money(c.vol24h)}</b></div><div><span>holders</span><b>${(c.holders || 0).toLocaleString()}</b></div>
    <div><span>liquidity</span><b>${money(c.liq)}</b></div><div><span>buys / sells 24h</span><b>${(c.buys24h || 0).toLocaleString()} / ${(c.sells24h || 0).toLocaleString()}</b></div><div><span>launchpad</span><b>${esc(c.launchpad || '—')}</b></div><div><span>age</span><b>${c.created ? ago(new Date(c.created).getTime()) : '—'}</b></div></div>
    <div class="chart"><div class="tf">${[['m', '15m'], ['h', '1h'], ['4', '4h'], ['d', '1d']].map(([k, l]) => `<button class="chip${S.tf === k ? ' on' : ''}" data-tf="${k}">${l}</button>`).join('')}<button class="chip${S.cmode === 'c' ? ' on' : ''}" id="cmode">${S.cmode === 'c' ? 'candles' : 'line'}</button></div><canvas id="cv"></canvas><div class="em" id="cvE">loading chart…</div></div>
    <div class="mkts">${MK.map(([k, q], i) => { const o = odds[k] || { y: 0, n: 0 }, n = o.y + o.n, y = n ? o.y / n : null, mine = myOpen(c.mint, k);
      return `<div class="mk${S.focus === i ? ' f' : ''}" data-k="${k}"><div class="q"><kbd>${i + 1}</kbd>${q}</div>
        <div class="od"><span class="up">YES ${y == null ? '—' : Math.round(y * 100) + '%'}</span><span class="dn">NO ${y == null ? '—' : Math.round((1 - y) * 100) + '%'}</span></div>
        <div class="bar"><i style="width:${y == null ? 0 : y * 100}%"></i><u style="width:${y == null ? 0 : (1 - y) * 100}%"></u></div>
        <div class="n">${n ? n + ' open call' + (n === 1 ? '' : 's') : 'no calls yet · be first'}</div>
        ${mine ? `<div class="mine">your call: <b class="${mine.side === 'Y' ? 'up' : 'dn'}">${mine.side === 'Y' ? 'YES' : 'NO'}</b> at ${money(mine.mcap0)} · graded in ${left(mine.due)}</div>` : `<div class="yn"><button class="y" data-side="Y">YES</button><button class="no" data-side="N">NO</button></div>`}</div>`; }).join('')}</div>
    <div class="two"><div class="box"><div class="bh">trade $${esc(c.symbol)} <span class="sp"></span><small>Jupiter · you sign in your wallet</small></div><div class="trade" id="trade"></div></div>
    <div class="box"><div class="bh">your position <span class="sp"></span><small id="posT"></small></div><div id="pos"></div></div></div>
    <div class="two"><div class="box"><div class="bh">order flow <span class="sp"></span><small>Jupiter · all pools</small></div>${flow(c)}</div>
    <div class="box"><div class="bh">safety check <span class="sp"></span><small>${c.orgLabel ? 'organic: ' + esc(c.orgLabel) : ''}</small></div>${safety(c)}</div></div>
    <div class="two"><div class="box"><div class="bh">what if <span class="sp"></span><small>market cap calculator</small></div><div class="calc"><label>you put in <span>$</span><input id="cIn" type="number" min="0" value="100"></label><label>it hits <span>$</span><input id="cTo" type="number" min="0" value="${Math.round((c.mcap * 5) / 1e5) * 1e5 || 1000000}"></label><div id="cOut"></div><div class="presets">${[2, 5, 10, 50].map(x => `<button class="chip" data-x="${x}">${x}x</button>`).join('')}<button class="chip" data-x="m1">$1M</button><button class="chip" data-x="m100">$100M</button></div></div></div>
    <div class="box"><div class="bh">calls on $${esc(c.symbol)} <span class="sp"></span><small>${callsOn(c.mint)} open</small></div><div id="ccalls">${coinCalls(c)}</div></div></div>
    <div class="two"><div class="box"><div class="bh">live trades <span class="sp"></span><small>top pool · GeckoTerminal</small></div><div id="trs"><div class="empty">loading…</div></div></div>
    <div class="box"><div class="bh">top holders <span class="sp"></span><small id="t10"></small></div><div id="hds"><div class="empty">loading…</div></div></div></div>`;
  $('#cp').onclick = () => { navigator.clipboard?.writeText(c.mint); toast('contract copied'); };
  $('#star').onclick = () => { toggleWatch(c.mint); renderDet(); renderRows(); };
  $('#bell').onclick = () => alertModal(c); tradeUI(c); posUI(c);
  $('#cmode').onclick = () => { S.cmode = S.cmode === 'c' ? 'l' : 'c'; store.set('betz:cm', S.cmode); renderDet(); };
  const calc = () => { const a = +$('#cIn').value || 0, t = +$('#cTo').value || 0, x = c.mcap ? t / c.mcap : 0; $('#cOut').innerHTML = `<b class="${x >= 1 ? 'up' : 'dn'}">${money(a * x)}</b><span>${x ? x.toFixed(x >= 10 ? 0 : 2) + 'x from ' + money(c.mcap) : '—'}</span>`; };
  $('#cIn').oninput = calc; $('#cTo').oninput = calc; $$('.calc .chip').forEach(b => b.onclick = () => { const v = b.dataset.x; $('#cTo').value = v === 'm1' ? 1e6 : v === 'm100' ? 1e8 : Math.round(c.mcap * +v); calc(); }); calc();
  $$('#det .chip[data-tf]').forEach(b => b.onclick = () => { S.tf = b.dataset.tf; renderDet(); });
  $$('#det .mk').forEach((el, i) => { el.onmouseenter = () => focusMk(i); $$('button[data-side]', el).forEach(b => b.onclick = () => slip(c, el.dataset.k, b.dataset.side)); });
  drawChart(c.mint); extras(c.mint); }
function flow(c) { const S2 = c.st || {}; const rows = [['m5', '5m'], ['h1', '1h'], ['h6', '6h'], ['h24', '24h']];
  const n = v => v == null ? '—' : (+v).toLocaleString(); const d = v => v == null ? '—' : `<span class="${cls(v)}">${pct(v)}</span>`;
  return `<table class="ft2"><thead><tr><th></th>${rows.map(r => `<th>${r[1]}</th>`).join('')}</tr></thead><tbody>
    <tr><td>price</td>${rows.map(r => `<td>${d(S2[r[0]]?.pc)}</td>`).join('')}</tr>
    <tr><td>volume</td>${rows.map(r => `<td>${money(S2[r[0]]?.vol || 0)}</td>`).join('')}</tr>
    <tr><td>buy / sell $</td>${rows.map(r => { const x = S2[r[0]] || {}, t = (x.bv || 0) + (x.sv || 0); return `<td><div class="bs"><i style="width:${t ? x.bv / t * 100 : 50}%"></i></div></td>`; }).join('')}</tr>
    <tr><td>buys / sells</td>${rows.map(r => `<td>${n(S2[r[0]]?.buys)} / ${n(S2[r[0]]?.sells)}</td>`).join('')}</tr>
    <tr><td>traders</td>${rows.map(r => `<td>${n(S2[r[0]]?.traders)}</td>`).join('')}</tr>
    <tr><td>net buyers</td>${rows.map(r => `<td>${n(S2[r[0]]?.net)}</td>`).join('')}</tr>
    <tr><td>holders</td>${rows.map(r => `<td>${d(S2[r[0]]?.hc)}</td>`).join('')}</tr>
    <tr><td>liquidity</td>${rows.map(r => `<td>${d(S2[r[0]]?.lc)}</td>`).join('')}</tr></tbody></table>`; }
function safety(c) { const a = c.audit || {}; const row = (ok, label, val) => `<div class="sf"><i class="${ok === null ? 'q' : ok ? 'ok' : 'no'}">${ok === null ? '?' : ok ? '✓' : '!'}</i><span>${label}</span><b>${val}</b></div>`;
  const th = a.topHoldersPercentage, dv = a.devBalancePercentage;
  return `<div class="sfs">${row(a.mintAuthorityDisabled ?? null, 'mint authority', a.mintAuthorityDisabled ? 'revoked' : a.mintAuthorityDisabled === false ? 'ACTIVE' : '—')}
    ${row(a.freezeAuthorityDisabled ?? null, 'freeze authority', a.freezeAuthorityDisabled ? 'revoked' : a.freezeAuthorityDisabled === false ? 'ACTIVE' : '—')}
    ${row(th == null ? null : th < 30, 'top holders own', th == null ? '—' : th.toFixed(1) + '%')}
    ${row(dv == null ? null : dv < 5, 'dev holds', dv == null ? '—' : dv.toFixed(2) + '%')}
    ${row(a.devMints == null ? null : a.devMints < 10, 'coins this dev made', a.devMints ?? '—')}
    ${row(c.liq ? c.liq > 20000 : null, 'liquidity', money(c.liq))}
    ${row(c.grad ? true : c.launchpad ? null : null, 'bonding curve', c.grad ? 'graduated ' + ago(new Date(c.grad).getTime()) + ' ago' : 'on curve / n.a.')}
    ${row(c.isVerified || (c.tags || []).includes('verified') ? true : null, 'Jupiter verified', c.isVerified || (c.tags || []).includes('verified') ? 'yes' : 'no')}</div>`; }
function coinCalls(c) { const R = (S.board?.recent || []).filter(x => x.mint === c.mint); return R.length ? R.slice(0, 8).map(x => `<div class="fi"><span class="pill ${x.side}">${x.side === 'Y' ? 'YES' : 'NO'}</span><span>${mq(x.mkt)}<br><span class="when"><span class="wl" data-w="${x.wallet}">${short(x.wallet)}</span> at ${money(x.mcap0)}</span></span><span class="when">${x.status === 'open' ? ago(x.ts) : `<span class="pill ${x.status}">${x.status}</span>`}</span></div>`).join('') : '<div class="empty">no calls on this coin yet. be first.</div>'; }
function watching(m) { return (S.watch || []).includes(m); }
function toggleWatch(m) { S.watch = watching(m) ? S.watch.filter(x => x !== m) : [...(S.watch || []), m]; store.set('betz:watch', JSON.stringify(S.watch)); toast(watching(m) ? 'added to watchlist' : 'removed from watchlist'); }
function focusMk(i) { S.focus = i; $$('#det .mk').forEach((el, k) => el.classList.toggle('f', k === i)); }
async function drawChart(mint) { const cv = $('#cv'), E = $('#cvE'); if (!cv) return; const key = mint + S.tf; let d = S.chart?.key === key ? S.chart.d : null;
  if (!d) { try { d = await api(`/api/chart?mint=${mint}&tf=${S.tf}`); S.chart = { key, d }; } catch (e) { d = { candles: [] }; } }
  if (S.sel !== mint || !$('#cv')) return; const C = d.candles || []; if (C.length < 3) { if (E) E.textContent = 'no chart data for this coin yet'; return; } E?.remove();
  const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2); if (r.width < 20 || r.height < 20) return; cv.width = r.width * dpr; cv.height = r.height * dpr; const g = cv.getContext('2d'); g.scale(dpr, dpr);
  const W = r.width, Hh = r.height, pad = 14, lo = Math.min(...C.map(x => x.l)), hi = Math.max(...C.map(x => x.h)), X = i => pad + i / (C.length - 1) * (W - pad * 2 - 54), Y = v => pad + 18 + (1 - (v - lo) / (hi - lo || 1)) * (Hh - pad * 2 - 30);
  const up = C[C.length - 1].c >= C[0].o, col = up ? '#2fe0a8' : '#ff5a6a';
  g.strokeStyle = 'rgba(255,246,242,.07)'; g.lineWidth = 1; for (let k = 0; k < 4; k++) { const y = pad + 18 + k * (Hh - pad * 2 - 30) / 3; g.beginPath(); g.moveTo(pad, y); g.lineTo(W - pad - 54, y); g.stroke(); g.fillStyle = 'rgba(255,246,242,.38)'; g.font = '500 10px JB'; g.fillText(money(hi - k * (hi - lo) / 3), W - pad - 50, y + 3); }
  const grd = g.createLinearGradient(0, 0, 0, Hh); grd.addColorStop(0, up ? 'rgba(47,224,168,.32)' : 'rgba(255,90,106,.32)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  if (S.cmode === 'c') { const bw = Math.max(1, (W - pad * 2 - 54) / C.length * .66); C.forEach((x, i) => { const u = x.c >= x.o; g.strokeStyle = g.fillStyle = u ? '#2fe0a8' : '#ff5a6a'; g.beginPath(); g.moveTo(X(i), Y(x.h)); g.lineTo(X(i), Y(x.l)); g.stroke(); const y0 = Y(Math.max(x.o, x.c)), y1 = Y(Math.min(x.o, x.c)); g.fillRect(X(i) - bw / 2, y0, bw, Math.max(1, y1 - y0)); }); }
  else { g.beginPath(); C.forEach((x, i) => i ? g.lineTo(X(i), Y(x.c)) : g.moveTo(X(i), Y(x.c))); g.lineTo(X(C.length - 1), Hh); g.lineTo(X(0), Hh); g.closePath(); g.fillStyle = grd; g.fill();
  g.beginPath(); C.forEach((x, i) => i ? g.lineTo(X(i), Y(x.c)) : g.moveTo(X(i), Y(x.c))); g.strokeStyle = col; g.lineWidth = 2; g.shadowColor = col; g.shadowBlur = 10; g.stroke(); g.shadowBlur = 0; }
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
    $('#hds').innerHTML = Hs.length ? Hs.slice(0, 10).map((h, i) => `<div class="hd"><span class="when">${i + 1}</span><a href="https://solscan.io/account/${esc(h.owner || h.account)}" target="_blank" rel="noopener">${h.tag ? esc(h.tag.replace(/liquidity pool/i, 'pool')) : short(h.owner || h.account)}</a><b>${(h.pct * 100).toFixed(2)}%</b><div class="hb"><i style="width:${Math.min(100, h.pct * 100 * 2)}%"></i></div></div>`).join('') : '<div class="empty">holders unavailable.</div>'; }).catch(() => { if ($('#hds')) $('#hds').innerHTML = '<div class="empty">holders unavailable right now.</div>'; }); }

// ---------------------------------------------------------------- every market, one board
function renderAll() { const el = $('#allm'); if (!el) return; const C = S.coins.slice().sort((a, b) => callsOn(b.mint) - callsOn(a.mint) || b.mcap - a.mcap);
  el.innerHTML = `<table class="am"><thead><tr><th>coin</th><th>mcap</th><th>24h</th>${MK.map(m => `<th>${m[1]}</th>`).join('')}</tr></thead><tbody>${C.map(c => { const o = S.board?.odds?.[c.mint] || {};
    return `<tr><td><div class="co">${ico(c)}$${esc(c.symbol)}</div></td><td>${money(c.mcap)}</td><td class="${cls(c.ch24h)}">${pct(c.ch24h)}</td>${MK.map(([k], i) => { const x = o[k] || { y: 0, n: 0 }, n = x.y + x.n, y = n ? x.y / n : null;
      return `<td class="c" data-m="${c.mint}" data-i="${i}"><div class="cl"><b class="${y == null ? '' : y >= .5 ? 'up' : 'dn'}">${y == null ? '—' : 'YES ' + Math.round(y * 100) + '%'}</b><div class="bar"><i style="width:${y == null ? 0 : y * 100}%"></i><u style="width:${y == null ? 0 : (1 - y) * 100}%"></u></div><span>${n} call${n === 1 ? '' : 's'}</span></div></td>`; }).join('')}</tr>`; }).join('')}</tbody></table>`;
  $$('#allm td.c').forEach(td => td.onclick = () => { tab('markets'); select(td.dataset.m, 1); focusMk(+td.dataset.i); $$('#det .mk')[+td.dataset.i]?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }); }

// ---------------------------------------------------------------- the wire: live trades across the GTA coins
let sideTab = 'calls';
$$('[data-side2]').forEach(b => b.onclick = () => { sideTab = b.dataset.side2; $$('[data-side2]').forEach(x => x.classList.toggle('on', x === b)); $('#feed').hidden = sideTab !== 'calls'; $('#wire').hidden = sideTab !== 'wire'; if (sideTab === 'wire') loadWire(); });
async function loadWire() { if (sideTab !== 'wire' || S.tab !== 'markets') return; try { const j = await api('/api/wire'); const T = j.trades || [];
    $('#wire').innerHTML = T.length ? T.slice(0, 50).map(t => { const c = S.byMint[t.mint] || { symbol: t.sym, icon: t.icon }; return `<div class="wi" data-m="${t.mint}">${ico(c)}<span><b class="${t.buy ? 'up' : 'dn'}">${t.buy ? 'BUY' : 'SELL'}</b> $${esc(t.sym)} <b>${money(t.usd)}</b><br><span class="when">${short(t.wallet)}</span></span><span class="when">${ago(t.ts)}</span></div>`; }).join('') : '<div class="empty">no trades right now.</div>';
    $$('#wire .wi').forEach(r => r.onclick = () => select(r.dataset.m, 1)); } catch (e) { $('#wire').innerHTML = `<div class="empty">the wire is quiet (${esc(e.message)}).</div>`; } }
setInterval(loadWire, 20000);

// ---------------------------------------------------------------- GTA VI news
async function loadNews() { try { S.news = (await api('/api/news')).items || []; if (S.tab === 'hub') renderHub(); } catch (_) { S.news = []; } }

// ---------------------------------------------------------------- caller profile
async function profile(w) { $('#prof').innerHTML = '<div class="empty">loading…</div>'; $('#mProf').classList.add('on');
  try { const j = await api('/api/board?wallet=' + encodeURIComponent(w)); const M = j.mine || [], row = (j.board || []).find(x => x.wallet === w), rank = (j.board || []).findIndex(x => x.wallet === w) + 1;
    $('#prof').innerHTML = `<div class="pf"><div class="bsum"><div><span>rank</span><b>${rank || '—'}</b></div><div><span>won / lost</span><b>${row ? row.won + ' / ' + row.lost : '0 / 0'}</b></div><div><span>accuracy</span><b>${row?.acc == null ? '—' : Math.round(row.acc * 100) + '%'}</b></div><div><span>best streak</span><b>${row?.best || 0}</b></div></div>
      <div class="when" style="margin-bottom:10px">${esc(w)} · <a href="https://solscan.io/account/${esc(w)}" target="_blank" rel="noopener"><u>solscan ↗</u></a></div>${M.length ? M.slice(0, 30).map(c => { const k = S.byMint[c.mint]; return `<div class="fi"><span class="pill ${c.side}">${c.side === 'Y' ? 'YES' : 'NO'}</span><span><b>$${esc(k?.symbol || short(c.mint))}</b> · ${mq(c.mkt)}<br><span class="when">at ${money(c.mcap0)}${c.mcap1 ? ' → ' + money(c.mcap1) : ''}</span></span><span class="when">${c.status === 'open' ? left(c.due) + ' left' : `<span class="pill ${c.status}">${c.status}</span>`}</span></div>`; }).join('') : '<div class="empty">no calls.</div>'}</div>`; }
  catch (e) { $('#prof').innerHTML = `<div class="empty">${esc(e.message)}</div>`; } }
document.addEventListener('click', e => { const t = e.target.closest('[data-w]'); if (t) { e.preventDefault(); e.stopPropagation(); profile(t.dataset.w); } });

// ---------------------------------------------------------------- the city: every GTA coin as a block
function squarify(items, x, y, w, h) { const out = []; let i = 0;
  while (i < items.length) { const sh = Math.min(w, h); const worst = r => { const s = r.reduce((a, b) => a + b.v, 0), mx = Math.max(...r.map(q => q.v)), mn = Math.min(...r.map(q => q.v)); return Math.max(sh * sh * mx / (s * s), s * s / (sh * sh * mn)); };
    let row = [items[i]], j = i + 1; while (j < items.length && worst([...row, items[j]]) <= worst(row)) { row.push(items[j]); j++; } const s = row.reduce((a, b) => a + b.v, 0);
    if (w >= h) { const cw = s / h; let cy = y; for (const r of row) { const rh = r.v / cw; out.push({ ...r, x, y: cy, w: cw, h: rh }); cy += rh; } x += cw; w -= cw; }
    else { const ch = s / w; let cx = x; for (const r of row) { const rw = r.v / ch; out.push({ ...r, x: cx, y, w: rw, h: ch }); cx += rw; } y += ch; h -= ch; } i = j; } return out; }
function cityCol(ch) { const v = Math.max(-1, Math.min(1, (ch || 0) / 40)); return v >= 0 ? `rgb(${Math.round(30 + 10 * (1 - v))},${Math.round(110 + 110 * v)},${Math.round(95 + 60 * v)})` : `rgb(${Math.round(150 - 100 * v)},${Math.round(50 + 20 * (1 + v))},${Math.round(70 + 20 * (1 + v))})`; }
function renderCity() { const el = $('#city'); if (!el || S.tab !== 'city') return; const W = el.clientWidth, Hh = el.clientHeight; if (W < 50 || Hh < 50) return;
  const C = S.coins.filter(c => c.mcap > 0).map(c => ({ c, raw: Math.pow(c.mcap, .55) })).sort((a, b) => b.raw - a.raw); const tot = C.reduce((a, b) => a + b.raw, 0);
  const L = squarify(C.map(x => ({ ...x, v: x.raw / tot * W * Hh })), 0, 0, W, Hh);
  el.innerHTML = L.map((b, i) => { const c = b.c, n = callsOn(c.mint), small = b.w < 120 || b.h < 70; return `<div class="blk${small ? ' sm' : ''}${n ? ' hot' : ''}" data-m="${c.mint}" style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;background:linear-gradient(160deg,${cityCol(c.ch24h)},rgba(20,4,18,.55));animation-delay:${i * 35}ms">
    ${n ? `<span class="calls">${n} call${n === 1 ? '' : 's'}</span>` : ''}<div class="bt">${ico(c)}$${esc(c.symbol)}</div><div><div class="big2">${pct(c.ch24h)}</div><div class="bb"><span>${money(c.mcap)}</span>${wanted(c)}</div></div></div>`; }).join('');
  $$('#city .blk').forEach(b => b.onclick = () => { tab('markets'); select(b.dataset.m, 1); }); }

// ---------------------------------------------------------------- the live ticker under the tabs
async function loadTicker() { if (!H.classList.contains('term')) return; try { const j = await api('/api/wire'); const T = (j.trades || []).slice(0, 30); if (!T.length) return;
  const calls = (S.board?.recent || []).slice(0, 8).map(c => `<span class="ti" data-m="${c.mint}"><b class="${c.side === 'Y' ? 'up' : 'dn'}">CALL ${c.side === 'Y' ? 'YES' : 'NO'}</b> $${esc(S.byMint[c.mint]?.symbol || short(c.mint))} · ${mq(c.mkt)}</span>`);
  const one = T.map(t => { const c = S.byMint[t.mint] || { symbol: t.sym, icon: t.icon }; return `<span class="ti" data-m="${t.mint}">${ico(c)}<b class="${t.buy ? 'up' : 'dn'}">${t.buy ? 'BUY' : 'SELL'}</b> $${esc(t.sym)} ${money(t.usd)} <span class="when">${ago(t.ts)}</span></span>`; });
  const mix = []; one.forEach((x, i) => { mix.push(x); if (i % 4 === 3 && calls.length) mix.push(calls.shift()); }); const html = mix.join('');
  $('#tickR').innerHTML = html + html; $$('#tickR .ti').forEach(t => t.onclick = () => { tab('markets'); select(t.dataset.m, 1); }); } catch (_) {} }
setInterval(loadTicker, 20000);
setInterval(() => { const c = $('#clk'); if (c) c.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); }, 1000);
function missionPassed(c, k, side) { const m = $('#mp'); $('#mpT').textContent = `$${c.symbol} · ${mq(k)} · ${side === 'Y' ? 'YES' : 'NO'}`; m.classList.remove('on'); void m.offsetWidth; m.classList.add('on'); clearTimeout(missionPassed.h); missionPassed.h = setTimeout(() => m.classList.remove('on'), 2700); }

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
    <div class="hc sent"><h4>crowd: most bearish</h4>${sent.length ? sent.slice().reverse().slice(0, 6).map(x => `<div class="r" data-m="${x.c.mint}"><span>$${esc(x.c.symbol)}</span><div class="bar"><i style="width:${x.y * 100}%"></i><u style="width:${(1 - x.y) * 100}%"></u></div><b class="dn mono">${Math.round((1 - x.y) * 100)}%</b></div>`).join('') : '<div class="empty">no calls yet.</div>'}</div>
    <div class="hc wide news"><h4>GTA VI news · live</h4>${(S.news || []).length ? S.news.slice(0, 12).map(n => `<a href="${esc(n.url)}" target="_blank" rel="noopener"><span style="white-space:normal;font-family:Rubik;font-size:14px;color:var(--paper)"><b style="font-weight:500">${esc(n.title)}</b><i>${esc(n.src)}</i></span><span>${n.ts ? ago(n.ts) : ''}</span></a>`).join('') : '<div class="empty">loading headlines…</div>'}</div>`;
  $$('#hub .r[data-m]').forEach(r => r.onclick = () => { tab('markets'); select(r.dataset.m, 1); }); clock(); }

// ---------------------------------------------------------------- board, feed, my calls
async function loadBoard() { try { S.board = await api('/api/board' + (S.wallet ? '?wallet=' + S.wallet : '')); renderStats(); renderFeed(); renderBoard(); renderMine(); renderRows(); if (S.tab === 'hub') renderHub(); if (S.tab === 'all') renderAll(); if (!document.activeElement?.closest?.('#det')) renderDetSoft(); } catch (e) { $('#feed').innerHTML = `<div class="empty">calls are offline: ${esc(e.message)}</div>`; } }
function renderDetSoft() { const c = S.byMint[S.sel]; if (!c || !$('#det .mkts')) return renderDet(); const odds = S.board?.odds?.[c.mint] || {}; if ($('#ccalls')) $('#ccalls').innerHTML = coinCalls(c);
  $$('#det .mk').forEach(el => { const k = el.dataset.k, o = odds[k] || { y: 0, n: 0 }, n = o.y + o.n, y = n ? o.y / n : null; $('.od', el).innerHTML = `<span class="up">YES ${y == null ? '—' : Math.round(y * 100) + '%'}</span><span class="dn">NO ${y == null ? '—' : Math.round((1 - y) * 100) + '%'}</span>`;
    $('.bar i', el).style.width = (y == null ? 0 : y * 100) + '%'; $('.bar u', el).style.width = (y == null ? 0 : (1 - y) * 100) + '%'; $('.n', el).textContent = n ? n + ' open call' + (n === 1 ? '' : 's') : 'no calls yet · be first'; }); }
const mq = k => (MK.find(m => m[0] === k) || [, k])[1];
function renderFeed() { const R = S.board?.recent || []; $('#nRecent').textContent = (S.board?.totals?.calls || 0) + ' total';
  if (!S.board?.store) { $('#feed').innerHTML = '<div class="empty">calls open the moment storage is connected.</div>'; return; }
  $('#feed').innerHTML = R.length ? R.map(c => { const k = S.byMint[c.mint]; return `<div class="fi"><span class="pill ${c.side}">${c.side === 'Y' ? 'YES' : 'NO'}</span><span><b>$${esc(k?.symbol || short(c.mint))}</b> · ${mq(c.mkt)}<br><span class="when"><span class="wl" data-w="${c.wallet}">${short(c.wallet)}</span> at ${money(c.mcap0)}</span></span><span class="when">${c.status === 'open' ? ago(c.ts) : `<span class="pill ${c.status}">${c.status}</span>`}</span></div>`; }).join('') : '<div class="empty">no calls yet. the first one lands here.</div>'; }
function renderBoard() { const B = S.board?.board || []; if (!B.length) { $('#board').innerHTML = '<div class="empty">no graded calls yet. the first winners show up 24 hours after the first calls.</div>'; return; }
  const T = S.board?.totals || {}, best = B.filter(w => w.won + w.lost >= 3).sort((a, b) => b.acc - a.acc)[0];
  $('#board').innerHTML = `<div class="bsum"><div><span>calls made</span><b>${T.calls || 0}</b></div><div><span>graded</span><b>${T.graded || 0}</b></div><div><span>callers</span><b>${T.callers || 0}</b></div><div><span>sharpest (3+ graded)</span><b>${best ? short(best.wallet) + ' · ' + Math.round(best.acc * 100) + '%' : '—'}</b></div></div><table><thead><tr><th>#</th><th>caller</th><th>won</th><th>lost</th><th>open</th><th>accuracy</th><th>best streak</th></tr></thead><tbody>${B.map((w, i) => `<tr class="${w.wallet === S.wallet ? 'me' : ''}"><td class="rk">${i + 1}</td><td><span class="wl" data-w="${w.wallet}">${short(w.wallet)}</span>${tier(w.won)}</td><td class="up">${w.won}</td><td class="dn">${w.lost}</td><td>${w.open}</td><td>${w.acc == null ? '—' : Math.round(w.acc * 100) + '%'}</td><td>${w.best}</td></tr>`).join('')}</tbody></table>`; }
function renderMine() { const M = S.board?.mine || []; const G = S.bag?.gta || []; $('#nMine').textContent = G.length + M.length;
  if (!S.wallet) { $('#mine').innerHTML = '<div class="empty">connect a wallet to see your GTA bag and your calls.</div>'; $('#mineSum').textContent = ''; return; }
  const w = M.filter(c => c.status === 'won').length, l = M.filter(c => c.status === 'lost').length; $('#mineSum').innerHTML = `${M.length} calls · ${w} won · ${l} lost ${tier(w)}`;
  const bag = S.bag ? `<div class="bagh"><div><span>GTA bag value</span><b>${money(S.bag.total || 0)}</b></div><div><span>GTA coins held</span><b>${G.length}</b></div><div><span>SOL</span><b>${(S.bag.sol || 0).toFixed(3)}</b></div></div>
    <div class="sec">your GTA coins</div>${G.length ? G.map(x => { const c = S.byMint[x.mint] || { symbol: x.symbol }; return `<div class="bg" data-m="${x.mint}">${ico(c)}<span><b style="font-family:Rubik">$${esc(c.symbol)}</b><br><span class="when">${x.ui.toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens</span></span><span class="${cls(c.ch24h)} mono">${pct(c.ch24h)}</span><b>${money(x.usd)}</b></div>`; }).join('') : '<div class="empty">no GTA coins in this wallet yet. open a coin and buy from the trade box.</div>'}` : '<div class="empty">loading your bag…</div>';
  const calls = M.length ? M.map(c => { const k = S.byMint[c.mint]; return `<div class="fi"><span class="pill ${c.side}">${c.side === 'Y' ? 'YES' : 'NO'}</span><span><b>$${esc(k?.symbol || short(c.mint))}</b> · ${mq(c.mkt)}<br><span class="when">called at ${money(c.mcap0)}${c.mcap1 ? ' · graded at ' + money(c.mcap1) : ''}</span></span><span class="when">${c.status === 'open' ? 'graded in ' + left(c.due) : `<span class="pill ${c.status}">${c.status}</span>`}</span></div>`; }).join('') : '<div class="empty">no calls yet. pick a GTA coin and hit YES or NO.</div>';
  $('#mine').innerHTML = bag + '<div class="sec">your calls</div>' + calls; $$('#mine .bg').forEach(r => r.onclick = () => { tab('markets'); select(r.dataset.m, 1); }); }

// ---------------------------------------------------------------- polymarket
async function loadPM() { try { S.pm = await api('/api/pm'); const E = S.pm.events || []; $('#nPoly').textContent = E.length; if (E.length && $('#fPm')) $('#fPm').textContent = E.length; if (S.tab === 'hub') renderHub();
    $('#pm').innerHTML = E.length ? E.map(e => `<div class="ev"><div class="t">${e.image ? `<img src="${esc(e.image)}" alt="" loading="lazy">` : ''}<h3>${esc(e.title)}</h3></div>
      ${e.markets.slice(0, 4).map(m => `<div class="m"><span>${esc(m.label || m.q)}</span><b>${Math.round(m.yes * 100)}%</b><div class="bar"><i style="width:${m.yes * 100}%"></i><u style="width:${(1 - m.yes) * 100}%"></u></div></div>`).join('')}
      <div class="meta"><span>vol ${money(e.vol)}</span><span>${e.end ? 'ends ' + new Date(e.end).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : ''}</span></div>
      <a class="go" href="${esc(e.url)}" target="_blank" rel="noopener">trade on polymarket ↗</a></div>`).join('') : '<div class="empty">no open GTA markets on Polymarket right now.</div>'; }
  catch (e) { $('#pm').innerHTML = `<div class="empty">couldn't reach Polymarket (${esc(e.message)}).</div>`; } }

// ---------------------------------------------------------------- tabs + keys
const TABS = $$('.tab').map(t => t.dataset.t);
function tab(t) { $$('.tab').forEach(b => b.classList.toggle('on', b.dataset.t === t)); $$('.pane').forEach(p => p.classList.toggle('on', p.dataset.p === t)); S.tab = t; if (t === 'markets') renderDet(); if (t === 'map') requestAnimationFrame(renderMap); if (t === 'hub') renderHub(); if (t === 'movers') renderMovers(); if (t === 'all') renderAll(); if (t === 'hub' && !S.news) loadNews(); if (t === 'markets') loadWire(); }
$$('.tab').forEach(b => b.onclick = () => tab(b.dataset.t)); S.tab = 'markets';
addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (!H.classList.contains('term')) openTerm(); pal(); return; } if (e.target.matches('input')) { if (e.key === 'Escape') e.target.blur(); return; } if ($('.modal.on')) { if (e.key === 'Escape') closeModals(); if (e.key === 'Enter' && $('#mCall.on')) $('#sign').click(); return; }
  const k = e.key.toLowerCase();
  if (!H.classList.contains('term')) { if (k === 'enter') openTerm(); return; }
  if (k === 'escape') return openHome();
  if ((e.key === ':' || e.key === '`') && S.tab !== 'markets') { e.preventDefault(); $('#cmdI').focus(); return; }
  if (k === 'q' || k === 'e') { const i = TABS.indexOf(S.tab); tab(TABS[(i + (k === 'e' ? 1 : TABS.length - 1)) % TABS.length]); return; }
  if (S.tab !== 'markets') return;
  if (k === 'arrowdown' || k === 'arrowup') { e.preventDefault(); const C = sorted(), i = C.findIndex(c => c.mint === S.sel), n = C[Math.max(0, Math.min(C.length - 1, i + (k === 'arrowdown' ? 1 : -1)))]; if (n) select(n.mint, 1); }
  if (/^[1-5]$/.test(k)) focusMk(+k - 1);
  if (k === '/') { e.preventDefault(); $('#q').focus(); }
  if (e.key === ':' || e.key === '`') { e.preventDefault(); $('#cmdI').focus(); }
  if (k === 'y' || k === 'n') { const c = S.byMint[S.sel]; if (c && !myOpen(c.mint, MK[S.focus][0])) slip(c, MK[S.focus][0], k === 'y' ? 'Y' : 'N'); } });

// ---------------------------------------------------------------- the command line
const findCoin = q => { q = (q || '').replace(/^\$/, '').toLowerCase(); return S.coins.find(c => c.symbol.toLowerCase() === q) || S.coins.find(c => c.name.toLowerCase().includes(q)) || S.coins.find(c => c.mint.toLowerCase().startsWith(q)); };
const HELP = 'buy <coin> <sol> · sell <coin> <%> · alert <coin> · open <coin> · call <coin> <up|50|2x|10x|rug> <yes|no> · whois <wallet> · price <coin> · watch <coin> · sort <mcap|24h|volume|new|called|watch> · markets · movers · map · hub · poly · board · mine · how · connect · home';
const hist = []; let hi = 0;
function run(line) { const a = line.trim().split(/\s+/), c0 = (a[0] || '').toLowerCase(), out = m => $('#cmdO').textContent = m; if (!c0) return; hist.unshift(line); hi = -1;
  const tabsMap = { markets: 'markets', movers: 'movers', map: 'map', hub: 'hub', gta: 'hub', poly: 'poly', polymarket: 'poly', board: 'board', leaderboard: 'board', mine: 'mine', calls: 'mine', how: 'how', help2: 'how' };
  if (c0 === 'help' || c0 === '?') return out(HELP);
  if (tabsMap[c0]) { tab(tabsMap[c0]); return out('→ ' + tabsMap[c0]); }
  if (c0 === 'home' || c0 === 'exit') { openHome(); return; }
  if ((c0 === 'buy' || c0 === 'sell') && a[1]) { const c = findCoin(a[1]); if (!c) return out('no GTA coin called "' + a[1] + '"'); tab('markets'); select(c.mint, 1); T.side = c0 === 'buy' ? 'b' : 's'; const v = parseFloat(a[2]); if (v > 0) { if (c0 === 'buy') T.amt = v; else T.pct = Math.min(100, Math.round(v)); } setTimeout(() => { tradeUI(c, false); $('#trade')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60); return out('review the quote, then hit ' + c0.toUpperCase()); }
  if (c0 === 'alert' && a[1]) { const c = findCoin(a[1]); if (!c) return out('no GTA coin called "' + a[1] + '"'); alertModal(c); return out('set your levels'); }
  if (c0 === 'whois' && a[1]) { profile(a[1]); return out('loading ' + short(a[1])); }
  if (c0 === 'news') { tab('hub'); return out('→ hub · news'); }
  if (c0 === 'all') { tab('all'); return out('→ all markets'); }
  if (c0 === 'connect') { connect(); return out('opening wallets…'); }
  if (c0 === 'sort') { const k = { mcap: 'mcap', '24h': 'ch24h', volume: 'vol24h', vol: 'vol24h', new: 'new', called: 'called', watch: 'watch' }[(a[1] || '').toLowerCase()]; if (!k) return out('sort by: mcap 24h volume new called watch'); tab('markets'); S.sort = k; $$('.chip[data-s]').forEach(x => x.classList.toggle('on', x.dataset.s === k)); renderRows(); return out('sorted by ' + a[1]); }
  const c = findCoin(a[1]); if (['open', 'price', 'watch', 'call'].includes(c0) && !c) return out('no GTA coin called "' + (a[1] || '') + '"');
  if (c0 === 'open') { tab('markets'); select(c.mint, 1); return out(`$${c.symbol} · ${money(c.mcap)} · ${pct(c.ch24h)} 24h`); }
  if (c0 === 'price') return out(`$${c.symbol}  price ${money(c.price)}  mcap ${money(c.mcap)}  1h ${pct(c.ch1h)}  24h ${pct(c.ch24h)}  holders ${(c.holders || 0).toLocaleString()}`);
  if (c0 === 'watch') { toggleWatch(c.mint); renderRows(); return out((watching(c.mint) ? 'watching $' : 'stopped watching $') + c.symbol); }
  if (c0 === 'call') { const k = { up: 'up', higher: 'up', '50': 'p50', '+50': 'p50', p50: 'p50', '2x': 'x2', x2: 'x2', '10x': 'x10', x10: 'x10', moon: 'x10', rug: 'rug', halves: 'rug' }[(a[2] || '').toLowerCase()], sd = (a[3] || '').toLowerCase(); if (!k || !['yes', 'no', 'y', 'n'].includes(sd)) return out('usage: call <coin> <up|50|2x|10x|rug> <yes|no>');
    tab('markets'); select(c.mint, 1); if (myOpen(c.mint, k)) return out('you already have an open call on that market'); slip(c, k, sd[0] === 'y' ? 'Y' : 'N'); return out('sign the slip to lock it'); }
  out('unknown command. type help'); }
$('#cmd').onsubmit = e => { e.preventDefault(); const i = $('#cmdI'); run(i.value); i.value = ''; };
$('#cmdI').onkeydown = e => { if (e.key === 'ArrowUp' && hist.length) { e.preventDefault(); hi = Math.min(hist.length - 1, hi + 1); e.target.value = hist[hi]; } if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.max(-1, hi - 1); e.target.value = hi < 0 ? '' : hist[hi]; } if (e.key === 'Escape') e.target.blur(); };

// ---------------------------------------------------------------- trading: Jupiter route, built for your wallet, you sign
const WSOL = 'So11111111111111111111111111111111111111112';
const T = { side: 'b', amt: .1, pct: 50, slip: 300, q: null, busy: false };
async function loadBag() { if (!S.wallet) { S.bag = null; return; } try { S.bag = await api('/api/bag?wallet=' + S.wallet); } catch (e) { S.bag = { sol: 0, gta: [], total: 0, err: e.message }; } renderMine(); const c = S.byMint[S.sel]; if (c && $('#pos')) { posUI(c); tradeUI(c, true); } }
function held(m) { return (S.bag?.gta || []).find(x => x.mint === m); }
function posUI(c) { const el = $('#pos'); if (!el) return; if (!S.wallet) { el.innerHTML = '<div class="empty">connect a wallet to see what you hold.</div>'; $('#posT').textContent = ''; return; }
  const h = held(c.mint); $('#posT').textContent = S.bag ? (S.bag.sol || 0).toFixed(3) + ' SOL in wallet' : '';
  el.innerHTML = h ? `<div class="bagh" style="grid-template-columns:1fr 1fr"><div><span>you hold</span><b>${money(h.usd)}</b></div><div><span>tokens</span><b style="font-size:18px">${h.ui.toLocaleString(undefined, { maximumFractionDigits: 0 })}</b></div></div>
    <div class="sfs">${[['share of supply', c.supply ? (h.ui / c.supply * 100).toFixed(4) + '%' : '—'], ['if it 2x', money(h.usd * 2)], ['if it 10x', money(h.usd * 10)], ['if it hits $10M', c.mcap ? money(h.usd * 1e7 / c.mcap) : '—']].map(([a, b]) => `<div class="sf"><i class="q">·</i><span>${a}</span><b>${b}</b></div>`).join('')}</div>`
    : `<div class="empty">you don't hold $${esc(c.symbol)} yet.</div>`; }
function tradeUI(c, keep) { const el = $('#trade'); if (!el) return; if (!keep) { T.q = null; } const h = held(c.mint), buy = T.side === 'b';
  el.innerHTML = `<div class="seg"><button class="b${buy ? ' on' : ''}" data-sd="b">BUY</button><button class="s${!buy ? ' on' : ''}" data-sd="s">SELL</button></div>
    <div class="amt">${buy ? [.05, .1, .25, .5, 1].map(v => `<button class="chip${T.amt === v ? ' on' : ''}" data-a="${v}">${v} SOL</button>`).join('') + `<input id="tAmt" type="number" min="0" step="0.01" placeholder="custom SOL" value="${[.05, .1, .25, .5, 1].includes(T.amt) ? '' : T.amt}">` : [25, 50, 75, 100].map(v => `<button class="chip${T.pct === v ? ' on' : ''}" data-p="${v}">${v}%</button>`).join('')}</div>
    <div class="bal"><span>${buy ? 'wallet: ' + (S.bag ? (S.bag.sol || 0).toFixed(3) + ' SOL' : S.wallet ? '…' : 'not connected') : 'you hold: ' + (h ? h.ui.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' $' + esc(c.symbol) : '0')}</span><span class="slip2">slippage ${[100, 300, 500].map(v => `<button class="chip${T.slip === v ? ' on' : ''}" data-sl="${v}">${v / 100}%</button>`).join('')}</span></div>
    <div class="qt" id="tQ"><span>quote</span><b>…</b></div>
    <button class="go2 ${T.side}" id="tGo">${S.wallet ? (buy ? 'BUY $' : 'SELL $') + esc(c.symbol) : 'CONNECT TO TRADE'}</button>`;
  $$('#trade [data-sd]').forEach(b => b.onclick = () => { T.side = b.dataset.sd; tradeUI(c); });
  $$('#trade [data-a]').forEach(b => b.onclick = () => { T.amt = +b.dataset.a; tradeUI(c); });
  $$('#trade [data-p]').forEach(b => b.onclick = () => { T.pct = +b.dataset.p; tradeUI(c); });
  $$('#trade [data-sl]').forEach(b => b.onclick = () => { T.slip = +b.dataset.sl; tradeUI(c); });
  const ai = $('#tAmt'); if (ai) ai.oninput = () => { const v = +ai.value; if (v > 0) { T.amt = v; $$('#trade [data-a]').forEach(x => x.classList.remove('on')); quote(c); } };
  $('#tGo').onclick = () => S.wallet ? swap(c) : connect(); quote(c); }
function tradeIn(c) { if (T.side === 'b') return { inM: WSOL, outM: c.mint, amount: String(Math.round(T.amt * 1e9)) }; const h = held(c.mint); if (!h) return null; const raw = BigInt(h.raw) * BigInt(T.pct) / 100n; return raw > 0n ? { inM: c.mint, outM: WSOL, amount: raw.toString(), dec: h.dec } : null; }
let qSeq = 0;
async function quote(c) { const el = $('#tQ'); if (!el) return; const io = tradeIn(c); if (!io) { el.innerHTML = `<span>quote</span><b>${T.side === 's' ? 'nothing to sell' : '—'}</b>`; $('#tGo').disabled = true; return; }
  const my = ++qSeq; el.innerHTML = '<span>quote</span><b>finding the best route…</b>';
  try { const q = await fetch(`https://lite-api.jup.ag/swap/v1/quote?inputMint=${io.inM}&outputMint=${io.outM}&amount=${io.amount}&slippageBps=${T.slip}&restrictIntermediateTokens=true`).then(r => r.json()); if (my !== qSeq) return; if (q.error || !q.outAmount) throw new Error(q.error || 'no route');
    T.q = q; const buy = T.side === 'b', out = buy ? Number(q.outAmount) / 10 ** (c.dec ?? held(c.mint)?.dec ?? 6) : Number(q.outAmount) / 1e9, min = buy ? Number(q.otherAmountThreshold) / 10 ** (c.dec ?? held(c.mint)?.dec ?? 6) : Number(q.otherAmountThreshold) / 1e9;
    const imp = (+q.priceImpactPct || 0) * 100;
    el.innerHTML = `<span>you get ≈</span><b>${buy ? out.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' $' + esc(c.symbol) : out.toFixed(4) + ' SOL'}</b><span>minimum</span><b>${buy ? min.toLocaleString(undefined, { maximumFractionDigits: 0 }) : min.toFixed(4) + ' SOL'}</b><span>price impact</span><b class="${imp > 5 ? 'dn' : imp > 1 ? '' : 'up'}">${imp.toFixed(2)}%</b><span>route</span><b>${esc((q.routePlan || []).map(x => x.swapInfo.label).join(' › ') || '—')}</b>`;
    $('#tGo').disabled = false; } catch (e) { if (my !== qSeq) return; T.q = null; el.innerHTML = `<span>quote</span><b class="dn">${esc(e.message)}</b>`; $('#tGo').disabled = true; } }
function loadWeb3() { return window.solanaWeb3 ? Promise.resolve() : new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = '/assets/web3.min.js'; sc.onload = res; sc.onerror = () => rej(new Error('could not load web3')); document.head.appendChild(sc); }); }
async function swap(c) { if (T.busy) return; if (!T.q) return toast('no quote yet', 1); const btn = $('#tGo'); T.busy = true; btn.disabled = true; const label = btn.textContent;
  try { btn.textContent = 'building…'; await loadWeb3();
    const r = await fetch('https://lite-api.jup.ag/swap/v1/swap', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ quoteResponse: T.q, userPublicKey: S.wallet, dynamicComputeUnitLimit: true, dynamicSlippage: false, prioritizationFeeLamports: { priorityLevelWithMaxLamports: { maxLamports: 500000, priorityLevel: 'high' } } }) }).then(r => r.json());
    if (!r.swapTransaction) throw new Error(r.error || 'could not build the swap');
    const tx = solanaWeb3.VersionedTransaction.deserialize(Uint8Array.from(atob(r.swapTransaction), ch => ch.charCodeAt(0)));
    btn.textContent = 'check your wallet…'; if (!S.prov?.signAndSendTransaction) throw new Error('this wallet cannot send transactions');
    const res = await S.prov.signAndSendTransaction(tx); const sig = typeof res === 'string' ? res : res?.signature; if (!sig) throw new Error('no signature');
    btn.textContent = 'confirming…'; toast('sent · confirming on Solana');
    let ok = false; for (let i = 0; i < 40 && !ok; i++) { await new Promise(z => setTimeout(z, 1500)); const st = await api('/api/rpc', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ method: 'getSignatureStatuses', params: [[sig], { searchTransactionHistory: true }] }) }).catch(() => null);
      const v = st?.result?.value?.[0]; if (v?.err) throw new Error('transaction failed on-chain'); if (v && (v.confirmationStatus === 'confirmed' || v.confirmationStatus === 'finalized')) ok = true; }
    if (!ok) { toast('not confirmed yet · check solscan', 1); window.open('https://solscan.io/tx/' + sig, '_blank', 'noopener'); }
    else { const m = $('#mp'); $('.mp1', m).textContent = T.side === 'b' ? 'BOUGHT!' : 'SOLD!'; $('#mpT').textContent = `$${c.symbol} · ${T.side === 'b' ? T.amt + ' SOL in' : T.pct + '% out'}`; $('.mp3', m).innerHTML = `<a href="https://solscan.io/tx/${sig}" target="_blank" rel="noopener" style="pointer-events:auto">view on solscan ↗</a>`; m.classList.remove('on'); void m.offsetWidth; m.classList.add('on'); setTimeout(() => { m.classList.remove('on'); $('.mp1', m).textContent = 'CALL PLACED!'; $('.mp3', m).textContent = 'RESPECT +1'; }, 3200); }
    setTimeout(loadBag, 2500); }
  catch (e) { toast(e.message || 'cancelled', 1); }
  finally { T.busy = false; if ($('#tGo')) { $('#tGo').disabled = false; $('#tGo').textContent = label; } } }

// ---------------------------------------------------------------- price alerts (this browser)
S.alerts = (() => { try { return JSON.parse(store.get('betz:al') || '{}'); } catch (_) { return {}; } })();
function alertOf(m) { return S.alerts[m]; }
function alertModal(c) { const a = alertOf(c.mint) || {}; $('#alBox').innerHTML = `<label>alert when $${esc(c.symbol)} mcap goes above <span>$</span><input id="alUp" type="number" min="0" value="${a.up || Math.round(c.mcap * 1.5)}"></label><label>or drops below <span>$</span><input id="alDn" type="number" min="0" value="${a.dn || Math.round(c.mcap * .7)}"></label><div class="when">now: ${money(c.mcap)}</div>`;
  $('#alSet').onclick = () => { S.alerts[c.mint] = { up: +$('#alUp').value || 0, dn: +$('#alDn').value || 0, sym: c.symbol }; store.set('betz:al', JSON.stringify(S.alerts)); closeModals(); toast('alert set on $' + c.symbol); try { Notification?.requestPermission?.(); } catch (_) {} renderDet(); };
  $('#alClr').onclick = () => { delete S.alerts[c.mint]; store.set('betz:al', JSON.stringify(S.alerts)); closeModals(); toast('alert cleared'); renderDet(); }; $('#mAl').classList.add('on'); }
function checkAlerts() { for (const [m, a] of Object.entries(S.alerts)) { const c = S.byMint[m]; if (!c) continue; let hit = null; if (a.up && c.mcap >= a.up) hit = `$${c.symbol} broke ${money(a.up)} (now ${money(c.mcap)})`; if (a.dn && c.mcap <= a.dn) hit = `$${c.symbol} fell under ${money(a.dn)} (now ${money(c.mcap)})`;
  if (hit) { toast('🔔 ' + hit); try { if (Notification.permission === 'granted') new Notification('Betz alert', { body: hit, icon: '/assets/mark.svg' }); } catch (_) {} delete S.alerts[m]; store.set('betz:al', JSON.stringify(S.alerts)); } } }

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
    S.wallet = pk; S.prov = w.p; store.set('betz:w', w.id); closeModals(); walletUI(); loadBoard(); loadBag(); toast('connected ' + short(pk)); res(true); } catch (e) { toast(e.message || 'connection cancelled', 1); res(false); } });
  $('#mWal').classList.add('on'); }); }
async function disconnect() { try { await S.prov?.disconnect?.(); } catch (_) {} S.wallet = null; S.prov = null; S.bag = null; store.set('betz:w', ''); walletUI(); loadBoard(); const c0 = S.byMint[S.sel]; if (c0) { tradeUI(c0); posUI(c0); } toast('disconnected'); }
function walletUI() { const on = !!S.wallet; $('#wal').classList.toggle('on', on); $('#hconn').classList.toggle('on', on); $('#walT').textContent = on ? short(S.wallet) : 'connect'; $('#hconn span').textContent = on ? short(S.wallet) : 'connect wallet'; }
(async () => { const id = store.get('betz:w'); if (!id) return; await new Promise(r => setTimeout(r, 500)); const w = wallets().find(x => x.id === id); if (!w) return; try { const r = await w.p.connect({ onlyIfTrusted: true }); const pk = (r?.publicKey || w.p.publicKey)?.toString(); if (pk) { S.wallet = pk; S.prov = w.p; walletUI(); loadBoard(); loadBag(); } } catch (_) {} })();

// ---------------------------------------------------------------- the bet slip: sign a message, store the call
const msgOf = b => `betz call\ncoin: ${b.mint}\nmarket: ${b.mkt}\nside: ${b.side === 'Y' ? 'YES' : 'NO'}\ntime: ${b.ts}`;
let pending = null;
function slip(c, k, side) { pending = { c, k, side }; const due = new Date(Date.now() + 864e5);
  $('#slip').innerHTML = `BETZ BET SLIP<br>────────────────<br>$${esc(c.symbol)} · ${esc(c.name)}<br>${mq(k)}<div class="big" style="color:${side === 'Y' ? '#0f8a5f' : '#c42a3a'}">${side === 'Y' ? 'YES' : 'NO'}</div>called at ${money(c.mcap)} mcap<br>graded ${due.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}<br>stake: free`;
  $('#mCall').classList.add('on'); }
$('#sign').onclick = async () => { if (!pending) return; if (!S.wallet && !(await connect())) return; const { c, k, side } = pending; const b = { wallet: S.wallet, mint: c.mint, mkt: k, side, ts: Date.now() };
  const btn = $('#sign'); btn.disabled = true; btn.textContent = 'check your wallet…';
  try { if (!S.prov?.signMessage) throw new Error('this wallet cannot sign messages'); const r = await S.prov.signMessage(new TextEncoder().encode(msgOf(b)), 'utf8'); const sig = r?.signature || r; b.sig = b58(new Uint8Array(sig));
    await api('/api/call', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }); closeModals(); missionPassed(c, k, side); await loadBoard(); renderDet(); setTimeout(() => share(c, k, side), 2500); }
  catch (e) { toast(e.message || 'cancelled', 1); } finally { btn.disabled = false; btn.textContent = 'sign the call'; } };

function share(c, k, side) { const cv = $('#card'), g = cv.getContext('2d'), W = 1200, Hh = 675; const gr = g.createLinearGradient(0, 0, W, Hh); gr.addColorStop(0, '#4a1238'); gr.addColorStop(1, '#1a0717'); g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
  g.fillStyle = 'rgba(255,79,166,.18)'; g.beginPath(); g.arc(W * .85, Hh * .1, 380, 0, 7); g.fill(); g.fillStyle = '#fff6f2'; g.font = '900 64px RB'; g.fillText('betz', 70, 110); g.font = '700 22px Rubik'; g.globalAlpha = .7; g.fillText('PREDICTION MARKETS FOR EVERY GTA COIN', 70, 150); g.globalAlpha = 1;
  g.font = '900 54px RB'; g.fillText('$' + c.symbol, 70, 290); g.font = '500 30px Rubik'; g.globalAlpha = .8; g.fillText(mq(k), 70, 340); g.globalAlpha = 1;
  g.font = '900 210px RB'; g.fillStyle = side === 'Y' ? '#2fe0a8' : '#ff5a6a'; g.fillText(side === 'Y' ? 'YES' : 'NO', 62, 540); g.fillStyle = '#fff6f2'; g.font = '600 26px JB'; g.fillText(`called at ${money(c.mcap)} · graded in 24h · free`, 70, 610);
  $('#dl').onclick = () => { const a = document.createElement('a'); a.download = `betz-${c.symbol}-${side === 'Y' ? 'yes' : 'no'}.png`; a.href = cv.toDataURL('image/png'); a.click(); };
  $('#tw').href = 'https://x.com/intent/post?text=' + encodeURIComponent(`I called ${side === 'Y' ? 'YES' : 'NO'} on $${c.symbol}: ${mq(k)}\ncalled at ${money(c.mcap)}, graded on-chain in 24h.\n\n${location.origin}`); $('#mShare').classList.add('on'); }

// ---------------------------------------------------------------- go
loadCoins(); loadBoard(); loadPM(); loadNews(); setInterval(loadNews, 600000);
setInterval(loadCoins, 30000); setInterval(loadBoard, 15000); setInterval(loadPM, 120000);
setInterval(() => { if (S.tab === 'mine') renderMine(); }, 30000); setInterval(() => { if (S.wallet) loadBag(); }, 45000);
addEventListener('resize', () => { if (S.tab === 'markets' && S.sel) drawChart(S.sel); if (S.tab === 'map') renderMap(); });
