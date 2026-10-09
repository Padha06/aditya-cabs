// Public site config. GET is open (the site reads it); POST requires an admin.
const { getAdminSession } = require('./_lib/session');
const { getDoc, setDoc } = require('./_lib/firestore');

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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', req.method === 'GET' ? 'public, s-maxage=30, stale-while-revalidate=180' : 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const cfg = await getDoc('config/site');
      if (cfg) delete cfg.id;
      return res.status(200).json({ success: true, config: cfg || {} });
    } catch (e) {
      console.error('config GET error:', e.message);
      return res.status(200).json({ success: true, config: {} });
    }
  }

  if (req.method === 'POST') {
    const admin = getAdminSession(req);
    if (!admin) return res.status(401).json({ success: false, error: 'Admin sign-in required.' });
    try {
      const body = await parseBody(req);
      const config = body.config;
      if (!config || typeof config !== 'object') return res.status(400).json({ success: false, error: 'Missing config.' });
      config.updatedAt = new Date().toISOString();
      config.updatedBy = admin.email;
      await setDoc('config/site', config);
      return res.status(200).json({ success: true, updatedAt: config.updatedAt });
    } catch (e) {
      console.error('config POST error:', e.message);
      return res.status(500).json({ success: false, error: e.message || 'Could not save config.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
