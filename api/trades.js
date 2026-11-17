// last trades on the coin's top pool (GeckoTerminal)
const L = require('./_lib');
const GT = { headers: { accept: 'application/json;version=20230302' } };
module.exports = async (req, res) => { try {
  const mint = new URL(req.url, 'http://x').searchParams.get('mint') || ''; if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) return L.send(res, 400, { error: 'bad mint' });
  const out = await L.cached('tr:' + mint, 15000, async () => {
    const pools = await L.cached('pool:' + mint, 300000, () => L.getJSON(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${mint}/pools?page=1`, GT));
    const pool = pools.data && pools.data[0]; if (!pool) return { trades: [] };
    const t = await L.getJSON(`https://api.geckoterminal.com/api/v2/networks/solana/pools/${pool.attributes.address}/trades?trade_volume_in_usd_greater_than=0`, GT);
    const base = (pool.relationships.base_token.data.id || '').replace('solana_', '') === mint;
    return { trades: (t.data || []).slice(0, 40).map(x => { const a = x.attributes; const buy = base ? a.kind === 'buy' : a.kind === 'sell'; return { buy, usd: +a.volume_in_usd || 0, wallet: a.tx_from_address, ts: Date.parse(a.block_timestamp), tx: a.tx_hash }; }) }; });
  L.send(res, 200, out, 10); } catch (e) { L.send(res, 502, { error: String(e.message || e), trades: [] }); } };
