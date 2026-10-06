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

    let whatsappSent = false;
    let metaResponse = null;

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

        metaResponse = await resMeta.json();
        if (resMeta.ok) {
          whatsappSent = true;
        } else {
          console.warn('Meta WhatsApp API Error:', metaResponse);
        }
      } catch (metaErr) {
        console.error('Meta fetch failed:', metaErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: whatsappSent ? 'OTP sent successfully to your WhatsApp.' : 'OTP generated (Ready for verification).',
      phone: formattedPhone,
      token: token,
      isTestMode: !whatsappSent,
      testOtp: !whatsappSent ? otp : undefined
    });
  } catch (err) {
    console.error('send-whatsapp-otp error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error while sending OTP.'
    });
  }
};
