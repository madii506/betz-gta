// a wallet's SOL and its GTA coins, straight from Solana RPC
const L = require('./_lib');
const RPCS = [process.env.RPC_URL, 'https://solana-rpc.publicnode.com', 'https://api.mainnet-beta.solana.com'].filter(Boolean);
async function rpc(method, params) { let err; for (const u of RPCS) { try { const j = await L.getJSON(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), timeout: 9000 }); if (j.error) throw new Error(j.error.message); return j.result; } catch (e) { err = e; } } throw err; }
const PROGS = ['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'];
module.exports = async (req, res) => { try {
  const w = new URL(req.url, 'http://x').searchParams.get('wallet') || ''; if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(w)) return L.send(res, 400, { error: 'bad wallet' });
  const [bal, ...acc] = await Promise.all([rpc('getBalance', [w, { commitment: 'confirmed' }]), ...PROGS.map(p => rpc('getTokenAccountsByOwner', [w, { programId: p }, { encoding: 'jsonParsed', commitment: 'confirmed' }]))]);
  const by = {}; for (const a of acc) for (const x of (a.value || [])) { const i = x.account.data.parsed.info, t = i.tokenAmount; const m = by[i.mint] ||= { mint: i.mint, raw: 0n, dec: t.decimals }; m.raw += BigInt(t.amount); }
  const coins = await L.gtaCoins(); const gta = coins.filter(c => by[c.mint] && by[c.mint].raw > 0n).map(c => { const b = by[c.mint], ui = Number(b.raw) / 10 ** b.dec; return { mint: c.mint, symbol: c.symbol, raw: b.raw.toString(), dec: b.dec, ui, usd: ui * (c.price || 0) }; }).sort((a, b) => b.usd - a.usd);
  L.send(res, 200, { sol: (bal.value || 0) / 1e9, gta, total: gta.reduce((s, x) => s + x.usd, 0) });
} catch (e) { L.send(res, 502, { error: String(e.message || e) }); } };
