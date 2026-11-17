const L = require('./_lib');
module.exports = async (req, res) => { try { const coins = await L.gtaCoins(); L.send(res, 200, { coins, at: Date.now() }, 20); } catch (e) { L.send(res, 502, { error: String(e.message || e) }); } };
