// shared helpers: http, Jupiter token data, blob storage for calls
const JUP = 'https://lite-api.jup.ag/tokens/v2/search?query=';
const memo = new Map();
async function cached(key, ms, fn) { const m = memo.get(key); if (m && Date.now() - m.t < ms) return m.v; const v = await fn(); memo.set(key, { t: Date.now(), v }); return v; }
async function getJSON(url, opt = {}) { const c = new AbortController(); const t = setTimeout(() => c.abort(), opt.timeout || 9000);
  try { const r = await fetch(url, { ...opt, signal: c.signal, headers: { accept: 'application/json', 'user-agent': 'betz/1.0', ...(opt.headers || {}) } }); if (!r.ok) throw new Error(url.split('?')[0] + ' ' + r.status); return await r.json(); } finally { clearTimeout(t); } }
function send(res, code, body, maxAge = 0) { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', maxAge ? `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 4}` : 'no-store'); res.end(JSON.stringify(body)); }
const QUERIES = ['gta', 'gta6', 'gta vi', 'gtavi', 'vice city', 'lucia', 'leonida', 'rockstar', 'jason duval', 'grand theft'];
const WORDS = /\bgta|gta ?(6|vi)\b|grand ?theft ?auto|vice ?city|lucia|leonida|rockstar|jason ?duval|hesoyam|los ?santos/i;
const BAD = /anthropic|good ?to ?ape|\bscam\b|test/i;
function stf(x) { x = x || {}; return { pc: x.priceChange ?? null, vol: (x.buyVolume || 0) + (x.sellVolume || 0), bv: x.buyVolume || 0, sv: x.sellVolume || 0, buys: x.numBuys || 0, sells: x.numSells || 0, traders: x.numTraders || 0, net: x.numNetBuyers ?? null, org: x.numOrganicBuyers ?? null, hc: x.holderChange ?? null, lc: x.liquidityChange ?? null }; }
function norm(t) { const s24 = t.stats24h || {}, s1 = t.stats1h || {};
  return { mint: t.id, name: t.name, symbol: t.symbol, icon: t.icon || null, launchpad: t.launchpad || null, mcap: t.mcap || 0, fdv: t.fdv || 0, price: t.usdPrice || 0, liq: t.liquidity || 0,
    holders: t.holderCount || 0, ch1h: s1.priceChange ?? null, ch24h: s24.priceChange ?? null, vol24h: (s24.buyVolume || 0) + (s24.sellVolume || 0), buys24h: s24.numBuys || 0, sells24h: s24.numSells || 0,
    supply: +(t.totalSupply || t.circSupply || 0), st: { m5: stf(t.stats5m), h1: stf(t.stats1h), h6: stf(t.stats6h), h24: stf(t.stats24h) }, audit: t.audit || null, twitter: t.twitter || null, website: t.website || null, dev: t.dev || null, grad: t.graduatedAt || null, orgLabel: t.organicScoreLabel || null, isVerified: !!t.isVerified, tags: t.tags || [], created: t.createdAt || (t.firstPool && t.firstPool.createdAt) || null, organic: t.organicScore || 0, verified: !!(t.audit && t.audit.isSus === false) }; }
// real GTA coins only: on-theme name, a real market (liquidity, holders, organic flow), not flagged, and no copycats of a bigger coin
function quality(t) { const a = t.audit || {}; const name = `${t.name} ${t.symbol}`; const mc = t.mcap || 0, liq = t.liquidity || 0, h = t.holderCount || 0, s24 = t.stats24h || {}, org = t.organicScore || 0;
  if (!WORDS.test(name) || BAD.test(name) || a.isSus) return false;
  if (mc < 15000 || h < 100 || liq < 3000) return false;
  if (liq > mc * .6 && h < 2000) return false;                       // a pool as big as the coin with no holders: fake liquidity
  if (org < 25 && !(h >= 2000 && (s24.numTraders || 0) >= 200)) return false;   // no organic trading: botted or dead
  return true; }
async function gtaCoins() { return cached('coins', 30000, async () => {
  const lists = await Promise.allSettled(QUERIES.map(q => getJSON(JUP + encodeURIComponent(q))));
  const seen = new Map();
  for (const l of lists) if (l.status === 'fulfilled' && Array.isArray(l.value)) for (const t of l.value) { if (!t || !t.id || seen.has(t.id) || !quality(t)) continue; seen.set(t.id, norm(t)); }
  const out = [...seen.values()].sort((a, b) => b.mcap - a.mcap);
  return out.slice(0, 60); }); }
async function tokensByMint(mints) { const out = {}; for (let i = 0; i < mints.length; i += 90) { const part = mints.slice(i, i + 90); const a = await getJSON(JUP + part.join(',')).catch(() => []); for (const t of a || []) out[t.id] = norm(t); } return out; }
// ---- markets: every call is its own 24h prediction against the coin's market cap at the moment it was made
const MARKETS = { up: { q: 'Higher in 24h?', win: (m0, m1) => m1 > m0 }, p50: { q: '+50% in 24h?', win: (m0, m1) => m1 >= m0 * 1.5 }, x2: { q: '2x in 24h?', win: (m0, m1) => m1 >= m0 * 2 }, x10: { q: '10x in 24h?', win: (m0, m1) => m1 >= m0 * 10 }, rug: { q: 'Halves in 24h?', win: (m0, m1) => m1 <= m0 * .5 } };
const DAY = 24 * 3600e3;
let blob = null; function B() { if (!blob) blob = require('@vercel/blob'); return blob; }
const hasStore = () => !!process.env.BLOB_READ_WRITE_TOKEN;
async function listAll(prefix) { const out = []; let cursor; do { const r = await B().list({ prefix, cursor, limit: 1000 }); out.push(...r.blobs.map(b => b.pathname)); cursor = r.hasMore ? r.cursor : null; } while (cursor && out.length < 20000); return out; }
// c/<mint>/<mkt>/<ts>-<side>-<wallet>-<mcap0>.json   r/<wallet>/<mint>-<mkt>-<ts>-<side>-<W|L>-<mcap1>.json
function parseCall(p) { const m = p.match(/^c\/([^/]+)\/(up|p50|x2|x10|rug)\/(\d+)-(Y|N)-([1-9A-HJ-NP-Za-km-z]{32,44})-([\d.]+)\.json$/); return m && { mint: m[1], mkt: m[2], ts: +m[3], side: m[4], wallet: m[5], mcap0: +m[6], key: `${m[1]}-${m[2]}-${m[3]}-${m[4]}` }; }
function parseRes(p) { const m = p.match(/^r\/([^/]+)\/([^-]+)-(up|p50|x2|x10|rug)-(\d+)-(Y|N)-(W|L)-([\d.]+)\.json$/); return m && { wallet: m[1], mint: m[2], mkt: m[3], ts: +m[4], side: m[5], won: m[6] === 'W', mcap1: +m[7], key: `${m[2]}-${m[3]}-${m[4]}-${m[5]}` }; }
async function state() { return cached('state', 8000, async () => {
  if (!hasStore()) return { calls: [], results: [], store: false };
  const [c, r] = await Promise.all([listAll('c/'), listAll('r/')]);
  return { calls: c.map(parseCall).filter(Boolean), results: r.map(parseRes).filter(Boolean), store: true }; }); }
function bust() { memo.delete('state'); }
module.exports = { getJSON, send, cached, gtaCoins, tokensByMint, MARKETS, DAY, B, hasStore, state, bust, listAll };
