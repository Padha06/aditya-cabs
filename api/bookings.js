// Vercel Serverless Function: /api/bookings
// POST: persists a booking to Firestore (tied to the signed-in account or phone)
//       and optionally forwards to a webhook.
// GET:  returns the signed-in account's bookings.
const { getSession } = require('./_lib/session');
const { addDoc, runQuery } = require('./_lib/firestore');

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

const cleanPhone = (p) => String(p || '').replace(/\D/g, '').slice(-10);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const session = getSession(req);

  // ---- list this account's bookings ----
  if (req.method === 'GET') {
    if (!session) return res.status(200).json({ success: true, bookings: [] });
    try {
      const bookings = await runQuery('bookings', 'userId', session.uid);
      bookings.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      return res.status(200).json({ success: true, bookings });
    } catch (err) {
      console.error('bookings GET error:', err);
      return res.status(500).json({ success: false, error: 'Could not load bookings.', bookings: [] });
    }
  }

  // ---- create a booking ----
  if (req.method === 'POST') {
    try {
      const data = await parseBody(req);
      if (!data || !data.from || !data.to || !data.phone) {
        return res.status(400).json({ success: false, error: 'Missing required booking fields (from, to, phone)' });
      }

      const bookingId = data.id || `SR-${Math.floor(10000 + Math.random() * 90000)}`;
      const phone10 = cleanPhone(data.phone);
      const userId = (session && session.uid) ? session.uid : ('phone_' + phone10);

      const bookingRecord = {
        id: bookingId,
        createdAt: data.createdAt || new Date().toISOString(),
        from: data.from,
        to: data.to,
        date: data.date || '',
        time: data.time || '',
        car: data.car || 'sedan',
        type: data.type || 'oneway',
        fromId: data.fromId || null,
        toId: data.toId || null,
        returnDate: data.returnDate || '',
        package: data.package || '',
        seats: (data.seats != null ? Number(data.seats) : null),
        totalFare: Number(data.totalFare || data.fare || 0),
        advance: Number(data.advance || 0),
        balance: Number(data.balance || 0),
        paymentMode: data.paymentMode || 'advance',
        paymentStatus: data.paymentStatus || '',
        razorpayPaymentId: data.razorpayPaymentId || null,
        name: data.name || 'Valued Passenger',
        phone: phone10,
        pickupAddress: data.pickupAddress || '',
        dropAddress: data.dropAddress || '',
        gst: data.gst || '',
        urgent: !!data.urgent,
        status: 'confirmed',
        userId: userId,
        accountType: (session && session.uid) ? 'phone' : 'guest'
      };

      // Persist to Firestore (best-effort; a booking still succeeds if the DB is down)
      try {
        await addDoc('bookings', bookingRecord);
      } catch (dbErr) {
        console.error('bookings: firestore write failed:', dbErr.message);
      }

      // Optional Google Sheets / Webhook sync
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
      return res.status(500).json({ success: false, error: err.message || 'Failed to process booking.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
