// top holders straight from Solana RPC: largest token accounts and their owners, as a share of supply
const L = require('./_lib');
const RPCS = [process.env.RPC_URL, 'https://solana-rpc.publicnode.com', 'https://api.mainnet-beta.solana.com'].filter(Boolean);
async function rpc(method, params) { let err; for (const u of RPCS) { try { const j = await L.getJSON(u, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), timeout: 8000 }); if (j.error) throw new Error(j.error.message); return j.result; } catch (e) { err = e; } } throw err; }
module.exports = async (req, res) => { try {
  const mint = new URL(req.url, 'http://x').searchParams.get('mint') || ''; if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) return L.send(res, 400, { error: 'bad mint' });
  const out = await L.cached('h:' + mint, 120000, async () => {
    const [big, sup] = await Promise.all([rpc('getTokenLargestAccounts', [mint, { commitment: 'confirmed' }]), rpc('getTokenSupply', [mint])]);
    const total = +sup.value.uiAmount || 0; const top = (big.value || []).slice(0, 15);
    const acc = await rpc('getMultipleAccounts', [top.map(a => a.address), { encoding: 'jsonParsed' }]).catch(() => ({ value: [] }));
    const holders = top.map((a, i) => { const info = acc.value?.[i]?.data?.parsed?.info; return { account: a.address, owner: info?.owner || null, amount: +a.uiAmount || 0, pct: total ? (+a.uiAmount || 0) / total : 0 }; });
    return { supply: total, holders, top10: holders.slice(0, 10).reduce((s, h) => s + h.pct, 0) }; });
  L.send(res, 200, out, 60); } catch (e) { L.send(res, 502, { error: String(e.message || e), holders: [] }); } };
