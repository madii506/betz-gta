// price history from GeckoTerminal: the token's top Solana pool, 15m candles
const L = require('./_lib');
module.exports = async (req, res) => { try {
  const u = new URL(req.url, 'http://x'); const mint = (u.searchParams.get('mint') || '').trim(); if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) return L.send(res, 400, { error: 'bad mint' });
  const q = u.searchParams.get('tf'); const tf = q === 'h' ? ['hour', 1] : q === 'd' ? ['day', 1] : q === '4' ? ['hour', 4] : ['minute', 15];
  const out = await L.cached('chart:' + mint + tf[0], 60000, async () => {
    const pools = await L.cached('pool:' + mint, 300000, () => L.getJSON(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${mint}/pools?page=1`, { headers: { accept: 'application/json;version=20230302' } }));
    const pool = pools.data && pools.data[0]; if (!pool) return { candles: [] };
    const base = (pool.relationships.base_token.data.id || '').replace('solana_', '') === mint ? 'base' : 'quote';
    const o = await L.getJSON(`https://api.geckoterminal.com/api/v2/networks/solana/pools/${pool.attributes.address}/ohlcv/${tf[0]}?aggregate=${tf[1]}&limit=200&currency=usd&token=${base}`, { headers: { accept: 'application/json;version=20230302' } });
    const list = ((o.data || {}).attributes || {}).ohlcv_list || [];
    return { pool: pool.attributes.address, dex: (pool.relationships.dex.data || {}).id, candles: list.map(c => ({ t: c[0] * 1000, o: c[1], h: c[2], l: c[3], c: c[4], v: c[5] })).sort((a, b) => a.t - b.t) }; });
  L.send(res, 200, out, 60); } catch (e) { L.send(res, 502, { error: String(e.message || e), candles: [] }); } };
