// Updates the signed-in phone account's profile details in Firestore.
const { getSession } = require('./_lib/session');
const { setDoc, getDoc } = require('./_lib/firestore');

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

const ALLOWED = ['name', 'email', 'altPhone', 'homeAddress', 'workAddress', 'firebaseUid'];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const session = getSession(req);
  if (!session) return res.status(401).json({ success: false, error: 'Not signed in.' });

  try {
    const body = await parseBody(req);
    const patch = {};
    ALLOWED.forEach((k) => {
      if (typeof body[k] === 'string' && body[k].trim() !== '') patch[k] = body[k].trim().slice(0, 160);
    });
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ success: false, error: 'Nothing to update.' });
    }
    patch.updatedAt = new Date().toISOString();
    await setDoc('users/' + session.uid, patch);
    const user = await getDoc('users/' + session.uid);
    return res.status(200).json({ success: true, user: user || { id: session.uid } });
  } catch (err) {
    console.error('update-profile error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Could not save your details.' });
  }
};
