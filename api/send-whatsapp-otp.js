// Vercel Serverless Function: /api/send-whatsapp-otp
// Sends 6-digit verification OTP to WhatsApp via Meta Cloud API or test fallback.
const crypto = require('crypto');

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

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createToken(phone, otp, expiryMinutes = 10) {
  const expiresAt = Date.now() + expiryMinutes * 60 * 1000;
  const data = `${phone}:${otp}:${expiresAt}`;
  const hash = crypto.createHmac('sha256', OTP_SECRET).update(data).digest('hex');
  return `${expiresAt}.${hash}`;
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
    const name = body.name || 'Customer';
    const formattedPhone = cleanIndianPhone(rawPhone);

    if (!formattedPhone || formattedPhone.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid 10-digit mobile number.'
      });
    }

    const otp = generateOtp();
    const token = createToken(formattedPhone, otp);

    const whatsappToken = process.env.WHATSAPP_TOKEN;
    const whatsappPhoneId = process.env.WHATSAPP_PHONE_ID;
    const templateName = process.env.WHATSAPP_OTP_TEMPLATE || 'otp_verification';
    const templateLang = process.env.WHATSAPP_OTP_LANG || 'en_US';
    const includeButton = (process.env.WHATSAPP_OTP_BUTTON || 'true') !== 'false';
    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    const twoFactorKey = process.env.TWOFACTOR_API_KEY;
    const customOtpUrl = process.env.CUSTOM_OTP_API_URL;
    // Renflair WhatsApp OTP gateway (https://renflair.in/wp-otp.php).
    // Key is NEVER hardcoded — set RENFLAIR_API_KEY in Vercel env vars.
    const renflairKey = process.env.RENFLAIR_API_KEY;

    // True when at least one real delivery channel is configured. If so and every
    // channel fails, we must NOT leak the OTP in the response (test-mode fallback).
    const anyRealChannel = !!((whatsappToken && whatsappPhoneId) || renflairKey || fast2smsKey || twoFactorKey || customOtpUrl);

    let otpDispatched = false;
    let dispatchChannel = 'simulation';
    let lastError = '';

    // 1. Meta WhatsApp Cloud API (authentication / utility OTP template)
    if (whatsappToken && whatsappPhoneId) {
      try {
        const metaUrl = `https://graph.facebook.com/v19.0/${whatsappPhoneId}/messages`;
        const components = [
          { type: 'body', parameters: [{ type: 'text', text: otp }] }
        ];
        // Authentication templates expose a "copy code" URL button that takes the OTP.
        if (includeButton) {
          components.push({
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: otp }]
          });
        }

        const resMeta = await fetch(metaUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${whatsappToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'template',
            template: {
              name: templateName,
              language: { code: templateLang },
              components: components
            }
          })
        });

        if (resMeta.ok) {
          otpDispatched = true;
          dispatchChannel = 'whatsapp';
        } else {
          const metaErr = await resMeta.json().catch(() => ({}));
          lastError = (metaErr && metaErr.error && metaErr.error.message) || 'Meta WhatsApp API error';
          console.warn('Meta WhatsApp API Error:', lastError);
        }
      } catch (metaErr) {
        lastError = metaErr.message || 'Meta fetch failed';
        console.error('Meta fetch failed:', metaErr);
      }
    }

    // 2. Renflair WhatsApp OTP Gateway (simple GET API, ~₹0.12/message).
    // Contract: GET https://whatsapp.renflair.in/V1.php?API=KEY&COUNTRY=91&PHONE=10digit&OTP=6digit
    // Returns JSON like {"status":"SUCCESS","message":"..."}. Fail closed on unknown shapes.
    if (!otpDispatched && renflairKey) {
      try {
        const tenDigit = formattedPhone.slice(-10);
        const renflairUrl = `https://whatsapp.renflair.in/V1.php?API=${encodeURIComponent(renflairKey)}&COUNTRY=91&PHONE=${encodeURIComponent(tenDigit)}&OTP=${encodeURIComponent(otp)}`;
        const rRes = await fetch(renflairUrl);
        let rData = null;
        try { rData = await rRes.json(); } catch (parseErr) { rData = null; }
        const rStatus = String((rData && (rData.status || rData.result || rData.success)) || '').toLowerCase();
        const rMsg = (rData && (rData.message || rData.msg || rData.error)) || '';
        const rOk = /^(success|successful|sent|delivered|ok|true|1|200)$/.test(rStatus);
        if (rRes.ok && rData && rOk) {
          otpDispatched = true;
          dispatchChannel = 'whatsapp_renflair';
        } else {
          lastError = rMsg ? `Renflair: ${rMsg}` : 'Renflair gateway rejected the request';
          console.warn('Renflair OTP failed:', rMsg || rData || rRes.status);
        }
      } catch (rErr) {
        lastError = rErr.message || 'Renflair fetch failed';
        console.error('Renflair fetch failed:', rErr);
      }
    }

    // 3. Fast2SMS Indian SMS Gateway
    if (!otpDispatched && fast2smsKey) {
      try {
        const f2Res = await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsKey}&variables_values=${otp}&route=otp&numbers=${rawPhone.slice(-10)}`);
        const f2Data = await f2Res.json();
        if (f2Data && f2Data.return) {
          otpDispatched = true;
          dispatchChannel = 'sms_fast2sms';
        }
      } catch (fErr) {
        console.error('Fast2SMS failed:', fErr);
      }
    }

    // 4. 2Factor Indian Gateway
    if (!otpDispatched && twoFactorKey) {
      try {
        const tfRes = await fetch(`https://2factor.in/API/V1/${twoFactorKey}/SMS/${rawPhone.slice(-10)}/${otp}/OTP1`);
        if (tfRes.ok) {
          otpDispatched = true;
          dispatchChannel = 'sms_2factor';
        }
      } catch (tfErr) {
        console.error('2Factor failed:', tfErr);
      }
    }

    // 5. Custom Client OTP Endpoint
    if (!otpDispatched && customOtpUrl) {
      try {
        const cRes = await fetch(customOtpUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: formattedPhone, otp, name })
        });
        if (cRes.ok) {
          otpDispatched = true;
          dispatchChannel = 'custom_gateway';
        }
      } catch (cErr) {
        console.error('Custom OTP endpoint failed:', cErr);
      }
    }

    // A real channel was configured but every attempt failed: surface the error
    // instead of falling back to test mode (which would leak the OTP).
    if (!otpDispatched && anyRealChannel) {
      return res.status(502).json({
        success: false,
        error: lastError
          ? `Could not deliver OTP on WhatsApp: ${lastError}`
          : 'Could not deliver the OTP right now. Please try again in a moment.'
      });
    }

    return res.status(200).json({
      success: true,
      message: otpDispatched 
        ? `OTP sent successfully to +91 ${rawPhone.slice(-10)}.` 
        : 'OTP generated (test mode — no delivery channel configured).',
      channel: dispatchChannel,
      phone: formattedPhone,
      token: token,
      isTestMode: !otpDispatched,
      testOtp: !otpDispatched ? otp : undefined
    });
  } catch (err) {
    console.error('send-whatsapp-otp error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while sending OTP.'
    });
  }
};
