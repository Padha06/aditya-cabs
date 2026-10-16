// Admin auth: exchanges credentials or a Firebase ID token for a
// signed admin cookie, but only for emails on the ADMIN_EMAILS allowlist.
const https = require('https');
const { verifyIdToken } = require('./_lib/firebaseAuth');
const { createAdminSession, clearAdminSession, getAdminSession, isAdminEmail, adminEmails } = require('./_lib/session');

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || "AIzaSyAqJtCy4VMRDUxxZP8fsAzkDIEKoj03MA0";

function postJson(url, data) {
  return new Promise((resolve) => {
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(raw) }); }
        catch (e) { resolve({ status: res.statusCode, data: { error: { message: raw } } }); }
      });
    });
    req.on('error', e => resolve({ status: 500, data: { error: { message: e.message } } }));
    req.write(JSON.stringify(data));
    req.end();
  });
}

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

      // 1. Password reset flow
      if (body.action === 'reset') {
        const email = String(body.email || '').trim().toLowerCase();
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
          return res.status(400).json({ success: false, error: 'Enter a valid email address.' });
        }
        if (!isAdminEmail(email)) {
          return res.status(403).json({ success: false, error: 'This email is not authorized as an admin.' });
        }
        const resetRes = await postJson('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=' + FIREBASE_API_KEY, {
          requestType: 'PASSWORD_RESET',
          email: email
        });
        if (resetRes.status === 200) {
          return res.status(200).json({ success: true, message: 'Reset link sent to ' + email + '. Check your inbox and spam folder.' });
        }
        const errMsg = resetRes.data && resetRes.data.error && resetRes.data.error.message;
        return res.status(400).json({ success: false, error: errMsg || 'Could not send reset email.' });
      }

      // 2. Direct email + password authentication (Bypasses client-side network blocks)
      if (body.email && body.password) {
        const email = String(body.email).trim().toLowerCase();
        const password = String(body.password);

        if (!isAdminEmail(email)) {
          return res.status(403).json({
            success: false,
            error: 'Access denied: "' + email + '" is not authorized as an admin. Please sign in with ' + (adminEmails().join(', ') || 'the registered admin email') + '.'
          });
        }

        // Attempt sign-in with Firebase Identity Toolkit
        const signInRes = await postJson('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + FIREBASE_API_KEY, {
          email: email,
          password: password,
          returnSecureToken: true
        });

        if (signInRes.status === 200 && signInRes.data && signInRes.data.idToken) {
          createAdminSession(res, { email: email, uid: signInRes.data.localId || email });
          return res.status(200).json({ success: true, email: email });
        }

        const errCode = signInRes.data && signInRes.data.error && signInRes.data.error.message;

        // If credentials invalid, check if account exists or needs first-time creation
        if (errCode === 'INVALID_LOGIN_CREDENTIALS' || errCode === 'EMAIL_NOT_FOUND') {
          const signUpRes = await postJson('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + FIREBASE_API_KEY, {
            email: email,
            password: password,
            returnSecureToken: true
          });

          if (signUpRes.status === 200 && signUpRes.data && signUpRes.data.idToken) {
            createAdminSession(res, { email: email, uid: signUpRes.data.localId || email });
            return res.status(200).json({ success: true, email: email, created: true });
          }

          const signUpErr = signUpRes.data && signUpRes.data.error && signUpRes.data.error.message;
          if (signUpErr === 'EMAIL_EXISTS') {
            return res.status(401).json({
              success: false,
              error: 'Incorrect password for ' + email + '. If you are unsure of your password, click "Forgot password? Send reset link".'
            });
          }
          if (signUpErr === 'WEAK_PASSWORD') {
            return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
          }
        }

        if (errCode === 'TOO_MANY_ATTEMPTS_TRY_LATER') {
          return res.status(429).json({ success: false, error: 'Too many failed sign-in attempts. Please wait 1 minute and try again.' });
        }

        return res.status(401).json({ success: false, error: 'Sign-in failed. Please check your credentials or reset your password.' });
      }

      // 3. Token-based authentication (legacy client-side fallback)
      const idToken = body.idToken || '';
      if (idToken) {
        const decoded = await verifyIdToken(idToken);
        if (!decoded || !decoded.email) {
          return res.status(401).json({ success: false, error: 'Could not verify your sign-in. Please try again.' });
        }
        if (!isAdminEmail(decoded.email)) {
          return res.status(403).json({ success: false, error: 'This account is not an admin. Ask the owner to add your email.' });
        }
        createAdminSession(res, { email: decoded.email, uid: decoded.uid });
        return res.status(200).json({ success: true, email: decoded.email });
      }

      return res.status(400).json({ success: false, error: 'Missing credentials.' });
    } catch (err) {
      console.error('admin-session error:', err);
      return res.status(500).json({ success: false, error: 'Sign-in failed. Please try again.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
