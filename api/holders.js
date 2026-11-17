// top holders: Jupiter's holder index (labels pools), share of total supply; Solana RPC as a fallback
const L = require('./_lib');
const RPCS = [process.env.RPC_URL, 'https://solana-rpc.publicnode.com', 'https://api.mainnet-beta.solana.com'].filter(Boolean);
async function rpc(method, params) { let err; for (const u of RPCS) { try { const j = await L.getJSON(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), timeout: 8000 }); if (j.error) throw new Error(j.error.message); return j.result; } catch (e) { err = e; } } throw err; }
module.exports = async (req, res) => { try {
  const mint = new URL(req.url, 'http://x').searchParams.get('mint') || ''; if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) return L.send(res, 400, { error: 'bad mint' });
  const out = await L.cached('h:' + mint, 120000, async () => {
    let supply = ((await L.gtaCoins()).find(c => c.mint === mint) || {}).supply || 0;
    try { const j = await L.getJSON('https://datapi.jup.ag/v1/holders/' + mint);
      if (!supply) { const t = await L.tokensByMint([mint]); supply = (t[mint] || {}).supply || 0; }
      const holders = (j.holders || []).slice(0, 15).map(h => ({ owner: h.address, amount: +h.amount || 0, pct: supply ? (+h.amount || 0) / supply : 0, tag: (h.tags && h.tags[0] && h.tags[0].name) || null }));
      return { supply, count: j.count || null, holders, top10: holders.slice(0, 10).reduce((s, h) => s + h.pct, 0), src: 'jupiter' };
    } catch (e) {
      const [big, sup] = await Promise.all([rpc('getTokenLargestAccounts', [mint, { commitment: 'confirmed' }]), rpc('getTokenSupply', [mint])]); const total = +sup.value.uiAmount || 0;
      const holders = (big.value || []).slice(0, 15).map(a => ({ owner: a.address, amount: +a.uiAmount || 0, pct: total ? (+a.uiAmount || 0) / total : 0, tag: null }));
      return { supply: total, holders, top10: holders.slice(0, 10).reduce((s, h) => s + h.pct, 0), src: 'rpc' }; } });
  L.send(res, 200, out, 60); } catch (e) { L.send(res, 502, { error: String(e.message || e), holders: [] }); } };
