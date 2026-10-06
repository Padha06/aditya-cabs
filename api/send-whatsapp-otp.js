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
    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    const twoFactorKey = process.env.TWOFACTOR_API_KEY;
    const customOtpUrl = process.env.CUSTOM_OTP_API_URL;

    let otpDispatched = false;
    let dispatchChannel = 'simulation';

    // 1. Meta WhatsApp Cloud API
    if (whatsappToken && whatsappPhoneId) {
      try {
        const metaUrl = `https://graph.facebook.com/v19.0/${whatsappPhoneId}/messages`;
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
              language: { code: 'en' },
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: otp }
                  ]
                },
                {
                  type: 'button',
                  sub_type: 'url',
                  index: '0',
                  parameters: [
                    { type: 'text', text: otp }
                  ]
                }
              ]
            }
          })
        });

        if (resMeta.ok) {
          otpDispatched = true;
          dispatchChannel = 'whatsapp';
        } else {
          console.warn('Meta WhatsApp API Error:', await resMeta.json());
        }
      } catch (metaErr) {
        console.error('Meta fetch failed:', metaErr);
      }
    }

    // 2. Fast2SMS Indian SMS Gateway
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

    // 3. 2Factor Indian Gateway
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

    // 4. Custom Client OTP Endpoint
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

    return res.status(200).json({
      success: true,
      message: otpDispatched 
        ? `OTP sent successfully to +91 ${rawPhone.slice(-10)}.` 
        : 'OTP generated (Ready for verification).',
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
