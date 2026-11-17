// the wire: live trades across the most traded GTA coins, merged
const L = require('./_lib');
const GT = { headers: { accept: 'application/json;version=20230302' } };
module.exports = async (req, res) => { try {
  const out = await L.cached('wire', 30000, async () => {
    const coins = (await L.gtaCoins()).slice().sort((a, b) => b.vol24h - a.vol24h).slice(0, 6);
    const lists = await Promise.allSettled(coins.map(async c => {
      const pools = await L.cached('pool:' + c.mint, 300000, () => L.getJSON(`https://api.geckoterminal.com/api/v2/networks/solana/tokens/${c.mint}/pools?page=1`, GT));
      const pool = pools.data && pools.data[0]; if (!pool) return [];
      const base = (pool.relationships.base_token.data.id || '').replace('solana_', '') === c.mint;
      const t = await L.getJSON(`https://api.geckoterminal.com/api/v2/networks/solana/pools/${pool.attributes.address}/trades?trade_volume_in_usd_greater_than=25`, GT);
      return (t.data || []).slice(0, 25).map(x => { const a = x.attributes; return { mint: c.mint, sym: c.symbol, icon: c.icon, buy: base ? a.kind === 'buy' : a.kind === 'sell', usd: +a.volume_in_usd || 0, wallet: a.tx_from_address, ts: Date.parse(a.block_timestamp), tx: a.tx_hash }; }); }));
    const all = lists.flatMap(l => l.status === 'fulfilled' ? l.value : []).sort((a, b) => b.ts - a.ts).slice(0, 80);
    return { trades: all }; });
  L.send(res, 200, out, 15); } catch (e) { L.send(res, 502, { error: String(e.message || e), trades: [] }); } };
