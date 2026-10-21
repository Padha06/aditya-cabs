// Server-side fare calculation. Runs the same booking-data.js the browser uses
// (in a sandbox) with the admin-edited config applied, so the amount charged
// never depends on a number the browser sends.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { getDoc } = require('./firestore');

const SOURCE = fs.readFileSync(path.join(__dirname, '..', '..', 'booking-data.js'), 'utf8');
const ADVANCE = 500;

function loadPricing(config) {
  const noop = () => {};
  const storage = { getItem: () => null, setItem: noop };
  const sandbox = {
    window: {},
    document: { querySelector: () => null, querySelectorAll: () => [] },
    location: { search: '' },
    sessionStorage: storage,
    localStorage: storage,
    URLSearchParams,
    // booking-data.js fetches /api/config on load; config is applied below instead.
    fetch: () => Promise.reject(new Error('no fetch on server')),
    setTimeout,
    clearTimeout,
    console
  };
  vm.runInNewContext(SOURCE, sandbox, { filename: 'booking-data.js' });
  const ST = sandbox.window.STBooking;
  if (config) ST.applyConfig(config);
  return ST;
}

async function siteConfig() {
  try {
    const cfg = await getDoc('config/site');
    if (cfg) delete cfg.id;
    return cfg || null;
  } catch (e) {
    console.error('pricing: config load failed, using defaults:', e.message);
    return null;
  }
}

// flow: the booking choices (type, from, to, car, plan, date, rdate, pkg, seats, route, city).
// mode: "full" pays the whole fare, anything else pays the advance.
async function amountDue(flow, mode) {
  const ST = loadPricing(await siteConfig());
  const clean = {};
  ['type', 'from', 'to', 'car', 'plan', 'date', 'rdate', 'pkg', 'seats', 'route', 'city'].forEach((k) => {
    if (flow && flow[k] != null) clean[k] = String(flow[k]).slice(0, 100);
  });
  const total = ST.planFare(clean);
  const amount = mode === 'full' ? total : Math.min(ADVANCE, total);
  return { total, amount };
}

module.exports = { amountDue };
