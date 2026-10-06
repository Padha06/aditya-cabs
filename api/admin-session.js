// Admin auth: exchanges a Firebase ID token (email/password sign-in) for a
// signed admin cookie, but only for emails on the ADMIN_EMAILS allowlist.
const { verifyIdToken } = require('./_lib/firebaseAuth');
const { createAdminSession, clearAdminSession, getAdminSession, isAdminEmail } = require('./_lib/session');

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const s = getAdminSession(req);
    return res.status(200).json({ authenticated: !!s, email: s ? s.email : null });
  }

  if (req.method === 'DELETE') {
    clearAdminSession(res);
    return res.status(200).json({ success: true });
  }

  if (req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const idToken = body.idToken || '';
      const decoded = await verifyIdToken(idToken);
      if (!decoded || !decoded.email) {
        return res.status(401).json({ success: false, error: 'Could not verify your sign-in. Please try again.' });
      }
      if (!isAdminEmail(decoded.email)) {
        return res.status(403).json({ success: false, error: 'This account is not an admin. Ask the owner to add your email.' });
      }
      createAdminSession(res, { email: decoded.email, uid: decoded.uid });
      return res.status(200).json({ success: true, email: decoded.email });
    } catch (err) {
      console.error('admin-session error:', err);
      return res.status(500).json({ success: false, error: 'Sign-in failed. Please try again.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
