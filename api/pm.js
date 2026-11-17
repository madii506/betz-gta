// live GTA markets on Polymarket (gamma public search)
const L = require('./_lib');
module.exports = async (req, res) => { try {
  const out = await L.cached('pm', 60000, async () => {
    const qs = ['gta', 'gta vi', 'grand theft auto'];
    const rs = await Promise.allSettled(qs.map(q => L.getJSON(`https://gamma-api.polymarket.com/public-search?q=${encodeURIComponent(q)}&limit_per_type=25&events_status=active`)));
    const ev = new Map();
    for (const r of rs) if (r.status === 'fulfilled') for (const e of (r.value.events || [])) { if (e.closed || ev.has(e.slug)) continue; if (!/gta|grand theft/i.test(e.title || '')) continue;
      const markets = (e.markets || []).filter(m => !m.closed).map(m => { let p = []; try { p = JSON.parse(m.outcomePrices || '[]').map(Number); } catch (_) {} let o = []; try { o = JSON.parse(m.outcomes || '[]'); } catch (_) {}
        return { q: m.question, label: m.groupItemTitle || '', yes: p[0] ?? null, outcomes: o, vol: +(m.volume || 0), end: m.endDate || null }; }).filter(m => m.yes !== null);
      if (!markets.length) continue;
      ev.set(e.slug, { title: e.title, slug: e.slug, url: `https://polymarket.com/event/${e.slug}`, image: e.image || e.icon || null, vol: +(e.volume || 0), vol24: +(e.volume24hr || 0), end: e.endDate || null, markets: markets.sort((a, b) => b.vol - a.vol).slice(0, 8) }); }
    return { events: [...ev.values()].sort((a, b) => b.vol - a.vol) }; });
  L.send(res, 200, out, 60); } catch (e) { L.send(res, 502, { error: String(e.message || e), events: [] }); } };
