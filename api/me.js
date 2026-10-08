// Phone-account session endpoint.
//   GET    -> current user (from the st_session cookie)
//   DELETE -> sign out (clears the cookie)  [logout folded in to stay within
//             the Vercel function limit]
const { getSession, clearSession } = require('./_lib/session');
const { getDoc } = require('./_lib/firestore');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'DELETE' || req.method === 'POST') {
    clearSession(res);
    return res.status(200).json({ success: true });
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const session = getSession(req);
  if (!session) return res.status(200).json({ authenticated: false });

  let user = null;
  try { user = await getDoc('users/' + session.uid); }
  catch (e) { console.warn('me: getDoc failed:', e.message); }
  if (!user) user = { id: session.uid, phone: session.phone, name: 'Rider' };

  return res.status(200).json({ authenticated: true, user });
};
