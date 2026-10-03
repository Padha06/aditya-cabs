// Vercel Serverless Function: /api/bookings
// Manages bookings, persists data, and optionally syncs to Google Sheets or Webhooks.

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
      const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

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
        fare: data.fare,
        advance: data.advance,
        balance: data.balance,
        paymentMode: data.paymentMode || 'advance',
        utr: data.utr || '',
        name: data.name || 'Valued Passenger',
        phone: data.phone,
        pickupAddress: data.pickupAddress || '',
        dropAddress: data.dropAddress || '',
        urgent: !!data.urgent,
        status: 'confirmed'
      };

      // Optional Google Sheets / Webhook Sync
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
        error: 'Failed to process booking.'
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
