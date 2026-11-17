// crowd odds, leaderboard, recent calls, my calls; grades any call whose 24h is up
const L = require('./_lib');
module.exports = async (req, res) => { try {
  const u = new URL(req.url, 'http://x'); const me = u.searchParams.get('wallet') || '';
  let st = await L.state(); const now = Date.now();
  if (st.store) { const done = new Set(st.results.map(r => r.key)); const due = st.calls.filter(c => c.ts + L.DAY <= now && !done.has(c.key)).slice(0, 60);
    if (due.length) { const tk = await L.tokensByMint([...new Set(due.map(c => c.mint))]); let n = 0;
      await Promise.all(due.map(async c => { const t = tk[c.mint]; if (!t || !t.mcap) return; const hit = L.MARKETS[c.mkt].win(c.mcap0, t.mcap); const won = c.side === 'Y' ? hit : !hit;
        await L.B().put(`r/${c.wallet}/${c.mint}-${c.mkt}-${c.ts}-${c.side}-${won ? 'W' : 'L'}-${Math.round(t.mcap)}.json`, JSON.stringify({ ...c, mcap1: Math.round(t.mcap), won, graded: now }), { access: 'public', addRandomSuffix: false, contentType: 'application/json' }); n++; }));
      if (n) { L.bust(); st = await L.state(); } } }
  const res2 = new Map(st.results.map(r => [r.key, r]));
  const odds = {}; for (const c of st.calls) { if (c.ts + L.DAY <= now) continue; const o = (odds[c.mint] ||= {}); const m = (o[c.mkt] ||= { y: 0, n: 0 }); c.side === 'Y' ? m.y++ : m.n++; }
  const by = new Map(); for (const c of [...st.calls].sort((a, b) => a.ts - b.ts)) { const w = by.get(c.wallet) || { wallet: c.wallet, calls: 0, won: 0, lost: 0, open: 0, streak: 0, best: 0 }; w.calls++;
    const r = res2.get(c.key); if (r) { if (r.won) { w.won++; w.streak++; w.best = Math.max(w.best, w.streak); } else { w.lost++; w.streak = 0; } } else w.open++; by.set(c.wallet, w); }
  const board = [...by.values()].map(w => ({ ...w, acc: w.won + w.lost ? w.won / (w.won + w.lost) : null })).sort((a, b) => b.won - a.won || (b.acc || 0) - (a.acc || 0) || b.calls - a.calls).slice(0, 100);
  const view = c => { const r = res2.get(c.key); return { mint: c.mint, mkt: c.mkt, side: c.side, ts: c.ts, wallet: c.wallet, mcap0: c.mcap0, due: c.ts + L.DAY, status: r ? (r.won ? 'won' : 'lost') : (c.ts + L.DAY <= now ? 'grading' : 'open'), mcap1: r ? r.mcap1 : null }; };
  const recent = [...st.calls].sort((a, b) => b.ts - a.ts).slice(0, 40).map(view);
  const mine = me ? st.calls.filter(c => c.wallet === me).sort((a, b) => b.ts - a.ts).map(view) : [];
  L.send(res, 200, { store: st.store, odds, board, recent, mine, totals: { calls: st.calls.length, callers: by.size, open: st.calls.filter(c => c.ts + L.DAY > now).length, graded: st.results.length }, markets: Object.fromEntries(Object.entries(L.MARKETS).map(([k, v]) => [k, v.q])) });
} catch (e) { L.send(res, 500, { error: String(e.message || e) }); } };
