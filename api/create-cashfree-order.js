// Vercel Serverless Function: /api/create-cashfree-order
// Creates an official Cashfree PG Order for UPI / Card / NetBanking modal checkout.

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
    const amount = Number(body.amount);
    const notes = body.notes || {};
    const customer = body.customer || {};

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount in INR is required.' });
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const env = (process.env.CASHFREE_ENV || 'production').toLowerCase();
    const apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01';

    if (!appId || !secretKey) {
      return res.status(500).json({
        error: 'Cashfree API keys not configured. Please add CASHFREE_APP_ID and CASHFREE_SECRET_KEY to Vercel Environment Variables.',
        missingKeys: true
      });
    }

    const host = req.headers['x-forwarded-host'] || req.headers.host || 'shivrudrataxi.com';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const returnUrl = `${proto}://${host}/summary.html?order_id={order_id}`;

    const rawPhone = String(notes.phone || customer.phone || '9999999999').replace(/\D/g, '');
    const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : '9999999999';
    const customerId = 'cust_' + cleanPhone + '_' + Date.now().toString().slice(-4);
    const orderId = 'order_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);

    const baseUrl = env === 'sandbox' 
      ? 'https://sandbox.cashfree.com/pg' 
      : 'https://api.cashfree.com/pg';

    const orderPayload = {
      order_id: orderId,
      order_amount: Math.round(amount * 100) / 100,
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId.slice(0, 50),
        customer_name: (notes.name || customer.name || 'Valued Passenger').slice(0, 50),
        customer_phone: cleanPhone,
        customer_email: (customer.email || 'bookings@shivrudrataxi.com').slice(0, 100)
      },
      order_meta: {
        return_url: returnUrl
      },
      order_note: `Cab Booking: ${(notes.from || '')} to ${(notes.to || '')} (${notes.car || 'Cab'})`.slice(0, 200)
    };

    const response = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': apiVersion,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree order creation error:', data);
      return res.status(response.status).json({
        error: data.message || 'Failed to create Cashfree payment order.',
        details: data
      });
    }

    return res.status(200).json({
      success: true,
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      cfOrderId: data.cf_order_id,
      orderAmount: data.order_amount,
      environment: env
    });
  } catch (err) {
    console.error('Cashfree Order Exception:', err);
    return res.status(500).json({
      error: err.message || 'Internal error creating Cashfree payment session.'
    });
  }
};
