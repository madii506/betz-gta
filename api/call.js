// a free call: the wallet signs a message, nothing is sent on-chain, the server stores it with the coin's market cap right now
const L = require('./_lib'); const nacl = require('tweetnacl'); const bs58 = require('bs58');
const B58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const msgOf = (b) => `betz call\ncoin: ${b.mint}\nmarket: ${b.mkt}\nside: ${b.side === 'Y' ? 'YES' : 'NO'}\ntime: ${b.ts}`;
async function body(req) { if (req.body && typeof req.body === 'object') return req.body; let s = ''; for await (const c of req) s += c; return JSON.parse(s || '{}'); }
module.exports = async (req, res) => { try {
  if (req.method !== 'POST') return L.send(res, 405, { error: 'POST only' });
  if (!L.hasStore()) return L.send(res, 503, { error: 'calls open as soon as storage is connected' });
  const b = await body(req); const { wallet, mint, mkt, side, ts, sig } = b;
  if (!B58.test(wallet || '') || !B58.test(mint || '')) return L.send(res, 400, { error: 'bad wallet or coin' });
  if (!L.MARKETS[mkt]) return L.send(res, 400, { error: 'unknown market' }); if (side !== 'Y' && side !== 'N') return L.send(res, 400, { error: 'side must be Y or N' });
  if (!Number.isFinite(+ts) || Math.abs(Date.now() - +ts) > 5 * 60e3) return L.send(res, 400, { error: 'signature expired, sign again' });
  let ok = false; try { ok = nacl.sign.detached.verify(new TextEncoder().encode(msgOf(b)), bs58.decode(sig), bs58.decode(wallet)); } catch (_) {}
  if (!ok) return L.send(res, 401, { error: 'signature does not match this wallet' });
  const coins = await L.gtaCoins(); const coin = coins.find(c => c.mint === mint); if (!coin) return L.send(res, 404, { error: 'not a listed GTA coin' });
  const st = await L.state(); const now = Date.now();
  const open = st.calls.filter(c => c.wallet === wallet && c.ts + L.DAY > now);
  if (open.some(c => c.mint === mint && c.mkt === mkt)) return L.send(res, 409, { error: 'you already have an open call on this market' });
  if (open.length >= 40) return L.send(res, 429, { error: '40 open calls max per wallet' });
  const mcap0 = Math.max(1, Math.round(coin.mcap));
  const path = `c/${mint}/${mkt}/${+ts}-${side}-${wallet}-${mcap0}.json`;
  await L.B().put(path, JSON.stringify({ wallet, mint, mkt, side, ts: +ts, mcap0, sig, msg: msgOf(b) }), { access: 'public', addRandomSuffix: false, contentType: 'application/json' });
  L.bust(); L.send(res, 200, { ok: true, call: { mint, mkt, side, ts: +ts, mcap0, due: +ts + L.DAY } });
} catch (e) { L.send(res, 500, { error: String(e.message || e) }); } };
