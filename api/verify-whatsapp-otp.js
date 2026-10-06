// Vercel Serverless Function: /api/verify-whatsapp-otp
// Verifies 6-digit verification OTP against cryptographic token or simulation,
// then creates/finds the rider account and sets a signed session cookie.
const crypto = require('crypto');
const { setDoc, getDoc } = require('./_lib/firestore');
const { createSession } = require('./_lib/session');

const OTP_SECRET = process.env.OTP_SECRET || 'sahyadri-cabs-otp-sec-token-2026';

async function parseBody(req) {
  if (req.body) {
    if (typeof req.body === 'object') return req.body;
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch (e) { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

function cleanIndianPhone(phoneStr) {
  if (!phoneStr) return '';
  const digits = String(phoneStr).replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

function verifyToken(phone, otp, token) {
  if (!token || !token.includes('.')) return false;
  const [expiresAtStr, hash] = token.split('.');
  const expiresAt = parseInt(expiresAtStr, 10);

  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return { valid: false, reason: 'OTP has expired. Please request a new one.' };
  }

  const expectedData = `${phone}:${otp}:${expiresAt}`;
  const expectedHash = crypto.createHmac('sha256', OTP_SECRET).update(expectedData).digest('hex');

  if (hash === expectedHash) {
    return { valid: true };
  }

  return { valid: false, reason: 'Incorrect OTP entered. Please try again.' };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = await parseBody(req);
    const rawPhone = body.phone || '';
    const otp = (body.otp || '').trim();
    const token = body.token || '';

    const formattedPhone = cleanIndianPhone(rawPhone);

    if (!formattedPhone || formattedPhone.length < 10) {
      return res.status(400).json({ success: false, error: 'Invalid phone number.' });
    }

    if (!otp || otp.length !== 6) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 6-digit OTP.' });
    }

    const verification = verifyToken(formattedPhone, otp, token);

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        verified: false,
        error: verification.reason || 'Invalid OTP code.'
      });
    }

    // Create / find the rider account (phone-first identity) and start a session.
    const id = formattedPhone; // e.g. 919876543210
    const now = new Date().toISOString();
    const providedName = String(body.name || '').trim().slice(0, 80);
    let user = null;
    let isNew = false;
    try {
      const existing = await getDoc('users/' + id);
      if (existing) {
        user = Object.assign({}, existing, {
          name: existing.name || providedName || 'Valued Rider',
          phone: id,
          lastLogin: now
        });
      } else {
        isNew = true;
        user = { id, phone: id, name: providedName || 'Valued Rider', role: 'rider', createdAt: now, lastLogin: now };
      }
      await setDoc('users/' + id, {
        phone: id,
        name: user.name,
        role: user.role || 'rider',
        createdAt: user.createdAt || now,
        lastLogin: now
      });
    } catch (fbErr) {
      console.warn('verify: firestore upsert failed:', fbErr.message);
      user = { id, phone: id, name: providedName || 'Valued Rider' };
    }

    try { createSession(res, user); } catch (sErr) { console.warn('verify: session failed:', sErr.message); }

    return res.status(200).json({
      success: true,
      verified: true,
      phone: id,
      isNew: isNew,
      user: { id: user.id, name: user.name, phone: user.phone },
      message: 'Mobile number verified successfully via WhatsApp!'
    });
  } catch (err) {
    console.error('verify-whatsapp-otp error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Server error while verifying OTP.'
    });
  }
};
