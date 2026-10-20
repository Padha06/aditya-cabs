// Vercel Serverless Function: /api/verify-cashfree-payment
// Verifies Cashfree payment status directly with Cashfree PG APIs.

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
    const orderId = body.order_id || body.orderId;

    if (!orderId) {
      return res.status(400).json({
        verified: false,
        error: 'Missing order_id parameter.'
      });
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    const env = (process.env.CASHFREE_ENV || 'production').toLowerCase();
    const apiVersion = process.env.CASHFREE_API_VERSION || '2023-08-01';

    if (!appId || !secretKey) {
      return res.status(500).json({
        verified: false,
        error: 'Cashfree secret keys not configured on server.'
      });
    }

    const baseUrl = env === 'sandbox' 
      ? 'https://sandbox.cashfree.com/pg' 
      : 'https://api.cashfree.com/pg';

    const headers = {
      'x-client-id': appId,
      'x-client-secret': secretKey,
      'x-api-version': apiVersion,
      'Content-Type': 'application/json'
    };

    // 1. Fetch Order Details
    const orderRes = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers
    });
    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      console.error('Cashfree order fetch error:', orderData);
      return res.status(orderRes.status).json({
        verified: false,
        error: orderData.message || 'Order not found in Cashfree.'
      });
    }

    // 2. Fetch Payment Attempts
    let payments = [];
    try {
      const payRes = await fetch(`${baseUrl}/orders/${encodeURIComponent(orderId)}/payments`, {
        method: 'GET',
        headers
      });
      if (payRes.ok) {
        payments = await payRes.json();
      }
    } catch (e) {
      console.warn('Could not fetch Cashfree payments list:', e.message);
    }

    // Check for success
    const isPaid = orderData.order_status === 'PAID';
    const successfulPayment = Array.isArray(payments) 
      ? payments.find(p => p.payment_status === 'SUCCESS')
      : null;

    if (isPaid || successfulPayment) {
      const paymentId = successfulPayment 
        ? String(successfulPayment.cf_payment_id) 
        : `CF_${orderData.cf_order_id || orderId}`;

      return res.status(200).json({
        verified: true,
        orderId: orderData.order_id,
        paymentId: paymentId,
        orderStatus: orderData.order_status,
        amount: orderData.order_amount,
        paymentMethod: successfulPayment ? (successfulPayment.payment_group || 'online') : 'online',
        message: 'Cashfree payment verified successfully.'
      });
    }

    return res.status(200).json({
      verified: false,
      orderId: orderData.order_id,
      orderStatus: orderData.order_status,
      message: `Order status is ${orderData.order_status}. Payment not completed yet.`
    });
  } catch (err) {
    console.error('Cashfree verification exception:', err);
    return res.status(500).json({
      verified: false,
      error: err.message || 'Error occurred while verifying Cashfree payment.'
    });
  }
};
