// Admin booking tracking: today / last 7 days / last 30 days + a filtered list.
const { getAdminSession } = require('../_lib/session');
const { listOrdered } = require('../_lib/firestore');

const ts = (b) => { const t = Date.parse(b.createdAt || 0); return isNaN(t) ? 0 : t; };
const sum = (list, k) => list.reduce((s, b) => s + (Number(b[k]) || 0), 0);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const admin = getAdminSession(req);
  if (!admin) return res.status(401).json({ success: false, error: 'Admin sign-in required.' });
  if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const all = await listOrdered('bookings', 'createdAt', 'DESCENDING', 500);
    all.sort((a, b) => ts(b) - ts(a));

    const now = Date.now();
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
    const d1 = startOfDay.getTime();
    const d7 = now - 7 * 864e5;
    const d30 = now - 30 * 864e5;

    const agg = (from) => {
      const list = all.filter((b) => ts(b) >= from);
      return { count: list.length, revenue: sum(list, 'totalFare'), advance: sum(list, 'advance') };
    };

    const stats = {
      today: agg(d1),
      week: agg(d7),
      month: agg(d30),
      all: { count: all.length, revenue: sum(all, 'totalFare'), advance: sum(all, 'advance') }
    };

    const q = new URLSearchParams((req.url || '').split('?')[1] || '');
    const range = q.get('range') || 'today';
    const from = range === 'week' ? d7 : range === 'month' ? d30 : range === 'all' ? 0 : d1;
    const bookings = all.filter((b) => ts(b) >= from).slice(0, 200);

    return res.status(200).json({ success: true, stats, range, bookings });
  } catch (err) {
    console.error('admin/bookings error:', err.message);
    return res.status(500).json({ success: false, error: 'Could not load bookings.' });
  }
};
