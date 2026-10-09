// Shared-cab board. Public GET returns masked shared trips (first-name initial
// only — no full name, no phone, no gender). POST lets a traveller post a trip.
const { listOrdered, addDoc } = require('./_lib/firestore');

async function parseBody(req) {
  if (req.body) {
    if (typeof req.body === 'object') return req.body;
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}

const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);
const firstName = (name) => clean(name, 60).split(/\s+/)[0] || '';
const initialOf = (name) => { const f = firstName(name); return f ? f[0].toUpperCase() : 'T'; };

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', req.method === 'GET' ? 'public, s-maxage=30, stale-while-revalidate=120' : 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const [bookings, posts] = await Promise.all([
        listOrdered('bookings', 'createdAt', 'DESCENDING', 300).catch(() => []),
        listOrdered('shareBoard', 'createdAt', 'DESCENDING', 200).catch(() => [])
      ]);
      const shared = bookings.filter((b) => b.type === 'share');
      const items = [];
      shared.forEach((b) => {
        if (!b.fromId || !b.toId) return;
        items.push({ id: 'b' + b.id, from: b.fromId, to: b.toId, date: b.date || '', time: b.time || '', seats: Number(b.seats) || 1, name: initialOf(b.name), source: 'book' });
      });
      posts.forEach((p) => {
        if (!p.from || !p.to) return;
        items.push({ id: 'p' + p.id, from: p.from, to: p.to, date: p.date || '', time: p.time || '', seats: Number(p.seats) || 1, name: initialOf(p.name), source: 'post' });
      });
      // keep future/any date; sort by date then time
      items.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
      return res.status(200).json(items);
    } catch (e) {
      console.error('share-board GET error:', e.message);
      return res.status(200).json([]);
    }
  }

  if (req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const from = clean(body.from, 40), to = clean(body.to, 40), date = clean(body.date, 12), time = clean(body.time, 8);
      const seats = Math.min(3, Math.max(1, Number(body.seats) || 1));
      const name = firstName(body.name);
      if (!from || !to || from === to) return res.status(400).json({ success: false, error: 'Choose two different cities.' });
      if (!name) return res.status(400).json({ success: false, error: 'Add your first name.' });
      if (!date || !time) return res.status(400).json({ success: false, error: 'Add travel date and time.' });
      await addDoc('shareBoard', { from, to, date, time, seats, name, createdAt: new Date().toISOString() });
      return res.status(200).json({ success: true });
    } catch (e) {
      console.error('share-board POST error:', e.message);
      return res.status(500).json({ success: false, error: 'Could not post your trip.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
