/* ============================================================================
   SHIVRUDRA TAXI - booking-data.js
   ---------------------------------------------------------------------------
   Shared data + flow state for the dedicated one-way booking funnel:
     /cabs  ->  /book  ->  /summary
   Mirrors the pricing/route data used by app.js so fares stay identical.
   Exposed globally as window.STBooking.
   ========================================================================= */
(function () {
  "use strict";

  const CONFIG = {
    brand: "Shivrudra Taxi",
    phoneDisplay: "+91 60057 91807",
    phoneTel: "+916005791807",
    whatsapp: "916005791807", // country code + number, digits only
    defaultMessage:
      "Hi Shivrudra Taxi, I would like to book a one-way cab. Please share availability and the fixed fare.",
    upiVpa: "6005791807@upi"
  };

  const CITIES = {
    pune:          { name: "Pune",                        short: "Pune" },
    mumbai:        { name: "Mumbai",                      short: "Mumbai" },
    sambhajinagar: { name: "Chhatrapati Sambhajinagar (Aurangabad)", short: "Aurangabad" },
    nashik:        { name: "Nashik",                      short: "Nashik" },
    ahilyanagar:   { name: "Ahilyanagar (Ahmednagar)",    short: "Ahilyanagar" },
    shirdi:        { name: "Shirdi",                      short: "Shirdi" },
    mahabaleshwar: { name: "Mahabaleshwar",               short: "Mahabaleshwar" },
    kolhapur:      { name: "Kolhapur",                    short: "Kolhapur" },
    lonavala:      { name: "Lonavala",                    short: "Lonavala" }
  };

  // Fixed one-way fares. Every pair runs BOTH directions at the same price.
  const ROUTES = [
    { a: "pune",          b: "mumbai",        sedan: 2799, suv: 3199, km: 150, time: "3h 30m" },
    { a: "pune",          b: "sambhajinagar", sedan: 2799, suv: 3499, km: 235, time: "5h" },
    { a: "pune",          b: "nashik",        sedan: 3199, suv: 3799, km: 210, time: "4h 30m" },
    { a: "pune",          b: "ahilyanagar",   sedan: 1999, suv: 2699, km: 120, time: "2h 30m" },
    { a: "pune",          b: "shirdi",        sedan: 2999, suv: 3699, km: 185, time: "4h" },
    { a: "pune",          b: "lonavala",      sedan: 1499, suv: 1999, km: 65,  time: "1h 30m" },
    { a: "pune",          b: "mahabaleshwar", sedan: 2499, suv: 3199, km: 120, time: "3h" },
    { a: "pune",          b: "kolhapur",      sedan: 3499, suv: 4299, km: 230, time: "5h" },
    { a: "mumbai",        b: "sambhajinagar", sedan: 3999, suv: 4799, km: 340, time: "7h" },
    { a: "mumbai",        b: "nashik",        sedan: 2999, suv: 3699, km: 165, time: "3h 30m" },
    { a: "mumbai",        b: "shirdi",        sedan: 3999, suv: 4799, km: 240, time: "5h" },
    { a: "mumbai",        b: "ahilyanagar",   sedan: 3999, suv: 4799, km: 255, time: "5h 30m" },
    { a: "mumbai",        b: "lonavala",      sedan: 1799, suv: 2299, km: 85,  time: "2h" },
    { a: "mumbai",        b: "mahabaleshwar", sedan: 3999, suv: 4799, km: 230, time: "4h 45m" },
    { a: "sambhajinagar", b: "nashik",        sedan: 2999, suv: 3699, km: 180, time: "4h" },
    { a: "sambhajinagar", b: "shirdi",        sedan: 2199, suv: 2799, km: 110, time: "2h 30m" },
    { a: "nashik",        b: "shirdi",        sedan: 1999, suv: 2499, km: 90,  time: "2h" },
    { a: "ahilyanagar",   b: "shirdi",        sedan: 1999, suv: 2599, km: 85,  time: "1h 50m" }
  ];

  const ONEWAY_CARS = {
    hatchback: { key: "hatchback", name: "HATCHBACK", models: "WagonR, i20, Celerio, Swift, etc.", specs: "1 bag | 4 seats", seats: 4, bags: 1, fuel: "CNG", image: "sedan-thumb.webp", popular: false },
    sedan:     { key: "sedan",     name: "SEDAN",     models: "Maruti Dzire, Hyundai Aura, Toyota Etios", specs: "2 bags | 4 seats", seats: 4, bags: 2, fuel: "CNG / PETROL", image: "sedan-thumb.webp", popular: true },
    sedan_xl:  { key: "sedan_xl",  name: "SEDAN XL",  models: "Diesel Only - Swift Dzire, Etios, Honda Amaze", specs: "2 bags | 4 seats", seats: 4, bags: 2, fuel: "DIESEL", image: "sedan-thumb.webp", popular: false },
    suv:       { key: "suv",       name: "SUV",       models: "Maruti Ertiga, Kia Carens, Mahindra Marazzo", specs: "4 bags | 6 seats", seats: 6, bags: 4, fuel: "CNG / DIESEL", image: "ertiga-thumb.webp", popular: false },
    crysta:    { key: "crysta",    name: "INNOVA CRYSTA (VIP)", models: "Toyota Innova Crysta / Hycross - Captain Seats", specs: "4 large bags | 7 seats", seats: 7, bags: 4, fuel: "DIESEL", image: "suv-thumb.webp", popular: false }
  };

  const CAR_ORDER = ["hatchback", "sedan", "sedan_xl", "suv", "crysta"];

  const inr = (n) => "\u20B9" + Number(n).toLocaleString("en-IN");

  function findRoute(a, b) {
    return ROUTES.find((r) => (r.a === a && r.b === b) || (r.a === b && r.b === a)) || null;
  }

  function cityName(id) {
    if (!id) return "";
    return CITIES[id] ? CITIES[id].name : id;
  }

  function getCarFare(carKey, from, to) {
    const r = findRoute(from, to);
    const baseSedan = r ? r.sedan : 2799;
    const baseSuv = r ? r.suv : 3499;
    if (carKey === "hatchback") return Math.round((baseSedan * 0.88) / 50) * 50;
    if (carKey === "sedan") return baseSedan;
    if (carKey === "sedan_xl") return Math.round((baseSedan * 1.07) / 50) * 50;
    if (carKey === "suv") return baseSuv;
    if (carKey === "crysta") return Math.round((baseSuv * 1.25) / 50) * 50;
    return baseSedan;
  }

  function planFare(flow) {
    const base = getCarFare(flow.car || "sedan", flow.from, flow.to);
    return flow.plan === "flexi" ? base + 100 : base;
  }

  function waUrl(message) {
    return "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(message);
  }

  /* -------- date formatting -------- */
  function formatDate(dateStr) {
    if (!dateStr) return "Today";
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch (e) {
      return dateStr;
    }
  }
  function formatTime(timeStr) {
    if (!timeStr) return "08:00 AM";
    if (/am|pm/i.test(timeStr)) return timeStr;
    const [h, m] = timeStr.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr}:${String(m || 0).padStart(2, "0")} ${ampm}`;
  }
  function dateTimeDisplay(dateStr, timeStr) {
    return `${formatDate(dateStr)} - ${formatTime(timeStr)}`;
  }

  /* -------- flow state (URL params + sessionStorage) -------- */
  const FLOW_KEY = "st_flow";
  const PROFILE_KEY = "st_profile";

  function readFlow() {
    try { return JSON.parse(sessionStorage.getItem(FLOW_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function writeFlow(obj) {
    try { sessionStorage.setItem(FLOW_KEY, JSON.stringify(obj)); } catch (e) {}
  }
  function updateFlow(patch) {
    const f = readFlow();
    Object.assign(f, patch);
    writeFlow(f);
    return f;
  }

  // Merge URL query params over stored flow so each step is shareable/refreshable.
  function loadFlow() {
    const f = readFlow();
    const q = new URLSearchParams(location.search);
    ["from", "to", "date", "time", "car", "plan"].forEach((k) => {
      if (q.has(k) && q.get(k)) f[k] = q.get(k);
    });
    if (q.has("urgent")) f.urgent = q.get("urgent") === "1" || q.get("urgent") === "true";
    // sensible defaults
    if (!f.from) f.from = "pune";
    if (!f.to) f.to = "mumbai";
    if (!f.car) f.car = "sedan";
    if (!f.plan) f.plan = "saver";
    if (f.urgent == null) f.urgent = false;
    return f;
  }

  function buildUrl(page, flow) {
    const p = new URLSearchParams();
    ["from", "to", "date", "time", "car", "plan"].forEach((k) => {
      if (flow[k]) p.set(k, flow[k]);
    });
    if (flow.urgent) p.set("urgent", "1");
    const qs = p.toString();
    return "/" + page + (qs ? "?" + qs : "");
  }

  /* -------- lightweight rider profile (no login) -------- */
  function readProfile() {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveProfile(patch) {
    const p = readProfile();
    Object.assign(p, patch);
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch (e) {}
    return p;
  }

  function saveBooking(b) {
    try {
      const raw = localStorage.getItem("st_bookings");
      const list = raw ? JSON.parse(raw) : [];
      list.unshift(b);
      localStorage.setItem("st_bookings", JSON.stringify(list.slice(0, 50)));
    } catch (e) {}
    saveProfile({
      name: b.name,
      phone: b.phone,
      verified: true,
      lastBookingId: b.id,
      tripsCount: (readProfile().tripsCount || 0) + 1
    });
  }

  function syncBookingToServer(b) {
    try {
      fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b)
      }).catch(() => {});
    } catch (e) {}
  }

  function newBookingId() {
    return `SR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // City centres for biasing map search (Photon) towards the right city.
  const CITY_GEO = {
    pune:          { lat: 18.5204, lon: 73.8567 },
    mumbai:        { lat: 19.0760, lon: 72.8777 },
    sambhajinagar: { lat: 19.8762, lon: 75.3433 },
    nashik:        { lat: 19.9975, lon: 73.7898 },
    ahilyanagar:   { lat: 19.0952, lon: 74.7496 },
    shirdi:        { lat: 19.7645, lon: 74.4774 },
    kolhapur:      { lat: 16.7050, lon: 74.2433 },
    mahabaleshwar: { lat: 17.9237, lon: 73.6586 },
    lonavala:      { lat: 18.7546, lon: 73.4062 }
  };

  // Curated local suggestions shown INSTANTLY (no network) while typing.
  // Live map (Photon) results are merged on top for full coverage.
  const LOCAL_SUGGESTIONS = {
    pune: [
      "Pune Airport (PNQ), Lohegaon", "Pune Railway Station", "Shivajinagar", "Hinjawadi IT Park",
      "Wakad", "Kothrud", "Kharadi", "Viman Nagar", "Magarpatta City", "Baner", "Swargate",
      "Pimpri-Chinchwad", "Katraj", "Hadapsar", "Aundh", "Deccan Gymkhana", "Wagholi", "Chakan MIDC"
    ],
    mumbai: [
      "Mumbai Airport T2 (BOM), Andheri", "Mumbai Airport T1 (BOM), Santacruz", "Dadar", "Bandra West",
      "Andheri", "BKC (Bandra Kurla Complex)", "Borivali", "Thane", "Navi Mumbai", "Panvel",
      "Powai", "Chembur", "Lower Parel", "Churchgate", "Colaba", "Juhu", "Malad", "Goregaon"
    ],
    nashik: [
      "Nashik Road Railway Station", "Ozar Airport (ISK), Nashik", "Panchavati", "Gangapur Road",
      "College Road", "Mumbai Naka", "Ambad MIDC", "Satpur MIDC", "Indira Nagar", "Deolali", "Trimbakeshwar"
    ],
    sambhajinagar: [
      "Aurangabad Airport (IXU), Chikalthana", "Chhatrapati Sambhajinagar Railway Station", "CIDCO",
      "Waluj MIDC", "Kranti Chowk", "Beed Bypass", "Chikalthana", "Prozone Mall", "Ellora Caves", "Ajanta Caves"
    ],
    ahilyanagar: [
      "Ahilyanagar Railway Station", "Savedi", "MIDC Ahmednagar", "Station Road", "Maliwada", "Bhingar", "Shirdi Road"
    ],
    shirdi: [
      "Shirdi Sai Baba Temple", "Shirdi Airport (SAG), Kakadi", "Prasadalaya", "Sai Mandir Gate 1",
      "Shirdi Bus Stand", "Kopargaon"
    ],
    kolhapur: [
      "Kolhapur Railway Station", "Kolhapur Airport (KLH), Ujalaiwadi", "Mahalaxmi Temple", "Rankala Lake",
      "Rajarampuri", "Tarabai Park", "Panhala Fort", "Ichalkaranji"
    ],
    mahabaleshwar: [
      "Mahabaleshwar Market", "Venna Lake", "Mapro Garden", "Old Mahabaleshwar",
      "Panchgani", "Pratapgad Fort", "Arthur's Seat"
    ],
    lonavala: [
      "Lonavala Railway Station", "Khandala", "Tiger Point", "Bhushi Dam", "INS Shivaji",
      "Karla Caves", "Wet N Joy Water Park", "Kune Falls"
    ]
  };

  window.STBooking = {
    CONFIG, CITIES, CITY_GEO, ROUTES, ONEWAY_CARS, CAR_ORDER, LOCAL_SUGGESTIONS,
    inr, findRoute, cityName, getCarFare, planFare, waUrl,
    formatDate, formatTime, dateTimeDisplay,
    readFlow, writeFlow, updateFlow, loadFlow, buildUrl,
    readProfile, saveProfile, saveBooking, syncBookingToServer, newBookingId
  };
})();
