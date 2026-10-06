// Shared reviews. GET returns the public list; POST adds one; DELETE removes
// the author's own review (via its delete token) or any review for an admin.
const crypto = require('crypto');
const { getAdminSession } = require('./_lib/session');
const { setDoc, getDoc, deleteDoc, listOrdered } = require('./_lib/firestore');

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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const q = new URLSearchParams((req.url || '').split('?')[1] || '');

  if (req.method === 'GET') {
    try {
      const list = await listOrdered('reviews', 'createdAt', 'DESCENDING', 100);
      list.forEach((r) => { delete r.deleteToken; });
      return res.status(200).json(list);
    } catch (e) {
      console.error('reviews GET error:', e.message);
      return res.status(200).json([]);
    }
  }

  if (req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const name = clean(body.name, 40);
      const route = clean(body.route, 80) || 'Maharashtra';
      const text = clean(body.text, 220);
      let rating = Number(body.rating);
      if (!(rating >= 1 && rating <= 5)) rating = 5;
      if (!name) return res.status(400).json({ error: 'Please add your name.' });
      if (text.length < 12) return res.status(400).json({ error: 'Review is too short.' });

      const id = 'r' + Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
      const deleteToken = crypto.randomBytes(16).toString('hex');
      const rec = { id, name, route, rating, text, createdAt: new Date().toISOString(), deleteToken };
      await setDoc('reviews/' + id, rec);
      return res.status(200).json({ id, name, route, rating, text, deleteToken });
    } catch (e) {
      console.error('reviews POST error:', e.message);
      return res.status(500).json({ error: 'Could not save the review.' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const id = clean(q.get('id'), 64);
      if (!id) return res.status(400).json({ error: 'Missing id.' });
      const admin = getAdminSession(req);
      const token = clean(q.get('token'), 64);
      const doc = await getDoc('reviews/' + id);
      if (!doc) return res.status(200).json({ success: true });
      if (admin || (token && token === doc.deleteToken)) {
        await deleteDoc('reviews/' + id);
        return res.status(200).json({ success: true });
      }
      return res.status(403).json({ success: false, error: 'Not allowed.' });
    } catch (e) {
      console.error('reviews DELETE error:', e.message);
      return res.status(500).json({ error: 'Could not delete.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
