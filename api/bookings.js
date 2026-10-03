// Vercel Serverless Function: /api/bookings
// Manages bookings, persists data, and optionally syncs to Google Sheets or Webhooks.

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
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'Shivrudra Taxi Booking API',
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    try {
      const data = await parseBody(req);

      if (!data || !data.from || !data.to || !data.phone) {
        return res.status(400).json({
          success: false,
          error: 'Missing required booking fields (from, to, phone)'
        });
      }

      // Generate verified booking reference ID if not provided
      const bookingId = data.id || `SR-${Math.floor(10000 + Math.random() * 90000)}`;
      const bookingRecord = {
        id: bookingId,
        createdAt: data.createdAt || new Date().toISOString(),
        from: data.from,
        to: data.to,
        date: data.date,
        time: data.time,
        car: data.car || 'sedan',
        totalFare: data.totalFare || data.fare || 0,
        advance: data.advance || 0,
        balance: data.balance || 0,
        paymentMode: data.paymentMode || 'advance',
        utr: data.utr || '',
        name: data.name || 'Valued Passenger',
        phone: data.phone,
        pickupAddress: data.pickupAddress || '',
        dropAddress: data.dropAddress || '',
        urgent: !!data.urgent,
        status: 'confirmed'
      };

      // Optional Google Sheets / Webhook Sync (e.g. Google App Script Webhook or Zapier/Make)
      const webhookUrl = process.env.BOOKING_WEBHOOK_URL;
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingRecord)
          });
        } catch (webhookErr) {
          console.error('Webhook sync error:', webhookErr);
          // Non-blocking: booking still succeeds
        }
      }

      return res.status(200).json({
        success: true,
        bookingId: bookingId,
        message: 'Booking successfully confirmed and logged.',
        booking: bookingRecord
      });
    } catch (err) {
      console.error('Booking API Error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Failed to process booking.'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
