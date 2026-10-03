// Vercel Serverless Function: /api/create-razorpay-order
// Creates an official Razorpay Order for secure UPI / Card / NetBanking checkout.

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

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = await parseBody(req);
    const amount = Number(body.amount); // in INR
    const currency = body.currency || 'INR';
    const receipt = body.receipt || `rcpt_${Date.now()}`;
    const notes = body.notes || {};

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount in INR is required.' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({
        error: 'Razorpay API keys not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to Vercel Environment Variables.',
        missingKeys: true
      });
    }

    // Amount must be in paise (e.g., 500 INR = 50000 paise)
    const amountInPaise = Math.round(amount * 100);

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: currency,
        receipt: receipt.slice(0, 40),
        notes: {
          brand: 'Shivrudra Taxi',
          customerName: (notes.name || '').slice(0, 50),
          customerPhone: (notes.phone || '').slice(0, 20),
          route: `${notes.from || ''} to ${notes.to || ''}`.slice(0, 50)
        }
      })
    });

    const orderData = await response.json();

    if (!response.ok) {
      console.error('Razorpay order creation error:', orderData);
      return res.status(response.status).json({
        error: orderData.error?.description || 'Failed to create Razorpay order.',
        details: orderData
      });
    }

    return res.status(200).json({
      success: true,
      orderId: orderData.id,
      amount: orderData.amount, // in paise
      amountInr: amount,
      currency: orderData.currency,
      keyId: keyId
    });
  } catch (err) {
    console.error('Razorpay Order API Exception:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error while creating payment order.'
    });
  }
};
