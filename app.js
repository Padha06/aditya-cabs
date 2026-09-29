/* ============================================================================
   SHIVRUDRA CABS - app.js
   ---------------------------------------------------------------------------
   ONE PLACE TO CHANGE THE CLIENT'S DETAILS: the CONFIG block below.
   Everything else (links, prefilled WhatsApp messages, footer) reads from it.
   ========================================================================= */

const CONFIG = {
  brand: "Shivrudra Taxi",
  phoneDisplay: "+91 86059 53737",
  phoneTel: "+918605953737",
  whatsapp: "918605953737",          // country code + number, digits only
  defaultMessage: "Hi Shivrudra Taxi, I would like to book a one-way cab. Please share availability and the fixed fare."
};

/* ---------------------------------------------------------------------------
   1. DATA
--------------------------------------------------------------------------- */

// x / y are hand-placed to match real Maharashtra geography (lng/lat projected).
const CITIES = {
  pune:          { name: "Pune",                        short: "Pune",            x: 421, y: 304, hub: true,  lx: 0,   ly: 30,  anchor: "middle" },
  mumbai:        { name: "Mumbai",                      short: "Mumbai",          x: 105, y: 220, hub: true,  lx: 17,  ly: 5,   anchor: "start"  },
  sambhajinagar: { name: "Chhatrapati Sambhajinagar",   short: "Sambhajinagar",   x: 901, y: 99,  hub: true,  lx: -17, ly: 5,   anchor: "end"    },
  nashik:        { name: "Nashik",                      short: "Nashik",          x: 400, y: 80,  hub: true,  lx: 0,   ly: 30,  anchor: "middle" },
  ahilyanagar:   { name: "Ahilyanagar (Ahmednagar)",    short: "Ahilyanagar",     x: 710, y: 217, hub: true,  lx: 17,  ly: 5,   anchor: "start"  },
  shirdi:        { name: "Shirdi",                      short: "Shirdi",          x: 621, y: 115, hub: false, lx: 0,   ly: -16, anchor: "middle" },
  mahabaleshwar: { name: "Mahabaleshwar",               short: "Mahabaleshwar",   x: 357, y: 395, hub: false, lx: 0,   ly: 30,  anchor: "middle" },
  kolhapur:      { name: "Kolhapur",                    short: "Kolhapur",        x: 546, y: 579, hub: false, lx: 0,   ly: -16, anchor: "middle" },
  lonavala:      { name: "Lonavala",                    short: "Lonavala",        x: 276, y: 269, hub: false, lx: 0,   ly: 28,  anchor: "middle" }
};

// Fixed one-way fares. Starting prices supplied by the client are marked.
// Every pair runs in BOTH directions at the same price.
const ROUTES = [
  { a: "pune",          b: "mumbai",        sedan: 2799, suv: 3199, km: 150, time: "3h 30m" }, // client price
  { a: "pune",          b: "sambhajinagar", sedan: 2799, suv: 3499, km: 235, time: "5h" },     // client price
  { a: "pune",          b: "nashik",        sedan: 3199, suv: 3799, km: 210, time: "4h 30m" }, // client price
  { a: "pune",          b: "ahilyanagar",   sedan: 1999, suv: 2699, km: 120, time: "2h 30m" }, // client price
  { a: "pune",          b: "shirdi",        sedan: 2999, suv: 3699, km: 185, time: "4h" },
  { a: "pune",          b: "lonavala",      sedan: 1499, suv: 1999, km: 65,  time: "1h 30m" },
  { a: "pune",          b: "mahabaleshwar", sedan: 2499, suv: 3199, km: 120, time: "3h" },
  { a: "pune",          b: "kolhapur",      sedan: 3499, suv: 4299, km: 230, time: "5h" },
  { a: "mumbai",        b: "sambhajinagar", sedan: 3999, suv: 4799, km: 340, time: "7h" },
  { a: "mumbai",        b: "nashik",        sedan: 2999, suv: 3699, km: 165, time: "3h 30m" },
  { a: "mumbai",        b: "shirdi",        sedan: 3999, suv: 4799, km: 240, time: "5h" },
  { a: "mumbai",        b: "ahilyanagar",   sedan: 3999, suv: 4799, km: 255, time: "5h 30m" },
  { a: "mumbai",        b: "lonavala",      sedan: 1799, suv: 2299, km: 85,  time: "2h" },
  { a: "mumbai", b: "mahabaleshwar", sedan: 3999, suv: 4799, km: 230, time: "4h 45m" }, // !! ESTIMATE - ask client to confirm
  { a: "sambhajinagar", b: "nashik",        sedan: 2999, suv: 3699, km: 180, time: "4h" },
  { a: "sambhajinagar", b: "shirdi",        sedan: 2199, suv: 2799, km: 110, time: "2h 30m" },
  { a: "nashik",        b: "shirdi",        sedan: 1999, suv: 2499, km: 90,  time: "2h" },
  { a: "ahilyanagar", b: "shirdi", sedan: 1999, suv: 2599, km: 85, time: "1h 50m" },   // !! ESTIMATE - ask client to confirm
];

const CAR_CLASSES = {
  sedan: { label: "Sedan", models: "Dzire / Aura / Etios" },
  suv:   { label: "SUV",   models: "Carens / Ertiga / Innova" }
};

// Destination photography, one image per city. Served from Wikimedia Commons,
// which allows stable direct URLs. Swap for the client's own photos in production.
const CITY_PHOTO = {
  pune:          "Shaniwar%20wada%20%28pune%29.jpg",
  mumbai:        "Mumbai%20Skyline%20Marine%20Drive%20Night.jpg",
  nashik:        "River%20Godavari%20Nashik%20-%20panoramio.jpg",
  sambhajinagar: "Ellora%20Caves%2C%20India%2C%20Kailasanatha%20Temple%202.jpg",
  ahilyanagar:   "Ahmednagar%20Fort%20Main%20Gate.jpg",
  shirdi:        "Samadhi%20Mandir%20of%20Shirdi%20Sai%20Baba.jpg",
  mahabaleshwar: "Picturesque%20-%20Mahabhaleshwar%20-%20Panchghani%20%285767643681%29.jpg",
  kolhapur:      "Mahalaxmi%20Temple%2C%20Kolhapur%2C%20Maharashtra%2009.jpg",
  lonavala:      "Karla%20caves%20Chaitya.jpg"
};
const cityPhoto = (id, w) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${CITY_PHOTO[id]}?width=${w || 720}`;

const NS = "http://www.w3.org/2000/svg";
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const inr = n => "\u20B9" + Number(n).toLocaleString("en-IN");
const routeKey = (a, b) => [a, b].sort().join("|");

function findRoute(a, b) {
  return ROUTES.find(r => (r.a === a && r.b === b) || (r.a === b && r.b === a)) || null;
}

/* ---------------------------------------------------------------------------
   2. CONTACT LINKS
--------------------------------------------------------------------------- */
function waUrl(message) {
  return `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
}

function wireContactLinks() {
  $$("[data-phone-link]").forEach(el => {
    el.setAttribute("href", "tel:" + CONFIG.phoneTel);
    if (el.textContent.includes("+91")) el.lastChild.nodeValue = " " + CONFIG.phoneDisplay;
  });
  $$("[data-wa-link]").forEach(el => el.setAttribute("href", waUrl(CONFIG.defaultMessage)));
}

/* ---------------------------------------------------------------------------
   3. BOOKING WIDGET (OneWay.Cab & MakeMyTrip Architecture)
--------------------------------------------------------------------------- */
const bookState = {
  from: "pune",
  to: "mumbai",
  fromName: "Pune",
  toName: "Mumbai",
  cls: "sedan",
  date: "",
  time: "08:00",
  urgent: false,
  selectedCar: "sedan",
  paymentMode: "advance", // 'advance' (₹500), 'full', 'cash'
  localCity: "pune",
  localPkg: "8h",
  localCls: "sedan",
  roundFrom: "pune",
  roundTo: "sambhajinagar",
  roundCls: "sedan",
  sharingRoute: "pune-sambhajinagar",
  sharingDrop: "shivajinagar",
  sharingSeats: 1
};

// 100+ Maharashtra Locations with Hub / Airport Tags & Alias Matching
const MH_LOCATIONS = [
  // --- PRIMARY TRANSIT HUBS & AIRPORTS ---
  { name: "Pune", id: "pune", tag: "Major Hub", aliases: ["pune", "poona", "shivajinagar", "swargate", "wakad", "hinjawadi", "viman nagar", "hadapsar", "kothrud", "baner", "chakan", "pcmc", "pimpri", "chinchwad", "bhosari", "talegaon", "kharadi", "magarpatta"] },
  { name: "Pune Airport (PNQ), Lohegaon", id: "pune", tag: "Airport", aliases: ["pune airport", "lohegaon", "pnq", "viman nagar airport"] },
  { name: "Mumbai (All MMR)", id: "mumbai", tag: "Metro Hub", aliases: ["mumbai", "bombay", "dadar", "borivali", "andheri", "bandra", "chembur", "kurla", "ghatkopar", "colaba", "cst", "mumbai central"] },
  { name: "Mumbai International Airport (CSMI - BOM T1/T2)", id: "mumbai", tag: "Airport", aliases: ["mumbai airport", "bom", "t1", "t2", "sahar", "santacruz", "domestic airport", "csmi"] },
  { name: "Thane, MMR", id: "mumbai", tag: "MMR", aliases: ["thane", "ghodbunder", "majiwada", "viviana", "wagle estate", "naupada"] },
  { name: "Navi Mumbai / Panvel", id: "mumbai", tag: "MMR", aliases: ["navi mumbai", "vashi", "nerul", "kharghar", "panvel", "belapur", "airoli", "ghansoli", "koparkhairane", "kamothe"] },
  { name: "Kalyan - Dombivli - Ulhasnagar", id: "mumbai", tag: "MMR", aliases: ["kalyan", "dombivli", "dombivali", "ulhasnagar", "titwala", "badlapur", "ambarnath"] },
  { name: "Vasai - Virar - Palghar", id: "mumbai", tag: "MMR", aliases: ["vasai", "virar", "palghar", "boisar", "dahanu", "naigaon", "nallasopara"] },
  { name: "Chhatrapati Sambhajinagar (Aurangabad)", id: "sambhajinagar", tag: "Major Hub", aliases: ["aurangabad", "sambhajinagar", "chhatrapati sambhajinagar", "cidco", "waluj", "beed bypass", "kranti chowk", "chikalthana", "prozone"] },
  { name: "Aurangabad Airport (Chhatrapati Sambhajinagar - IXU)", id: "sambhajinagar", tag: "Airport", aliases: ["aurangabad airport", "chikkalthana", "ixu", "sambhajinagar airport"] },
  { name: "Nashik", id: "nashik", tag: "Major Hub", aliases: ["nashik", "nasik", "panchavati", "cbs", "mumbai naka", "ambad", "satpur", "indira nagar", "college road", "gangapur road"] },
  { name: "Nashik Airport (Ozar - ISK)", id: "nashik", tag: "Airport", aliases: ["ozar airport", "nashik airport", "isk", "hal ozar"] },
  { name: "Ahilyanagar (Ahmednagar)", id: "ahilyanagar", tag: "Major Hub", aliases: ["ahilyanagar", "ahmednagar", "nagar", "savedi", "maliwada", "station road", "midc ahmednagar", "bhingar"] },
  { name: "Shirdi (Sai Baba Temple)", id: "shirdi", tag: "Temple Town", aliases: ["shirdi", "sai baba", "shirdi temple", "kopargaon", "rahata", "shirdi trust", "samadhi mandir"] },
  { name: "Shirdi International Airport (SAG), Kakadi", id: "shirdi", tag: "Airport", aliases: ["shirdi airport", "kakadi", "sag", "shirdi flight"] },

  // --- WESTERN MAHARASHTRA & HILL STATIONS ---
  { name: "Kolhapur City (Mahalaxmi Temple)", id: "kolhapur", tag: "Major Hub", aliases: ["kolhapur", "mahalaxmi", "tarabai park", "rajarampuri", "rankala", "panhala"] },
  { name: "Kolhapur Airport (KLH), Ujalaiwadi", id: "kolhapur", tag: "Airport", aliases: ["kolhapur airport", "klh", "ujalaiwadi"] },
  { name: "Ichalkaranji & Kagal", id: "kolhapur", tag: "Hub", aliases: ["ichalkaranji", "kagal", "jaysingpur", "gadhinglaj"] },
  { name: "Mahabaleshwar & Panchgani", id: "mahabaleshwar", tag: "Hill Station", aliases: ["mahabaleshwar", "panchgani", "venna lake", "mapro", "pratapgad", "old mahabaleshwar"] },
  { name: "Lonavala & Khandala", id: "lonavala", tag: "Getaway", aliases: ["lonavala", "khandala", "ins shivaji", "tiger point", "bushy dam", "wet n joy"] },
  { name: "Satara City & Karad", id: "pune", tag: "District", aliases: ["satara", "karad", "wai", "kaas plateau", "koregaon", "shirwal", "phaltan"] },
  { name: "Solapur (Pandharpur / Akkalkot)", id: "pune", tag: "District", aliases: ["solapur", "pandharpur", "akkalkot", "vithoba", "swami samarth", "barshi", "kurduvadi", "mohol"] },
  { name: "Sangli & Miraj", id: "kolhapur", tag: "District", aliases: ["sangli", "miraj", "madhavnagar", "islampur", "vita", "tasgaon"] },

  // --- KONKAN & COASTAL DESTINATIONS ---
  { name: "Alibaug & Kashid Beach", id: "mumbai", tag: "Coastal", aliases: ["alibaug", "kashid", "murud", "kihim", "nagaon", "mandwa", "revdanda"] },
  { name: "Karjat, Khopoli & Imagica", id: "mumbai", tag: "Getaway", aliases: ["karjat", "khopoli", "imagica", "matheran", "neral"] },
  { name: "Pen, Mangaon & Mahad", id: "mumbai", tag: "Konkan", aliases: ["pen", "mangaon", "mahad", "roha", "raigad fort"] },
  { name: "Ratnagiri & Chiplun", id: "kolhapur", tag: "Konkan", aliases: ["ratnagiri", "chiplun", "ganpatipule", "khed", "dapoli", "guhagar", "rajapur", "derwan"] },
  { name: "Sindhudurg (Malvan, Tarkarli & Sawantwadi)", id: "kolhapur", tag: "Konkan", aliases: ["sindhudurg", "malvan", "tarkarli", "sawantwadi", "kankavli", "vengurla", "kudal", "chipi airport", "sdw"] },

  // --- NORTH MAHARASHTRA & KHANDESH ---
  { name: "Jalgaon & Bhusawal", id: "sambhajinagar", tag: "District", aliases: ["jalgaon", "bhusawal", "chalisgaon", "amalner", "pachora", "deepnagar"] },
  { name: "Dhule & Shirpur", id: "nashik", tag: "District", aliases: ["dhule", "shirpur", "sakri", "sindkheda"] },
  { name: "Malegaon & Manmad", id: "nashik", tag: "Hub", aliases: ["malegaon", "manmad", "yeola", "chandwad", "satana"] },
  { name: "Nandurbar & Shahada", id: "nashik", tag: "District", aliases: ["nandurbar", "shahada", "navapur", "toranmal"] },
  { name: "Trimbakeshwar (Jyotirlinga)", id: "nashik", tag: "Temple Town", aliases: ["trimbakeshwar", "trambakeshwar", "brahmagiri"] },
  { name: "Igatpuri (Bhatsa / Vipassana)", id: "nashik", tag: "Hill Station", aliases: ["igatpuri", "ghoti", "kasara", "vipassana"] },
  { name: "Sangamner & Kopargaon", id: "ahilyanagar", tag: "Hub", aliases: ["sangamner", "kopargaon", "shrirampur", "newasa", "rahata"] },

  // --- MARATHWADA ---
  { name: "Jalna City", id: "sambhajinagar", tag: "District", aliases: ["jalna", "partur", "ambad", "bhokardan", "jafrabad"] },
  { name: "Beed & Parli Vaijnath (Jyotirlinga)", id: "ahilyanagar", tag: "District", aliases: ["beed", "parli", "parli vaijnath", "ambajogai", "majalgaon", "georai"] },
  { name: "Nanded (Hazur Sachkhand Sahib Gurudwara)", id: "sambhajinagar", tag: "District", aliases: ["nanded", "hazur sahib", "sachkhand", "degloor", "kinwat", "nanded airport", "ndc"] },
  { name: "Latur & Udgir", id: "sambhajinagar", tag: "District", aliases: ["latur", "udgir", "ausa", "nilanga", "ahmedpur"] },
  { name: "Dharashiv (Osmanabad) & Tuljapur Temple", id: "sambhajinagar", tag: "District", aliases: ["dharashiv", "osmanabad", "tuljapur", "bhavani mandir", "omerga"] },
  { name: "Parbhani & Gangakhed", id: "sambhajinagar", tag: "District", aliases: ["parbhani", "gangakhed", "jintur", "sailu"] },
  { name: "Hingoli & Aundha Nagnath (Jyotirlinga)", id: "sambhajinagar", tag: "District", aliases: ["hingoli", "aundha nagnath", "basmath", "kalamnuri"] },
  { name: "Ellora & Ajanta Caves (UNESCO World Heritage)", id: "sambhajinagar", tag: "Heritage", aliases: ["ellora", "ajanta", "grishneshwar", "kailasa temple", "khuldabad"] },

  // --- VIDARBHA ---
  { name: "Nagpur (Zero Mile / MIHAN)", id: "sambhajinagar", tag: "Major Hub", aliases: ["nagpur", "mihan", "sitabuldi", "dharampeth", "kamptee", "butibori", "ramtek"] },
  { name: "Nagpur Airport (Dr. Babasaheb Ambedkar - NAG)", id: "sambhajinagar", tag: "Airport", aliases: ["nagpur airport", "nag", "sonaebgaon"] },
  { name: "Amravati City & Badnera", id: "sambhajinagar", tag: "District", aliases: ["amravati", "badnera", "achlapur", "morshi", "melghat", "chikhaldara"] },
  { name: "Akola City", id: "sambhajinagar", tag: "District", aliases: ["akola", "akot", "murtizapur", "balapur"] },
  { name: "Buldhana & Shegaon (Gajanan Maharaj)", id: "sambhajinagar", tag: "District", aliases: ["buldhana", "shegaon", "gajanan maharaj", "khamgaon", "malkapur", "mehkar", "lonar"] },
  { name: "Wardha & Sevagram Ashram", id: "sambhajinagar", tag: "District", aliases: ["wardha", "sevagram", "hinganghat", "arvi"] },
  { name: "Yavatmal & Pusad", id: "sambhajinagar", tag: "District", aliases: ["yavatmal", "pusad", "umarkhed", "digras", "wani"] },
  { name: "Washim & Karanja Lad", id: "sambhajinagar", tag: "District", aliases: ["washim", "karanja", "risod", "mangrulpir"] },
  { name: "Chandrapur City & Tadoba National Park", id: "sambhajinagar", tag: "District", aliases: ["chandrapur", "tadoba", "ballarpur", "warora", "tiger reserve"] },
  { name: "Bhandara & Gondia", id: "sambhajinagar", tag: "District", aliases: ["bhandara", "gondia", "tumsar", "tirora"] },
  { name: "Gadchiroli", id: "sambhajinagar", tag: "District", aliases: ["gadchiroli", "chamorshi", "aheri"] },

  // --- POPULAR OUTSTATIONS ---
  { name: "Goa (North & South Goa / Mopa Airport GOX)", id: "kolhapur", tag: "Outstation", aliases: ["goa", "panaji", "calangute", "baga", "candolim", "mopa", "dabolim", "margao", "vasco"] },
  { name: "Surat, Gujarat", id: "mumbai", tag: "Interstate", aliases: ["surat", "vapi", "valsad", "navsari"] },
  { name: "Belgaum (Belagavi), Karnataka", id: "kolhapur", tag: "Interstate", aliases: ["belgaum", "belagavi", "hubli", "dharwad"] },
  { name: "Indore & Ujjain (Mahakaleshwar), MP", id: "nashik", tag: "Interstate", aliases: ["indore", "ujjain", "mahakal"] }
];

function buildSelects() {
  const opts = (selected) => Object.entries(CITIES)
    .map(([id, c]) => `<option value="${id}"${id === selected ? " selected" : ""}>${c.name}</option>`)
    .join("");

  const from = $("#from"), to = $("#to");
  if (from) from.innerHTML = opts(bookState.from);
  if (to) to.innerHTML = opts(bookState.to);

  const dateEl = $("#date");
  if (dateEl) {
    const t = new Date();
    dateEl.min = t.toISOString().slice(0, 10);
    t.setDate(t.getDate() + 1);
    dateEl.value = t.toISOString().slice(0, 10);
    bookState.date = dateEl.value;
  }
  const timeEl = $("#time");
  if (timeEl) bookState.time = timeEl.value || "08:00";

  const pInput = $("#pickupInput"), dInput = $("#dropInput");
  if (pInput && !pInput.value) pInput.value = CITIES[bookState.from] ? CITIES[bookState.from].name : "Pune";
  if (dInput && !dInput.value) dInput.value = CITIES[bookState.to] ? CITIES[bookState.to].name : "Mumbai";
}

function currentFare() {
  const r = findRoute(bookState.from, bookState.to);
  if (!r) {
    return bookState.cls === "suv" ? 3600 : 2800;
  }
  return bookState.cls === "suv" ? r.suv : r.sedan;
}

function renderFare(flash) {
  if (!$("#fareNum") || !$("#fareMeta")) return;
  const r = findRoute(bookState.from, bookState.to);
  const num = $("#fareNum"), meta = $("#fareMeta"), badge = $("#fareBadge"), fare = $("#fare");
  const err = $("#bookErr");

  if (badge) badge.textContent = CAR_CLASSES[bookState.cls].label;

  const fromName = bookState.fromName || (CITIES[bookState.from] ? CITIES[bookState.from].name : bookState.from);
  const toName = bookState.toName || (CITIES[bookState.to] ? CITIES[bookState.to].name : bookState.to);

  if (bookState.from === bookState.to && bookState.from !== "custom") {
    num.textContent = i18nT("Quote");
    meta.textContent = i18nT("Pick two different cities");
    if (err) { err.hidden = false; err.textContent = "Pickup and drop are the same city. Choose two different locations."; }
  } else if (!r) {
    const baseSedan = 2999;
    const customFare = bookState.cls === "suv" ? 3799 : baseSedan;
    num.textContent = `${Number(customFare).toLocaleString("en-IN")}*`;
    meta.textContent = `${fromName} to ${toName} · Custom Route (Instant Fixed Fare via WhatsApp)`;
    if (badge) badge.textContent = "Instant Quote";
    if (err) { err.hidden = true; err.textContent = ""; }
  } else {
    const newVal = Number(currentFare()).toLocaleString("en-IN");
    if (num.textContent !== newVal && num.textContent !== '0') {
      num.classList.add('is-out');
      setTimeout(() => {
        num.textContent = newVal;
        num.classList.remove('is-out');
        num.classList.add('is-in');
        requestAnimationFrame(() => requestAnimationFrame(() => num.classList.remove('is-in')));
      }, 180);
    } else {
      num.textContent = newVal;
    }
    meta.textContent = `${i18nCity(r.a)} ${i18nT("to")} ${i18nCity(r.b)} · ${r.km} ${i18nT("km")} · ${r.time}`;
    if (err) { err.hidden = true; err.textContent = ""; }
  }

  if (flash && fare) {
    fare.classList.remove("is-flash");
    void fare.offsetWidth;
    fare.classList.add("is-flash");
  }
  if (window._stickyUpdate) window._stickyUpdate();
}

function setRoute(a, b, cls, { scroll = false } = {}) {
  bookState.from = a;
  bookState.to = b;
  bookState.fromName = CITIES[a] ? CITIES[a].name : a;
  bookState.toName = CITIES[b] ? CITIES[b].name : b;
  if (cls) bookState.cls = cls;

  const pInput = $("#pickupInput"), dInput = $("#dropInput");
  if (pInput) pInput.value = bookState.fromName;
  if (dInput) dInput.value = bookState.toName;

  const from = $("#from"), to = $("#to");
  if (from) from.value = a;
  if (to) to.value = b;

  const radio = $(`input[name="cls"][value="${bookState.cls}"]`);
  if (radio) radio.checked = true;

  renderFare(true);
  if (scroll) {
    const booking = $("#booking");
    if (booking) {
      booking.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    }
  }
}
window._setRouteQuick = (from, to) => setRoute(from, to, "sedan", { scroll: true });

/* --- AUTOCOMPLETE COMPONENT --- */
function setupAutocomplete(inputId, dropdownId, onSelect) {
  const input = $(inputId);
  const dropdown = $(dropdownId);
  if (!input || !dropdown) return;

  function filterLocations(query) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return MH_LOCATIONS.slice(0, 10);
    return MH_LOCATIONS.filter(loc => {
      if (loc.name.toLowerCase().includes(q)) return true;
      return loc.aliases.some(alias => alias.includes(q));
    }).slice(0, 12);
  }

  function renderList(list, query) {
    const qClean = (query || "").trim();
    const q = qClean.toLowerCase();
    let html = "";

    if (list.length) {
      html += list.map(item => {
        let displayName = item.name;
        if (q && displayName.toLowerCase().includes(q)) {
          const idx = displayName.toLowerCase().indexOf(q);
          displayName = displayName.substring(0, idx) + `<mark>${displayName.substring(idx, idx + q.length)}</mark>` + displayName.substring(idx + q.length);
        }
        return `
          <div class="autocomplete-item" data-id="${item.id}" data-name="${item.name}">
            <span><b>${displayName}</b></span>
            <span class="autocomplete-tag">${item.tag}</span>
          </div>
        `;
      }).join("");
    }

    // Always offer custom typed location if user typed something
    if (qClean) {
      html += `
        <div class="autocomplete-item autocomplete-item--custom" data-id="custom" data-name="${qClean}">
          <span>✨ <b>Use "${qClean}"</b> <small style="color:var(--text-3)">(Any location in Maharashtra · 24x7 Dispatch)</small></span>
          <span class="autocomplete-tag" style="background:#FEF3C7;color:#B45309">Instant Quote</span>
        </div>
      `;
    }

    if (!html) {
      html = `<div class="autocomplete-item" style="color:var(--text-3);cursor:default"><span>Type any city or town in Maharashtra...</span></div>`;
    }

    dropdown.innerHTML = html;
    dropdown.classList.add("is-open");
  }

  input.addEventListener("focus", () => {
    renderList(filterLocations(input.value), input.value);
  });

  input.addEventListener("input", () => {
    renderList(filterLocations(input.value), input.value);
  });

  dropdown.addEventListener("click", e => {
    const item = e.target.closest(".autocomplete-item");
    if (!item || !item.dataset.id) return;
    input.value = item.dataset.name;
    dropdown.classList.remove("is-open");
    onSelect(item.dataset.id, item.dataset.name);
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = input.value.trim();
      if (val) {
        dropdown.classList.remove("is-open");
        onSelect("custom", val);
      }
    }
  });

  input.addEventListener("change", () => {
    const val = input.value.trim();
    if (val) {
      onSelect("custom", val);
    }
  });

  document.addEventListener("click", e => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("is-open");
    }
  });
}

/* --- TABS SWITCHER --- */
function initTabs() {
  const tabs = $$(".booktab");
  const panels = $$(".bookpanel");
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      panels.forEach(p => p.classList.remove("is-active"));

      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");

      const targetId = tab.getAttribute("aria-controls");
      const targetPanel = $("#" + targetId);
      if (targetPanel) targetPanel.classList.add("is-active");
    });
  });
}

/* --- FLEET SELECTION & PAYMENT MODAL --- */
function openFleetModal() {
  const modal = $("#fleetModal");
  if (!modal) return;

  const r = findRoute(bookState.from, bookState.to);
  const fromTitle = bookState.fromName || (CITIES[bookState.from] ? CITIES[bookState.from].name : bookState.from);
  const toTitle = bookState.toName || (CITIES[bookState.to] ? CITIES[bookState.to].name : bookState.to);
  const dist = r ? `${r.km} km · ~${r.time}` : "Intercity Route · 24x7 Driver Dispatch across Maharashtra";

  const titleEl = $("#fmodalTitle"), subEl = $("#fmodalSub");
  if (titleEl) titleEl.textContent = `${fromTitle} → ${toTitle}`;
  if (subEl) subEl.textContent = `${dist} · Doorstep Pickup & Drop`;

  const sedanPrice = r ? r.sedan : 2999;
  const suvPrice = r ? r.suv : 3799;
  const crystaPrice = r ? Math.round(r.suv * 1.25 / 100) * 100 : 4799;

  const pSedan = $("#mPriceSedan"), pSuv = $("#mPriceSuv"), pCrysta = $("#mPriceCrysta");
  if (pSedan) pSedan.textContent = inr(sedanPrice);
  if (pSuv) pSuv.textContent = inr(suvPrice);
  if (pCrysta) pCrysta.textContent = inr(crystaPrice);

  updateModalPayment(sedanPrice);

  modal.hidden = false;
  modal.classList.add("is-open");
  document.body.style.overflow = "hidden";
}

function closeFleetModal() {
  const modal = $("#fleetModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.hidden = true;
  document.body.style.overflow = "";
}

function updateModalPayment(totalFare) {
  const mode = bookState.paymentMode;
  const advEl = $("#mBreakAdvance"), balEl = $("#mBreakBalance");
  if (!advEl || !balEl) return;

  let advance = 500, balance = Math.max(0, totalFare - 500);
  if (mode === "full") {
    advance = totalFare;
    balance = 0;
  } else if (mode === "cash") {
    advance = 0;
    balance = totalFare;
  }
  advEl.textContent = inr(advance);
  balEl.textContent = inr(balance);
}

function getSelectedTotalFare() {
  const r = findRoute(bookState.from, bookState.to);
  const car = bookState.selectedCar;
  if (car === "crysta") return r ? Math.round(r.suv * 1.25 / 100) * 100 : 4299;
  if (car === "suv") return r ? r.suv : 3499;
  return r ? r.sedan : 2799;
}

function formatBookingWhatsAppMessage() {
  const from = bookState.fromName || i18nCity(bookState.from);
  const to = bookState.toName || i18nCity(bookState.to);
  const total = getSelectedTotalFare();
  const dateStr = bookState.date ? new Date(bookState.date + "T00:00:00").toLocaleDateString(i18nLocale(), { day: "numeric", month: "short", year: "numeric" }) : "Today / Asap";
  const timeStr = bookState.time || "08:00 AM";

  const carNames = {
    sedan: "Sedan (Dzire / Aura / Etios)",
    suv: "SUV Ertiga (6 Seater)",
    crysta: "Premium SUV Innova Crysta / Carens"
  };
  const payModes = {
    advance: "Pay ₹500 Advance & Rest to Driver at Drop",
    full: "Pay Full Online (100%)",
    cash: "Pay Full Cash/UPI to Driver After Drop"
  };

  const name = ($("#mCustName") && $("#mCustName").value.trim()) || "Customer";
  const phone = ($("#mCustPhone") && $("#mCustPhone").value.trim()) || "Not provided";
  const address = ($("#mCustAddress") && $("#mCustAddress").value.trim()) || "Doorstep Pickup";

  let advanceAmt = 500, balanceAmt = total - 500;
  if (bookState.paymentMode === "full") { advanceAmt = total; balanceAmt = 0; }
  else if (bookState.paymentMode === "cash") { advanceAmt = 0; balanceAmt = total; }

  return [
    `*NEW CAB BOOKING REQUEST - SHIVRUDRA TAXI*`,
    `──────────────────────────`,
    `📍 *Route:* ${from} ➔ ${to}`,
    `🗓️ *Date:* ${dateStr}`,
    `⏰ *Pickup Time:* ${timeStr} ${bookState.urgent ? "(⚡ URGENT DISPATCH)" : ""}`,
    `🚗 *Vehicle:* ${carNames[bookState.selectedCar] || "Sedan"}`,
    `💰 *Total Fare:* ₹${Number(total).toLocaleString("en-IN")} (All Tolls & Taxes Included)`,
    `💳 *Payment Option:* ${payModes[bookState.paymentMode]}`,
    `   • Advance Payable: ₹${Number(advanceAmt).toLocaleString("en-IN")}`,
    `   • Balance on Drop: ₹${Number(balanceAmt).toLocaleString("en-IN")}`,
    `──────────────────────────`,
    `👤 *Passenger Name:* ${name}`,
    `📱 *Contact Phone:* ${phone}`,
    `🏠 *Pickup Address:* ${address}`,
    `──────────────────────────`,
    `Please confirm the booking and dispatch driver details.`
  ].join("\n");
}

/* --- LOCAL PACKAGES LOGIC --- */
function initLocalPackage() {
  const city = $("#localCity"), cls = $('input[name="localCls"]'), pkgs = $('input[name="localPkg"]');
  const num = $("#localFareNum"), meta = $("#localFareMeta"), badge = $("#localFareBadge");
  const customWrap = $("#localCustomWrap");

  function recalc() {
    const pkgEl = $('input[name="localPkg"]:checked');
    const clsEl = $('input[name="localCls"]:checked');
    if (!pkgEl || !clsEl) return;
    const is12 = pkgEl.value === "12h";
    const isSuv = clsEl.value === "suv";
    bookState.localPkg = is12 ? "12h" : "8h";
    bookState.localCls = isSuv ? "suv" : "sedan";

    let fare = 2200;
    if (!is12 && !isSuv) fare = 2200;
    else if (!is12 && isSuv) fare = 2600;
    else if (is12 && !isSuv) fare = 2600;
    else if (is12 && isSuv) fare = 3000;

    if (num) num.textContent = Number(fare).toLocaleString("en-IN");
    if (badge) badge.textContent = isSuv ? "SUV" : "Sedan";
    if (meta) meta.textContent = is12 ? "12 Hours / 120 Km limit · Extra ₹12/km, ₹150/hr" : "8 Hours / 80 Km limit · Extra ₹12/km, ₹150/hr";

    const p8 = $("#pkg8Card"), p12 = $("#pkg12Card");
    if (p8) p8.classList.toggle("is-selected", !is12);
    if (p12) p12.classList.toggle("is-selected", is12);
  }

  if (city) {
    city.addEventListener("change", e => {
      bookState.localCity = e.target.value;
      if (customWrap) {
        customWrap.hidden = (e.target.value !== "custom");
        if (e.target.value === "custom") {
          const inp = $("#localCustomCity");
          if (inp) inp.focus();
        }
      }
    });
  }
  cls.forEach(c => c.addEventListener("change", recalc));
  pkgs.forEach(p => p.addEventListener("change", recalc));

  const bookBtn = $("#btnLocalBook");
  if (bookBtn) {
    bookBtn.addEventListener("click", () => {
      const citySel = $("#localCity");
      let cityName = citySel.options[citySel.selectedIndex].text;
      if (citySel.value === "custom") {
        const customInp = $("#localCustomCity");
        cityName = (customInp && customInp.value.trim()) || "Custom Maharashtra Location";
      }
      const pkgName = bookState.localPkg === "12h" ? "12 Hours / 120 Km" : "8 Hours / 80 Km";
      const carName = bookState.localCls === "suv" ? "SUV (Ertiga / Innova)" : "Sedan (Dzire / Aura)";
      const fare = $("#localFareNum") ? $("#localFareNum").textContent : "2,200";
      const dateVal = ($("#localDate") && $("#localDate").value) || "Today";
      const timeVal = ($("#localTime") && $("#localTime").value) || "09:00 AM";

      const msg = [
        `*LOCAL CAB PACKAGE BOOKING - SHIVRUDRA TAXI*`,
        `──────────────────────────`,
        `📍 *City:* ${cityName}`,
        `⏱️ *Package:* ${pkgName}`,
        `🚗 *Car Class:* ${carName}`,
        `💰 *Package Fare:* ₹${fare} (Extra ₹12/km, ₹150/hr)`,
        `🗓️ *Date:* ${dateVal} at ${timeVal}`,
        `──────────────────────────`,
        `Please confirm cab availability and driver details.`
      ].join("\n");

      window.open(waUrl(msg), "_blank", "noopener");
    });
  }
}

/* --- ROUND TRIP LOGIC --- */
function initRoundTrip() {
  const fromSel = $("#roundFrom"), toSel = $("#roundTo");
  const clsRadios = $('input[name="roundCls"]');
  const num = $("#roundFareNum"), meta = $("#roundFareMeta"), badge = $("#roundFareBadge");
  const fromCustomWrap = $("#roundFromCustomWrap"), toCustomWrap = $("#roundToCustomWrap");

  if (fromSel) {
    fromSel.addEventListener("change", e => {
      if (fromCustomWrap) {
        fromCustomWrap.hidden = (e.target.value !== "custom");
        if (e.target.value === "custom") {
          const inp = $("#roundFromCustom");
          if (inp) inp.focus();
        }
      }
    });
  }

  if (toSel) {
    toSel.addEventListener("change", e => {
      if (toCustomWrap) {
        toCustomWrap.hidden = (e.target.value !== "custom");
        if (e.target.value === "custom") {
          const inp = $("#roundToCustom");
          if (inp) inp.focus();
        }
      }
    });
  }

  function recalc() {
    const clsEl = $('input[name="roundCls"]:checked');
    if (!clsEl) return;
    const isErtiga = clsEl.value === "ertiga";
    const ratePerKm = isErtiga ? 14 : 12;
    const estKm = 500;
    const total = estKm * ratePerKm;

    if (num) num.textContent = Number(total).toLocaleString("en-IN");
    if (badge) badge.textContent = `₹${ratePerKm}/km`;
    if (meta) meta.textContent = `Estimated ${estKm} km return (2 days min 250 km/day) @ ₹${ratePerKm}/km`;
  }

  clsRadios.forEach(r => r.addEventListener("change", recalc));

  const btn = $("#btnRoundBook");
  if (btn) {
    btn.addEventListener("click", () => {
      let from = fromSel.options[fromSel.selectedIndex].text;
      if (fromSel.value === "custom") {
        const inp = $("#roundFromCustom");
        from = (inp && inp.value.trim()) || "Custom Pickup Location";
      }
      let to = toSel.options[toSel.selectedIndex].text;
      if (toSel.value === "custom") {
        const inp = $("#roundToCustom");
        to = (inp && inp.value.trim()) || "Custom Destination";
      }

      const clsEl = $('input[name="roundCls"]:checked');
      const isErtiga = clsEl && clsEl.value === "ertiga";
      const rate = isErtiga ? "₹14/km (SUV Ertiga)" : "₹12/km (Sedan Dzire/Aura)";
      const d1 = ($("#roundStart") && $("#roundStart").value) || "Departure Date";
      const d2 = ($("#roundReturn") && $("#roundReturn").value) || "Return Date";

      const msg = [
        `*ROUND TRIP CAB ENQUIRY - SHIVRUDRA TAXI*`,
        `──────────────────────────`,
        `📍 *Round Route:* ${from} ⇄ ${to}`,
        `🗓️ *Dates:* ${d1} to ${d2}`,
        `🚗 *Selected Rate:* ${rate}`,
        `💰 *Estimated Fare:* ₹${$("#roundFareNum").textContent} (Min 250 km/day)`,
        `──────────────────────────`,
        `Please confirm vehicle availability and driver allowance.`
      ].join("\n");

      window.open(waUrl(msg), "_blank", "noopener");
    });
  }
}

/* --- CAR SHARING (Special Routes & All Maharashtra) --- */
function initCarSharing() {
  const routeSel = $("#sharingRoute");
  const seatsSel = $("#sharingSeats");
  const optsWrap = $("#sharingDropOpts");
  const fareEl = $("#sharingTotalFare");
  const dateEl = $("#sharingDate");
  const customWrap = $("#sharingCustomWrap");
  const dropWrap = $("#sharingDropWrap");

  if (!routeSel || !optsWrap) return;

  if (dateEl) {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    dateEl.value = t.toISOString().slice(0, 10);
  }

  function recalc() {
    const route = routeSel.value;
    const seats = parseInt(seatsSel.value, 10) || 1;

    if (customWrap) customWrap.hidden = (route !== "custom");
    if (dropWrap) dropWrap.hidden = (route === "custom");

    if (route === "custom") {
      const estTotal = 800 * seats;
      if (fareEl) fareEl.textContent = `${Number(estTotal).toLocaleString("en-IN")}*`;
      return;
    }

    if (route === "pune-ahilyanagar") {
      optsWrap.innerHTML = `
        <label class="sharing-opt is-selected">
          <input type="radio" name="sharingDrop" value="home" checked hidden />
          <div>
            <b>Home Drop (Pune ⇄ Ahilyanagar)</b>
            <span>Direct doorstep delivery (Sedan - 3 passenger sharing)</span>
          </div>
          <div class="sharing-opt__price">₹600 <small style="font-size:.7rem;font-weight:400">/ seat</small></div>
        </label>
      `;
      const total = 600 * seats;
      if (fareEl) fareEl.textContent = Number(total).toLocaleString("en-IN");
    } else if (route === "pune-sambhajinagar") {
      const currentRadio = $('input[name="sharingDrop"]:checked');
      const currentSelected = currentRadio ? currentRadio.value : "shivajinagar";
      optsWrap.innerHTML = `
        <label class="sharing-opt ${currentSelected === 'shivajinagar' ? 'is-selected' : ''}">
          <input type="radio" name="sharingDrop" value="shivajinagar" ${currentSelected === 'shivajinagar' ? 'checked' : ''} hidden />
          <div>
            <b>Shivajinagar Drop</b>
            <span>Central hub drop point</span>
          </div>
          <div class="sharing-opt__price">₹1,000 <small style="font-size:.7rem;font-weight:400">/ seat</small></div>
        </label>
        <label class="sharing-opt ${currentSelected === 'home' ? 'is-selected' : ''}">
          <input type="radio" name="sharingDrop" value="home" ${currentSelected === 'home' ? 'checked' : ''} hidden />
          <div>
            <b>Home Drop</b>
            <span>Direct doorstep delivery</span>
          </div>
          <div class="sharing-opt__price">₹1,300 <small style="font-size:.7rem;font-weight:400">/ seat</small></div>
        </label>
      `;
      const perSeat = currentSelected === "home" ? 1300 : 1000;
      const total = perSeat * seats;
      if (fareEl) fareEl.textContent = Number(total).toLocaleString("en-IN");

      $(".sharing-opt").forEach(opt => {
        opt.addEventListener("click", () => {
          $(".sharing-opt").forEach(o => o.classList.remove("is-selected"));
          opt.classList.add("is-selected");
          opt.querySelector("input").checked = true;
          recalc();
        });
      });
    } else if (route === "sambhajinagar-shirdi") {
      optsWrap.innerHTML = `
        <label class="sharing-opt is-selected">
          <input type="radio" name="sharingDrop" value="standard" checked hidden />
          <div>
            <b>Shirdi / Sambhajinagar Doorstep Drop</b>
            <span>Comfortable AC sedan shared ride</span>
          </div>
          <div class="sharing-opt__price">₹600 <small style="font-size:.7rem;font-weight:400">/ seat</small></div>
        </label>
      `;
      const total = 600 * seats;
      if (fareEl) fareEl.textContent = Number(total).toLocaleString("en-IN");
    } else {
      optsWrap.innerHTML = `
        <label class="sharing-opt is-selected">
          <input type="radio" name="sharingDrop" value="standard" checked hidden />
          <div>
            <b>Express Hub Drop</b>
            <span>AC sedan (Max 3 co-passengers)</span>
          </div>
          <div class="sharing-opt__price">₹800 <small style="font-size:.7rem;font-weight:400">/ seat</small></div>
        </label>
      `;
      const total = 800 * seats;
      if (fareEl) fareEl.textContent = Number(total).toLocaleString("en-IN");
    }
  }

  routeSel.addEventListener("change", recalc);
  if (seatsSel) seatsSel.addEventListener("change", recalc);
  recalc();

  const shareBtn = $("#btnShareBook");
  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      let routeText = routeSel.options[routeSel.selectedIndex].text;
      if (routeSel.value === "custom") {
        const cFrom = ($("#sharingCustomFrom") && $("#sharingCustomFrom").value.trim()) || "Any Maharashtra Pickup";
        const cTo = ($("#sharingCustomTo") && $("#sharingCustomTo").value.trim()) || "Any Maharashtra Drop";
        routeText = `${cFrom} ⇄ ${cTo} (Custom Shared Route)`;
      }
      const seats = seatsSel.value;
      const dropRadio = $('input[name="sharingDrop"]:checked');
      const dropOpt = dropRadio ? dropRadio.value : "home";
      const dropLabel = routeSel.value === "custom" ? "Custom Drop" : (dropOpt === "home" ? "Home Drop" : "Hub Drop");
      const total = $("#sharingTotalFare").textContent;
      const dateVal = ($("#sharingDate") && $("#sharingDate").value) || "Tomorrow";

      const msg = [
        `*CAR SHARING BOOKING REQUEST - SHIVRUDRA TAXI*`,
        `──────────────────────────`,
        `📍 *Route:* ${routeText}`,
        `👥 *Passengers / Seats:* ${seats} Seat(s) (Max 3 passengers in Sedan)`,
        `🚪 *Drop Preference:* ${dropLabel}`,
        `💰 *Total Sharing Fare:* ₹${total}`,
        `🗓️ *Date:* ${dateVal}`,
        `──────────────────────────`,
        `Please confirm shared cab seat availability and pickup point.`
      ].join("\n");

      window.open(waUrl(msg), "_blank", "noopener");
    });
  }
}

/* --- URGENT EXIT INTENT MODAL --- */
function initUrgentModal() {
  const modal = $("#urgentModal");
  const closeBtn = $("#urgentClose");
  if (!modal) return;

  let triggered = false;
  document.addEventListener("mouseleave", e => {
    if (e.clientY <= 0 && !triggered && !sessionStorage.getItem("urgent_shown")) {
      triggered = true;
      sessionStorage.setItem("urgent_shown", "1");
      modal.hidden = false;
      modal.classList.add("is-open");
    }
  });

  if (closeBtn) closeBtn.addEventListener("click", () => {
    modal.classList.remove("is-open");
    modal.hidden = true;
  });
}

function initBooking() {
  if (!$("#booking")) return;
  buildSelects();
  renderFare(false);
  initTabs();

  // Setup Autocomplete
  setupAutocomplete("#pickupInput", "#pickupDropdown", (id, name) => {
    bookState.from = id;
    bookState.fromName = name;
    const fromSel = $("#from");
    if (fromSel) fromSel.value = id;
    renderFare(true);
  });

  setupAutocomplete("#dropInput", "#dropDropdown", (id, name) => {
    bookState.to = id;
    bookState.toName = name;
    const toSel = $("#to");
    if (toSel) toSel.value = id;
    renderFare(true);
  });

  // Swap button
  const swapBtn = $("#swap");
  if (swapBtn) {
    swapBtn.addEventListener("click", () => {
      const prevFromId = bookState.from, prevFromName = bookState.fromName;
      const prevToId = bookState.to, prevToName = bookState.toName;

      bookState.from = prevToId;
      bookState.fromName = prevToName;
      bookState.to = prevFromId;
      bookState.toName = prevFromName;

      const pIn = $("#pickupInput"), dIn = $("#dropInput");
      if (pIn) pIn.value = bookState.fromName;
      if (dIn) dIn.value = bookState.toName;

      const fromSel = $("#from"), toSel = $("#to");
      if (fromSel) fromSel.value = bookState.from;
      if (toSel) toSel.value = bookState.to;

      renderFare(true);
    });
  }

  // Radio car class change
  $$('input[name="cls"]').forEach(r => r.addEventListener("change", e => {
    bookState.cls = e.target.value;
    bookState.selectedCar = e.target.value;
    renderFare(true);
  }));

  // Date and Time
  const dateInput = $("#date");
  if (dateInput) dateInput.addEventListener("change", e => { bookState.date = e.target.value; });
  const timeInput = $("#time");
  if (timeInput) timeInput.addEventListener("change", e => { bookState.time = e.target.value; });
  const urgentChk = $("#urgentBookingCheck");
  if (urgentChk) urgentChk.addEventListener("change", e => { bookState.urgent = e.target.checked; });

  // CHECK FARE BUTTON -> Opens Fleet & Payment Modal!
  const btnCheckFare = $("#btnCheckFare");
  if (btnCheckFare) {
    btnCheckFare.addEventListener("click", () => {
      if (bookState.from === bookState.to) {
        const err = $("#bookErr");
        if (err) { err.hidden = false; err.textContent = "Pickup and drop locations cannot be the same. Please choose two different locations."; }
        return;
      }
      openFleetModal();
    });
  }

  // MODAL LOGIC
  const modalClose = $("#fmodalClose");
  if (modalClose) modalClose.addEventListener("click", closeFleetModal);

  // Modal Car Selection
  $$(".fmodal-car").forEach(carCard => {
    carCard.addEventListener("click", () => {
      $$(".fmodal-car").forEach(c => c.classList.remove("is-selected"));
      carCard.classList.add("is-selected");
      bookState.selectedCar = carCard.dataset.car;
      updateModalPayment(getSelectedTotalFare());
    });
  });

  // Modal Payment Options Selection (Requirement #1)
  $$('input[name="modalPayment"]').forEach(r => {
    r.addEventListener("change", e => {
      bookState.paymentMode = e.target.value;
      $$(".fmodal-pay-opt").forEach(opt => opt.classList.remove("is-selected"));
      e.target.closest(".fmodal-pay-opt").classList.add("is-selected");
      updateModalPayment(getSelectedTotalFare());
    });
  });

  // Modal WhatsApp Booking Confirmation
  const confirmWa = $("#mConfirmWa");
  if (confirmWa) {
    confirmWa.addEventListener("click", () => {
      const msg = formatBookingWhatsAppMessage();
      window.open(waUrl(msg), "_blank", "noopener");
      closeFleetModal();
    });
  }

  // Initialize other tabs
  initLocalPackage();
  initRoundTrip();
  initCarSharing();
  initUrgentModal();
}

/* ---------------------------------------------------------------------------
   4. ROUTE CARDS + FILTERS
--------------------------------------------------------------------------- */
let activeFilter = "all";

function cardDirection(r) {
  if (activeFilter !== "all" && (r.a === activeFilter || r.b === activeFilter)) {
    const other = r.a === activeFilter ? r.b : r.a;
    return { from: activeFilter, to: other };
  }
  return { from: r.a, to: r.b };
}

function renderCards() {
  const host = $("#routeCards");
  if (!host) return;
  const list = ROUTES.filter(r => activeFilter === "all" || r.a === activeFilter || r.b === activeFilter);

  host.innerHTML = list.map(r => {
    const d = cardDirection(r);
    const key = routeKey(r.a, r.b);
    return `
      <article class="rcard" data-route="${key}">
        <div class="rcard__dir">
          <span>${i18nCity(d.from)}</span>
          <svg class="ic" aria-hidden="true"><use href="#i-arrow"/></svg>
          <span>${i18nCity(d.to)}</span>
        </div>
        <div class="rcard__meta">${r.km} ${i18nT("km")} &middot; ${r.time} &middot; ${i18nT("both directions")}</div>
        <div class="rcard__prices">
          <div class="rp"><b>${inr(r.sedan)}</b><span>Sedan</span></div>
          <div class="rp"><b>${inr(r.suv)}</b><span>SUV</span></div>
        </div>
        <button class="rcard__book" type="button" data-book="${d.from}|${d.to}">
          <svg class="ic" aria-hidden="true"><use href="#i-wa"/></svg> Book this route
        </button>
      </article>`;
  }).join("");

  $$(".rcard__book", host).forEach(btn => {
    btn.addEventListener("click", () => {
      const [a, b] = btn.dataset.book.split("|");
      setRoute(a, b, bookState.cls, { scroll: true });
    });
  });

  $$(".rcard", host).forEach(card => {
    card.addEventListener("mouseenter", () => setHot(card.dataset.route));
    card.addEventListener("mouseleave", () => setHot(null));
    card.addEventListener("focusin", () => setHot(card.dataset.route));
    card.addEventListener("focusout", () => setHot(null));
  });
}

function initFilters() {
  $$("#filters .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      activeFilter = chip.dataset.filter;
      $$("#filters .chip").forEach(c => {
        const on = c === chip;
        c.classList.toggle("is-on", on);
        c.setAttribute("aria-pressed", String(on));
      });
      renderCards();
      setHot(null);
    });
  });
}

// Footer route links (the standalone SEO landing pages in production) load the
// matching direction straight into the booking widget.
function initRouteLinks() {
  if (!$("#bookform")) return;
  $$("[data-route-link]").forEach(a => {
    a.addEventListener("click", e => {
      const [a1, b1] = a.dataset.routeLink.split("|");
      e.preventDefault();
      setRoute(a1, b1, bookState.cls, { scroll: true });
    });
  });
}

function translateFooterLinks() {
  $$("[data-route-link]").forEach(a => {
    const [x, y] = a.dataset.routeLink.split("|");
    const nbsp = String.fromCharCode(160);
    a.textContent = `${i18nCity(x)} ${i18nT("to")} ${i18nCity(y)}${nbsp}${i18nT("cab")}`;
  });
  $$("[data-i18n-route]").forEach(a => {
    const [x, y] = a.dataset.i18nRoute.split("|");
    a.textContent = `${i18nCity(x)} ${i18nT("to")} ${i18nCity(y)} ${i18nT("cab")}`;
  });
  $$("[data-i18n-city]").forEach(el => {
    el.textContent = i18nCity(el.dataset.i18nCity);
  });
}

// Route pages have a generated H1 like "Cab from Pune to Nashik".
// Translate it by matching city display names back to IDs.
function translateRouteH1() {
  const h1 = document.querySelector("h1.hero__h1");
  if (!h1) return;
  if (!h1.dataset.orig) h1.dataset.orig = h1.textContent;
  const m = h1.dataset.orig.trim().match(/^Cab from (.+) to (.+)$/);
  if (!m) return;
  const findId = name => {
    const key = name.toLowerCase().trim();
    return Object.keys(CITIES).find(id =>
      CITIES[id].name.toLowerCase() === key ||
      CITIES[id].short.toLowerCase() === key
    );
  };
  const a = findId(m[1]), b = findId(m[2]);
  if (!a || !b) return;
  if (typeof currentLang !== "undefined" && currentLang === "mr") {
    h1.textContent = `${i18nCity(a)} ${i18nT("to")} ${i18nCity(b)} ${i18nT("cab")}`;
  } else {
    h1.textContent = h1.dataset.orig;
  }
}

// Route detail copy ships in data-en / data-mr so both languages are static
// in the generated HTML; this only swaps which one is on screen.
function translateRouteDetail() {
  const sec = document.querySelector(".rdetail");
  if (!sec) return;
  const lang = (typeof currentLang !== "undefined" && currentLang === "mr") ? "mr" : "en";
  $$("[data-rd]", sec).forEach(el => {
    const v = el.getAttribute("data-" + lang);
    if (v != null) el.textContent = v;
  });
}

/* ---------------------------------------------------------------------------
   5. ROUTE MAP
--------------------------------------------------------------------------- */
function arcPath(a, b) {
  const A = CITIES[a], B = CITIES[b];
  const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
  const dx = B.x - A.x, dy = B.y - A.y;
  const len = Math.hypot(dx, dy) || 1;
  const bow = Math.min(64, len * 0.15);
  const cx = mx + (-dy / len) * bow;
  const cy = my + (dx / len) * bow;
  return `M${A.x} ${A.y} Q${cx} ${cy} ${B.x} ${B.y}`;
}

function svgEl(tag, attrs) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function buildMap() {
  const arcs = $("#mapArcs"), nodes = $("#mapNodes");
  if (!arcs || !nodes) return;

  ROUTES.forEach(r => {
    arcs.appendChild(svgEl("path", { d: arcPath(r.a, r.b), class: "map__arc", "data-route": routeKey(r.a, r.b) }));
  });

  Object.entries(CITIES).forEach(([id, c]) => {
    const g = svgEl("g", { class: "map__node" + (c.hub ? " hub" : ""), "data-city": id, tabindex: "0", role: "button", "aria-label": c.name });
    g.appendChild(svgEl("circle", { cx: c.x, cy: c.y, r: 26, fill: "#FDFCFA", "fill-opacity": "0", class: "hit" }));
    g.appendChild(svgEl("circle", { cx: c.x, cy: c.y, r: c.hub ? 17 : 12, class: "halo" }));
    if (c.hub) g.appendChild(svgEl("circle", { cx: c.x, cy: c.y, r: 9, class: "halo pulse" }));
    g.appendChild(svgEl("circle", { cx: c.x, cy: c.y, r: c.hub ? 7 : 5.5 }));
    const t = svgEl("text", { x: c.x + c.lx, y: c.y + c.ly, "text-anchor": c.anchor, "dominant-baseline": "middle" });
    t.textContent = c.short;
    g.appendChild(t);

    g.addEventListener("mouseenter", () => setHot(null, id));
    g.addEventListener("mouseleave", () => setHot(null));
    g.addEventListener("focus", () => setHot(null, id));
    g.addEventListener("blur", () => setHot(null));
    g.addEventListener("click", () => {
      activeFilter = id;
      $$("#filters .chip").forEach(ch => {
        const on = ch.dataset.filter === id;
        ch.classList.toggle("is-on", on);
        ch.setAttribute("aria-pressed", String(on));
      });
      renderCards();
      setHot(null, id);
    });
    g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); g.dispatchEvent(new Event("click")); } });

    nodes.appendChild(g);
  });
}

// Highlight arcs + nodes. Pass a route key, or a city id, or null to clear.
function setHot(key, cityId) {
  $$("#mapArcs .map__arc").forEach(p => {
    const match = key ? p.dataset.route === key : false;
    p.classList.toggle("is-hot", match);
  });

  $$("#mapNodes .map__node").forEach(n => {
    let on = false;
    if (cityId) {
      on = n.dataset.city === cityId || (key === null && false);
    }
    if (key) {
      const [a, b] = key.split("|");
      on = on || n.dataset.city === a || n.dataset.city === b;
    }
    n.classList.toggle("is-hot", on);
  });

  $$(".rcard").forEach(c => {
    const match = key ? c.dataset.route === key : false;
    c.classList.toggle("is-hot", match);
  });
}

/* ---------------------------------------------------------------------------
   6. NAV, MENU, REVEALS, COUNTERS
--------------------------------------------------------------------------- */
function initNav() {
  const nav = $("#nav");
  const sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:80px;pointer-events:none";
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => nav.classList.toggle("is-stuck", !e.isIntersecting), { threshold: 0 }).observe(sentinel);

  // Floating CTAs stay out of the way while the hero (which has its own CTAs) is on screen.
  const hero = $(".hero"), floaters = $(".floaters");
  if (hero && floaters) {
    floaters.classList.add("is-hidden");
    new IntersectionObserver(([e]) => floaters.classList.toggle("is-hidden", e.isIntersecting), { threshold: 0 }).observe(hero);
  }

  const burger = $("#burger"), menu = $("#mobilemenu");
  const close = () => { menu.hidden = true; burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Open menu"); document.body.style.overflow = ""; };
  burger.addEventListener("click", () => {
    const open = burger.getAttribute("aria-expanded") === "true";
    if (open) { close(); } else { menu.hidden = false; burger.setAttribute("aria-expanded", "true"); burger.setAttribute("aria-label", "Close menu"); document.body.style.overflow = "hidden"; }
  });
  $$("a", menu).forEach(a => a.addEventListener("click", close));
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  matchMedia("(min-width: 1081px)").addEventListener("change", e => { if (e.matches) close(); });
}

function initReveals() {
  const els = $$("[data-reveal]");
  if (!els.length) return;
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-in"); obs.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  els.forEach(el => io.observe(el));
}

function initCounters() {
  const els = $$("[data-count]");
  if (!els.length) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const run = el => {
    const target = parseFloat(el.dataset.count) || 0;
    const suffix = el.dataset.suffix || "";
    const divide = parseFloat(el.dataset.divide) || 1;
    const finish = v => (divide > 1 ? (v / divide).toFixed(1) : Math.round(v).toLocaleString("en-IN")) + suffix;

    if (reduce) { el.textContent = finish(target); return; }

    const dur = 1500, t0 = performance.now();
    const frame = t => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = finish(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => { if (e.isIntersecting) { run(e.target); obs.unobserve(e.target); } });
  }, { threshold: 0.4 });
  els.forEach(el => io.observe(el));
}

/* ---------------------------------------------------------------------------
   7. THREE.JS HERO - night expressway, light streaks, moving road markings
--------------------------------------------------------------------------- */
let heroProgress = 0;

function initHero() {
  const canvas = $("#hero-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (err) { return; }

  const isSmall = innerWidth < 760;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isSmall ? 1.5 : 1.75));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07080B, 0.0062);

  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 900);
  camera.position.set(0, 2.7, 9);

  const world = new THREE.Group();
  scene.add(world);

  /* --- road --- */
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(38, 1000),
    new THREE.MeshBasicMaterial({ color: 0x0A0D12 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -0.02, -470);
  world.add(road);

  /* --- warm reflection down the tarmac --- */
  const gc = document.createElement("canvas");
  gc.width = 64; gc.height = 512;
  const gx = gc.getContext("2d");
  const grad = gx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, "rgba(245,165,36,0)");
  grad.addColorStop(0.55, "rgba(245,165,36,0.55)");
  grad.addColorStop(1, "rgba(245,165,36,0)");
  gx.fillStyle = grad; gx.fillRect(0, 0, 64, 512);
  const glowTex = new THREE.CanvasTexture(gc);
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 760),
    new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: isSmall ? 0.46 : 0.32 })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(0, 0.01, -420);
  world.add(glow);

  /* --- horizon glow --- */
  const rc = document.createElement("canvas");
  rc.width = rc.height = 256;
  const rx = rc.getContext("2d");
  const rg = rx.createRadialGradient(128, 128, 0, 128, 128, 128);
  rg.addColorStop(0, "rgba(255,178,64,0.9)");
  rg.addColorStop(0.4, "rgba(255,138,61,0.32)");
  rg.addColorStop(1, "rgba(255,138,61,0)");
  rx.fillStyle = rg; rx.fillRect(0, 0, 256, 256);
  const horizon = new THREE.Sprite(new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(rc), transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false, depthTest: false, opacity: 0.85
  }));
  horizon.scale.set(300, 110, 1);
  horizon.position.set(0, 9, -600);
  scene.add(horizon);

  /* --- light streaks (traffic) --- */
  // small screens get more, brighter and slightly fatter streaks so the
  // expressway still reads once the scrim is lifted on mobile
  const COUNT = isSmall ? 215 : 260;
  const streakGeo = new THREE.BoxGeometry(1, 1, 1);
  const streakMat = new THREE.MeshBasicMaterial({
    transparent: true, opacity: isSmall ? 1 : 0.92, blending: THREE.AdditiveBlending, depthWrite: false
  });
  const streaks = new THREE.InstancedMesh(streakGeo, streakMat, COUNT);
  streaks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  streaks.frustumCulled = false;
  world.add(streaks);

  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  const BASE = 96;
  const parts = [];

  const resetStreak = (p, initial) => {
    p.side = Math.random() < 0.5 ? -1 : 1;
    p.x = p.side * (2.8 + Math.random() * 9.5);
    p.y = 0.2 + Math.random() * 1.6;
    p.z = initial ? -Math.random() * 560 : -560 - Math.random() * 90;
    p.len = 3 + Math.random() * 17;
    p.w = (isSmall ? 0.07 : 0.05) + Math.random() * (isSmall ? 0.11 : 0.09);
    p.speed = BASE * (0.7 + Math.random() * 0.75);
    if (p.side < 0) { p.r = 1; p.g = 0.8 + Math.random() * 0.2; p.b = 0.5 + Math.random() * 0.35; }
    else            { p.r = 1; p.g = 0.26 + Math.random() * 0.2; p.b = 0.1 + Math.random() * 0.12; }
  };

  for (let i = 0; i < COUNT; i++) { const p = {}; resetStreak(p, true); parts.push(p); }

  /* --- lane markings --- */
  const MCOUNT = isSmall ? 44 : 76;
  const marks = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0xE6DFCF, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false }),
    MCOUNT
  );
  marks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  marks.frustumCulled = false;
  world.add(marks);

  const mLanes = [-3.4, 0, 3.4];
  const mParts = [];
  const resetMark = (p, initial) => {
    p.x = mLanes[Math.floor(Math.random() * mLanes.length)];
    p.z = initial ? -Math.random() * 620 : -620 - Math.random() * 40;
    p.speed = BASE;
  };
  for (let i = 0; i < MCOUNT; i++) { const p = {}; resetMark(p, true); mParts.push(p); }

  /* --- dust field --- */
  const DCOUNT = isSmall ? 180 : 380;
  const dPos = new Float32Array(DCOUNT * 3);
  for (let i = 0; i < DCOUNT; i++) {
    dPos[i * 3] = (Math.random() - 0.5) * 90;
    dPos[i * 3 + 1] = Math.random() * 34 - 3;
    dPos[i * 3 + 2] = -Math.random() * 620;
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({
    color: 0xFFD9A0, size: 0.16, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  }));
  world.add(dust);

  /* --- pointer parallax --- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", e => {
    pointer.tx = (e.clientX / innerWidth - 0.5) * 2;
    pointer.ty = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  /* --- sizing --- */
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  addEventListener("resize", resize, { passive: true });

  /* --- render loop --- */
  let visible = true, running = false, last = performance.now();

  const drawFrame = () => {
    dummy.position.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
    for (let i = 0; i < COUNT; i++) {
      const p = parts[i];
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(p.w, p.w, p.len);
      dummy.updateMatrix();
      streaks.setMatrixAt(i, dummy.matrix);
      streaks.setColorAt(i, col.setRGB(p.r, p.g, p.b));
    }
    streaks.instanceMatrix.needsUpdate = true;
    if (streaks.instanceColor) streaks.instanceColor.needsUpdate = true;

    for (let i = 0; i < MCOUNT; i++) {
      const p = mParts[i];
      dummy.position.set(p.x, 0.02, p.z);
      dummy.scale.set(0.13, 0.01, 2.6);
      dummy.updateMatrix();
      marks.setMatrixAt(i, dummy.matrix);
    }
    marks.instanceMatrix.needsUpdate = true;

    // camera drift + scroll dolly
    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;
    const dolly = heroProgress * 16;
    camera.position.x = pointer.x * 1.7;
    camera.position.y = 2.7 - pointer.y * 0.55 + heroProgress * 2.2;
    camera.position.z = 9 - dolly;
    camera.lookAt(pointer.x * 1.1, 1.5 - heroProgress * 1.2, -70);
    horizon.position.x = pointer.x * 3;

    renderer.render(scene, camera);
  };

  const step = () => {
    if (!running) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    for (let i = 0; i < COUNT; i++) {
      const p = parts[i];
      p.z += p.speed * dt * (1 + heroProgress * 0.8);
      if (p.z > 15) resetStreak(p, false);
    }
    for (let i = 0; i < MCOUNT; i++) {
      const p = mParts[i];
      p.z += p.speed * dt * (1 + heroProgress * 0.8);
      if (p.z > 15) resetMark(p, false);
    }
    const pos = dust.geometry.attributes.position;
    for (let i = 0; i < DCOUNT; i++) {
      let z = pos.getZ(i) + BASE * 0.55 * dt;
      if (z > 15) z = -620;
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;

    drawFrame();
    requestAnimationFrame(step);
  };

  const start = () => { if (!running && visible && !reduce) { running = true; last = performance.now(); requestAnimationFrame(step); } };
  const stop = () => { running = false; };

  if (reduce) {
    drawFrame();                       // one static frame, no motion
  } else {
    drawFrame();
    start();
  }

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }, { threshold: 0 })
    .observe(canvas);
  document.addEventListener("visibilitychange", () => { document.hidden ? stop() : start(); });

  canvas.addEventListener("webglcontextlost", e => { e.preventDefault(); stop(); });
}

/* ---------------------------------------------------------------------------
   8. POOL AND SAVE  (shared one-way cabs)
   ---------------------------------------------------------------------------
   Demo behaviour, no backend:
   - seed listings always use dates relative to today, so the board never looks stale
   - a posted trip is stored in localStorage and shows up instantly
   - matching = same route (either direction) + same date
   - contact is deliberately admin-mediated: "Request seat" opens WhatsApp to the
     office, never to the traveller. Swap this for masked calling in production.
--------------------------------------------------------------------------- */
const POOL_KEY = "aditya.pools.v1";

const isoIn = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

const POOL_SEED = [
  { id: "s1", from: "pune",   to: "mumbai",        date: isoIn(2), time: "06:30", cls: "suv",   seats: 2, name: "Rohit Deshmukh",  verified: true },
  { id: "s2", from: "pune",   to: "mumbai",        date: isoIn(2), time: "07:00", cls: "suv",   seats: 1, name: "Aarti Nair",      verified: true },
  { id: "s3", from: "pune",   to: "shirdi",        date: isoIn(3), time: "05:00", cls: "sedan", seats: 2, name: "Sameer Kulkarni", verified: true },
  { id: "s4", from: "mumbai", to: "pune",          date: isoIn(1), time: "18:30", cls: "sedan", seats: 1, name: "Nikhil Joshi",    verified: true },
  { id: "s5", from: "pune",   to: "nashik",        date: isoIn(4), time: "08:00", cls: "sedan", seats: 2, name: "Farhan Shaikh",   verified: true },
  { id: "s6", from: "mumbai", to: "sambhajinagar", date: isoIn(5), time: "21:00", cls: "suv",   seats: 2, name: "Meera Iyer",      verified: true },
  { id: "s7", from: "pune",   to: "kolhapur",      date: isoIn(6), time: "07:30", cls: "sedan", seats: 1, name: "Aditya Rane",     verified: true },
  { id: "s8", from: "nashik", to: "pune",          date: isoIn(2), time: "17:00", cls: "sedan", seats: 2, name: "Pooja Bhosale",   verified: true }
];

let poolPosts = [];

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function poolFullFare(p) {
  const r = findRoute(p.from, p.to);
  if (!r) return null;
  return p.cls === "suv" ? r.suv : r.sedan;
}
function poolPerPerson(p) {
  const f = poolFullFare(p);
  return f == null ? null : Math.round(f / 2 / 10) * 10;
}
function poolRouteKey(p) { return routeKey(p.from, p.to) + "@" + p.date; }

function fmtTime(t) {
  const [h, m] = String(t).split(":").map(Number);
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function fmtDate(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString(i18nLocale(), { day: "numeric", month: "short", year: "numeric" });
}
function initials(name) {
  const p = String(name).trim().split(/\s+/);
  return ((p[0] || " ")[0] + ((p[1] || " ")[0] || "")).toUpperCase().trim();
}
function avatarBg(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `linear-gradient(140deg,hsl(${h} 68% 64%),hsl(${(h + 42) % 360} 70% 48%))`;
}

function loadMine() {
  try { const raw = localStorage.getItem(POOL_KEY); const a = raw ? JSON.parse(raw) : []; return Array.isArray(a) ? a : []; }
  catch (e) { return []; }
}
function saveMine() {
  try { localStorage.setItem(POOL_KEY, JSON.stringify(poolPosts.filter(p => p.mine))); } catch (e) { /* private mode */ }
}

function poolMessage(p) {
  return [
    `Hi ${CONFIG.brand}, I would like to post a shared cab trip.`,
    ``,
    `Route: ${i18nCity(p.from)} ${i18nT("to")} ${i18nCity(p.to)}`,
    `Date: ${fmtDate(p.date)}`,
    `Pickup time: ${fmtTime(p.time)}`,
    `Car: ${CAR_CLASSES[p.cls].label}`,
    `Seats needed: ${p.seats}`,
    `Name: ${p.name}`,
    ``,
    `Please confirm my seat and connect me with a co-traveller.`
  ].join("\n");
}

function joinMessage(p) {
  const per = poolPerPerson(p);
  return [
    `Hi ${CONFIG.brand}, I would like to join a shared cab.`,
    ``,
    `Route: ${i18nCity(p.from)} ${i18nT("to")} ${i18nCity(p.to)}`,
    `Date: ${fmtDate(p.date)}`,
    `Pickup time: ${fmtTime(p.time)}`,
    `Car: ${CAR_CLASSES[p.cls].label}`,
    `Traveller: ${p.name}`,
    `Fare share shown: ${per != null ? inr(per) + " each" : "please quote"}`,
    ``,
    `Please connect me with this traveller and confirm the seat.`
  ].join("\n");
}

function renderPoolBoard() {
  const host = $("#poolList");
  if (!host) return;

  poolPosts.sort((a, b) =>
    (b.mine ? 1 : 0) - (a.mine ? 1 : 0) || (a.date + a.time).localeCompare(b.date + b.time));

  const tally = {};
  poolPosts.forEach(p => { const k = poolRouteKey(p); tally[k] = (tally[k] || 0) + 1; });
  const matched = new Set(Object.keys(tally).filter(k => tally[k] >= 2));

  const countEl = $("#poolCount");
  if (countEl) countEl.textContent = poolPosts.length + " " + i18nT("trips posted");

  if (!poolPosts.length) {
    host.innerHTML = '<p class="prowlist__empty">' + i18nT("No trips posted yet. Be the first on this route.") + '</p>';
    return;
  }

  host.innerHTML = poolPosts.map(p => {
    const per = poolPerPerson(p), full = poolFullFare(p);
    const isMatch = matched.has(poolRouteKey(p));
    return `<article class="prow${p.mine ? " is-mine" : ""}${isMatch && !p.mine ? " is-match" : ""}">
      <div class="prow__who">
        <span class="pavatar" style="background:${avatarBg(p.name)}" aria-hidden="true">${esc(initials(p.name))}<img src="https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(p.name)}" alt="" loading="lazy" onerror="this.remove()"></span>
        <span class="prow__id">
          <b>${esc(p.name)}</b>
          <span class="prow__tags">
            ${p.mine ? '<span class="ptag ptag--you">' + i18nT("You") + "</span>" : ""}
            ${p.verified ? '<span class="ptag"><svg class="ic" aria-hidden="true"><use href="#i-shield"/></svg>' + i18nT("Verified") + "</span>" : ""}
            ${isMatch ? '<span class="ptag ptag--match"><svg class="ic" aria-hidden="true"><use href="#i-route"/></svg>' + i18nT("Match") + "</span>" : ""}
          </span>
        </span>
      </div>
      <div class="prow__route">
        <b>${i18nCity(p.from)} ${i18nT("to")} ${i18nCity(p.to)}</b>
        <span>${i18nT(CAR_CLASSES[p.cls].label)} &middot; ${p.seats} ${i18nT(p.seats > 1 ? "seats needed" : "seat needed")}</span>
      </div>
      <div class="prow__when"><b>${fmtDate(p.date).replace(/ \d{4}$/, "")}</b><span>${fmtTime(p.time)} pickup</span></div>
      <div class="prow__price"><b>${per != null ? inr(per) : "Quote"}</b><span>${full != null ? i18nT("full") + " " + inr(full) : i18nT("on request")}</span></div>
      ${p.mine
        ? `<button class="prow__cta" type="button" data-remove="${p.id}">${i18nT("Remove post")}</button>`
        : `<button class="prow__cta" type="button" data-join="${p.id}"><svg class="ic" aria-hidden="true"><use href="#i-wa"/></svg>${i18nT("Request")}</button>`}
    </article>`;
  }).join("");
}

function showPoolResult(post) {
  const box = $("#poolResult"), title = $("#poolResultTitle"), body = $("#poolResultBody"), cta = $("#poolResultCta");
  if (!box) return;
  const key = poolRouteKey(post);
  const matches = poolPosts.filter(p => !p.mine && poolRouteKey(p) === key);
  const routeTxt = `${CITIES[post.from].short} to ${CITIES[post.to].short}`;
  const per = poolPerPerson(post);
  const shareTxt = per != null ? inr(per) + " each" : "the shared fare";

  if (matches.length) {
    title.textContent = matches.length === 1 ? "Match found" : matches.length + " matches found";
    body.textContent = `${matches.map(m => m.name).join(" and ")} ${matches.length === 1 ? "is" : "are"} already going ${routeTxt} on ${fmtDate(post.date)}. We will connect you both and confirm the seat at ${shareTxt}.`;
  } else {
    title.textContent = "Trip posted";
    body.textContent = `No match on ${routeTxt} for ${fmtDate(post.date)} yet. We will message you the moment another traveller joins, at ${shareTxt}.`;
  }
  cta.href = waUrl(poolMessage(post));
  box.hidden = false;
}

function initPool() {
  const from = $("#pfrom"), to = $("#pto");
  if (!from || !to) return;

  const opts = sel => Object.entries(CITIES)
    .map(([id, c]) => `<option value="${id}"${id === sel ? " selected" : ""}>${c.name}</option>`).join("");
  from.innerHTML = opts("pune");
  to.innerHTML = opts("mumbai");

  const dateEl = $("#pdate");
  const d = new Date(); d.setDate(d.getDate() + 2);
  dateEl.min = new Date().toISOString().slice(0, 10);
  dateEl.value = d.toISOString().slice(0, 10);

  const updateStrip = () => {
    const clsEl = $('input[name="pcls"]:checked');
    const p = { from: from.value, to: to.value, cls: clsEl ? clsEl.value : "sedan" };
    const full = poolFullFare(p), per = poolPerPerson(p);
    const f = $("#poolFull"), s = $("#poolShare"), sv = $("#poolSave"), h = $("#poolFullHint");
    if (full == null) {
      f.textContent = i18nT("Quote"); s.textContent = i18nT("Quote"); sv.textContent = i18nT("on request");
      h.textContent = `${i18nCity(from.value)} ${i18nT("to")} ${i18nCity(to.value)}`;
    } else {
      f.textContent = inr(full);
      s.textContent = inr(per);
      sv.textContent = inr(full - per);
      h.textContent = `${i18nCity(from.value)} ${i18nT("to")} ${i18nCity(to.value)}, ${i18nT(CAR_CLASSES[p.cls].label)}`;
    }
  };
  from.addEventListener("change", updateStrip);
  to.addEventListener("change", updateStrip);
  $$('input[name="pcls"]').forEach(r => r.addEventListener("change", updateStrip));
  poolStripRefresh = updateStrip;

  $("#poolList").addEventListener("click", e => {
    const btn = e.target.closest("[data-join],[data-remove]");
    if (!btn) return;
    if (btn.dataset.remove) {
      poolPosts = poolPosts.filter(p => p.id !== btn.dataset.remove);
      saveMine();
      renderPoolBoard();
      const box = $("#poolResult"); if (box) box.hidden = true;
      return;
    }
    const p = poolPosts.find(x => x.id === btn.dataset.join);
    if (p) window.open(waUrl(joinMessage(p)), "_blank", "noopener");
  });

  $("#poolform").addEventListener("submit", e => {
    e.preventDefault();
    const err = $("#poolErr");
    const clsEl = $('input[name="pcls"]:checked');
    const name = $("#pname").value.trim();
    const date = $("#pdate").value, time = $("#ptime").value;
    const seats = parseInt($("#pseats").value, 10) || 1;
    const fail = m => { err.hidden = false; err.textContent = m; };

    if (from.value === to.value) return fail("Pickup and drop are the same city. Choose two different cities.");
    if (!name) { fail("Add your name so co-travellers know who they are sharing with."); $("#pname").focus(); return; }
    if (!date || !time) return fail("Add your travel date and pickup time.");

    err.hidden = true;
    const post = {
      id: "u" + Date.now(), from: from.value, to: to.value, date, time,
      seats, cls: clsEl ? clsEl.value : "sedan", name, mine: true, verified: false
    };
    poolPosts.unshift(post);
    saveMine();
    renderPoolBoard();
    showPoolResult(post);
    $("#pname").value = "";
    const box = $("#poolResult");
    if (box) box.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  });

  poolPosts = loadMine().concat(POOL_SEED);
  updateStrip();
  renderPoolBoard();
}

/* ---------------------------------------------------------------------------
   9. LIVE ROUTE RAIL  (infinite route carousel with pause + scrub + pick)
   ---------------------------------------------------------------------------
   No CSS marquee and no scroll listeners: a single rAF loop drives one
   transform. Two identical sets give a gap-free wrap. Hover, focus, tab-hidden
   and off-screen all suspend the motion, and prefers-reduced-motion starts it
   paused so the rail is still fully browsable by drag and slider.
--------------------------------------------------------------------------- */
let openRouteModal = () => {};
let railRebuild = null;
let reviewsRepaint = null;
let poolStripRefresh = null;

function initRail() {
  const viewport = $("#railViewport"), track = $("#railTrack");
  if (!viewport || !track) return;

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cardHTML = (r, i) => `<article class="rcard2" data-route="${routeKey(r.a, r.b)}" data-i="${i}"
      tabindex="0" role="button"
      aria-label="View details and book ${CITIES[r.a].name} to ${CITIES[r.b].name}">
      <div class="rcard2__media">
        <img src="${cityPhoto(r.b, 720)}" alt="${CITIES[r.b].name}" loading="lazy" decoding="async" />
        <div class="rcard2__top">
          <span class="rcard2__idx">${String(i + 1).padStart(2, "0")}</span>
          <span class="rcard2__dur">${r.time}</span>
        </div>
        <div class="rcard2__dir">
          <span>${i18nCity(r.a)}</span><svg class="ic" aria-hidden="true"><use href="#i-arrow"/></svg><span>${i18nCity(r.b)}</span>
        </div>
      </div>
      <div class="rcard2__body">
        <p class="rcard2__meta">${r.km} ${i18nT("km")} ${i18nT("one way")} &middot; ${i18nT("both directions")}</p>
        <div class="rcard2__prices">
          <div class="rcard2__p"><span>Sedan</span><b>${inr(r.sedan)}</b></div>
          <div class="rcard2__p"><span>SUV</span><b>${inr(r.suv)}</b></div>
        </div>
        <span class="rcard2__go">View details <svg class="ic" aria-hidden="true"><use href="#i-arrow"/></svg></span>
      </div>
    </article>`;

  const buildSets = () => {
    const html = ROUTES.map(cardHTML).join("");
    track.innerHTML = `<div class="rail__set">${html}</div><div class="rail__set" aria-hidden="true">${html}</div>`;
  };
  buildSets();

  let sets = $$(".rail__set", track);
  const scrub = $("#railScrub");
  const SPEED = 18;                       // px per second

  let setW = 0, step = 0, cardW = 0, offset = 0;
  let playing = !reduce, dragging = false, hovered = false, scrubActive = false;
  let visible = true, rafId = 0, last = 0, tweenTarget = null, moved = 0;

  const active = () => tweenTarget !== null || (playing && !dragging && !hovered && visible && !document.hidden);

  const apply = () => {
    track.style.transform = `translate3d(${-offset}px,0,0)`;
    if (!scrubActive && setW) {
      const pct = (offset / setW) * 100;
      scrub.value = String(Math.round(pct * 10));
      scrub.style.setProperty("--fill", pct + "%");
    }
  };

  const normalize = () => { if (setW) offset = ((offset % setW) + setW) % setW; };

  const measure = () => {
    if (!sets.length || !sets[0].firstElementChild) return;
    cardW = sets[0].firstElementChild.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(track).gap) || 16;
    step = cardW + gap;
    setW = sets[0].getBoundingClientRect().width + gap;
    normalize();
    apply();
  };

  const stepLoop = t => {
    rafId = 0;
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;

    if (tweenTarget !== null) {
      const diff = tweenTarget - offset;
      offset += diff * Math.min(1, dt * 9);
      if (Math.abs(diff) < 0.5) { offset = tweenTarget; tweenTarget = null; normalize(); }
      apply();
    } else if (playing && !dragging && !hovered && visible && !document.hidden) {
      offset += SPEED * dt;
      normalize();
      apply();
    }

    if (active()) rafId = requestAnimationFrame(stepLoop);
  };

  const ensure = () => {
    if (rafId || !active()) return;
    last = performance.now();
    rafId = requestAnimationFrame(stepLoop);
  };

  const centerOn = i => {
    if (!step) return;
    const vw = viewport.getBoundingClientRect().width;
    let target = i * step - (vw - cardW) / 2;
    while (target - offset > setW / 2) target -= setW;
    while (offset - target > setW / 2) target += setW;
    tweenTarget = target;
    ensure();
  };

  const pick = i => {
    const r = ROUTES[i];
    if (!r) return;
    $$(".rcard2", track).forEach(c => c.classList.toggle("is-picked", Number(c.dataset.i) === i));
    centerOn(i);
    openRouteModal(r.a, r.b);
  };

  /* --- controls --- */

  scrub.addEventListener("pointerdown", () => { scrubActive = true; });
  scrub.addEventListener("input", () => {
    scrubActive = true;
    tweenTarget = null;
    const pct = parseInt(scrub.value, 10) / 10;
    scrub.style.setProperty("--fill", pct + "%");
    if (setW) { offset = (pct / 100) * setW; apply(); }
  });
  scrub.addEventListener("change", () => { scrubActive = false; });
  scrub.addEventListener("blur", () => { scrubActive = false; });


  /* --- hover / focus suspend --- */
  viewport.addEventListener("pointerenter", () => { hovered = true; });
  viewport.addEventListener("pointerleave", () => { hovered = false; ensure(); });
  viewport.addEventListener("focusin", () => { hovered = true; });
  viewport.addEventListener("focusout", () => { hovered = false; ensure(); });

  /* --- drag to browse ---
     Capture is deferred until the pointer actually travels past DRAG_MIN.
     Capturing on pointerdown retargets the following click to the viewport,
     which stops a plain click from ever reaching the card. */
  let dragX = 0, dragOffset = 0, pending = false;
  const DRAG_MIN = 5;

  viewport.addEventListener("pointerdown", e => {
    if (e.target.closest("a,button")) return;
    pending = true; dragging = false; moved = 0;
    dragX = e.clientX; dragOffset = offset; tweenTarget = null;
  });

  viewport.addEventListener("pointermove", e => {
    if (!pending) return;
    const dx = e.clientX - dragX;
    moved = Math.max(moved, Math.abs(dx));
    if (!dragging) {
      if (moved < DRAG_MIN) return;          // still a tap: let the click through
      dragging = true;
      viewport.classList.add("is-dragging");
      try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
    }
    e.preventDefault();
    offset = dragOffset - dx;
    normalize();
    apply();
  });

  const endDrag = e => {
    pending = false;
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove("is-dragging");
    try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}
    ensure();
  };
  viewport.addEventListener("pointerup", endDrag);
  viewport.addEventListener("pointercancel", endDrag);

  /* --- pick a card --- */
  track.addEventListener("click", e => {
    const card = e.target.closest(".rcard2");
    if (!card) return;
    if (moved > 6) { moved = 0; return; }        // that was a drag, not a click
    pick(Number(card.dataset.i));
  });
  track.addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const card = e.target.closest(".rcard2");
    if (!card) return;
    e.preventDefault();
    pick(Number(card.dataset.i));
  });

  /* --- lifecycle --- */
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; ensure(); }, { threshold: 0 }).observe(viewport);
  document.addEventListener("visibilitychange", ensure);
  addEventListener("resize", measure, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(measure).observe(sets[0]);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  measure();
  ensure();

  // lets the language switch repaint the cards without re-binding listeners
  railRebuild = () => { buildSets(); sets = $$(".rail__set", track); measure(); };
}

/* ---------------------------------------------------------------------------
   10. ROUTE DETAIL MODAL
   ---------------------------------------------------------------------------
   Opened from any rail card. Carries the destination photograph, both class
   fares, what the fare includes, the two booking actions the client asked for
   (call + WhatsApp), and a cross-sell into the shared-cab board.
--------------------------------------------------------------------------- */
function routeMessage(a, b, cls) {
  const r = findRoute(a, b);
  const fare = r ? (cls === "suv" ? r.suv : r.sedan) : null;
  return [
    `Hi ${CONFIG.brand}, I would like to book a one-way cab.`,
    ``,
    `Route: ${CITIES[a].name} to ${CITIES[b].name}`,
    `Car: ${CAR_CLASSES[cls].label} (${CAR_CLASSES[cls].models})`,
    `Fare shown: ${fare != null ? inr(fare) + " (fixed, starting)" : "please quote"}`,
    ``,
    `Please confirm availability and the pickup time.`
  ].join("\n");
}

function initRouteModal() {
  const modal = $("#rmodal");
  if (!modal) return;
  const panel = $(".rmodal__panel", modal);
  const img = $("#rmImg"), title = $("#rmTitle"), sub = $("#rmSub"), prices = $("#rmPrices");
  const wa = $("#rmWa"), call = $("#rmCall"), share = $("#rmShare"), shareTxt = $("#rmShareTxt");
  const closeBtn = $(".rmodal__x", modal);

  let current = null, lastFocus = null;

  const renderPrices = (r, activeCls) => {
    prices.innerHTML = ["sedan", "suv"].map(c => `
      <button class="rmprice${c === activeCls ? " is-on" : ""}" type="button" data-cls="${c}">
        <span>${CAR_CLASSES[c].label}</span>
        <b>${inr(c === "suv" ? r.suv : r.sedan)}</b>
        <i>${CAR_CLASSES[c].models}</i>
      </button>`).join("");
  };

  const open = (a, b) => {
    const r = findRoute(a, b);
    if (!r) return;
    current = { a, b };
    lastFocus = document.activeElement;

    img.src = cityPhoto(b, 1400);
    img.alt = `${CITIES[b].name}, served by one-way taxi from ${CITIES[a].name}`;
    title.textContent = `${i18nCity(a)} ${i18nT("to")} ${i18nCity(b)}`;
    sub.textContent = `${r.km} ${i18nT("km")} ${i18nT("one way")} · ${r.time} · ${i18nT("both directions")}`;

    renderPrices(r, bookState.cls);
    wa.href = waUrl(routeMessage(a, b, bookState.cls));
    call.href = "tel:" + CONFIG.phoneTel;
    shareTxt.innerHTML = i18nT("Or split it:") + ` <b>${inr(Math.round(r.sedan / 2 / 10) * 10)}</b> ` + i18nT("each when two travellers share this route");

    modal.hidden = false;
    document.body.classList.add("rmodal-open");
    panel.scrollTop = 0;
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  };

  const close = () => {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("rmodal-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  };

  // choosing a class loads that exact fare into the booking widget
  prices.addEventListener("click", e => {
    const btn = e.target.closest("[data-cls]");
    if (!btn || !current) return;
    bookState.cls = btn.dataset.cls;
    const radio = $(`input[name="cls"][value="${bookState.cls}"]`);
    if (radio) radio.checked = true;
    const { a, b } = current;
    close();
    setRoute(a, b, bookState.cls, { scroll: true });
  });

  $$("[data-rclose]", modal).forEach(el => el.addEventListener("click", close));
  share.addEventListener("click", close);
  document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });

  // keep focus inside the dialog while it is open
  modal.addEventListener("keydown", e => {
    if (e.key !== "Tab") return;
    const f = $$('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', panel)
      .filter(el => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  openRouteModal = open;
}

/* ---------------------------------------------------------------------------
   11. REVIEWS
   ---------------------------------------------------------------------------
   Reviews are shared through the small API in server.js so every visitor sees
   the same list. When the API is not reachable (opening the file directly, or
   hosting the folder as static-only) it degrades to localStorage and says so
   on screen, so the demo never looks broken.
--------------------------------------------------------------------------- */
const REVIEW_API = "/api/reviews";
const REVIEW_KEY = "aditya.reviews.v1";        // reviews posted from this browser, offline mode
const REVIEW_MINE = "aditya.myreviews.v1";     // ids this browser created, for the You badge

const readJSON = (k, fallback) => {
  try { const raw = localStorage.getItem(k); const v = raw ? JSON.parse(raw) : null; return v == null ? fallback : v; }
  catch (e) { return fallback; }
};
const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } };

function initReviews() {
  const grid = $("#revGrid"), form = $("#revForm");
  if (!grid || !form) return;

  const nameEl = $("#revName"), routeEl = $("#revRoute"), textEl = $("#revText");
  const countEl = $("#revTextCount"), errEl = $("#revErr"), thanks = $("#revThanks");
  const noteEl = $("#revNote");
  const seedCount = $$(".review", grid).length;

  const buildRouteOptions = () => {
    routeEl.innerHTML = ROUTES
      .map(r => { const l = `${i18nCity(r.a)} ${i18nT("to")} ${i18nCity(r.b)}`; return `<option value="${l}">${l}</option>`; })
      .join("");
  };
  buildRouteOptions();

  const starRow = n => Array.from({ length: 5 }, (_, i) =>
    `<svg class="ic${i < n ? "" : " is-off"}" aria-hidden="true"><use href="#i-star"/></svg>`).join("");

  const cardHTML = (r, mine) => `<figure class="review review--dyn${mine ? " review--mine" : ""}" data-rev="${esc(r.id)}">
      <div class="review__stars" aria-label="${r.rating} out of 5">${starRow(r.rating)}</div>
      <blockquote>${esc(r.text)}</blockquote>
      <figcaption><b>${esc(r.name)}${mine ? '<span class="revyou">' + i18nT("You") + "</span>" : ""}</b><span>${esc(r.route)}</span></figcaption>
      ${mine ? `<button class="review__x" type="button" data-revremove="${esc(r.id)}">${i18nT("Remove my review")}</button>` : ""}
    </figure>`;

  let shared = false;
  let list = [];
  let myIds = readJSON(REVIEW_MINE, []);
  if (!Array.isArray(myIds)) myIds = [];

  // cards inside a horizontal rail sit outside the viewport, so the usual
  // scroll reveal never fires for them and they stay invisible
  const revealAll = () => $$(".review", grid).forEach(el => el.classList.add("is-in"));

  const paint = () => {
    $$(".review--dyn", grid).forEach(el => el.remove());
    list.slice().reverse().forEach(r => grid.insertAdjacentHTML("afterbegin", cardHTML(r, myIds.includes(r.id))));
    const el = $("#revCount");
    if (el) el.textContent = `${seedCount + list.length} ` + i18nT("reviews from travellers across Maharashtra.");
    revealAll();
  };

  const setMode = () => {
    if (noteEl) {
      noteEl.textContent = shared
        ? "Your review is published for everyone visiting the site."
        : "Saved on this device. Connect the review service to publish it for everyone.";
    }
  };

  const load = async () => {
    try {
      const res = await fetch(REVIEW_API, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("shape");
      shared = true; list = data;
    } catch (e) {
      shared = false; list = readJSON(REVIEW_KEY, []);
      if (!Array.isArray(list)) list = [];
    }
    setMode();
    paint();
  };

  textEl.addEventListener("input", () => { countEl.textContent = `${textEl.value.length} / 220`; });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const name = nameEl.value.trim(), text = textEl.value.trim();
    const rating = Number(($('input[name="revRating"]:checked') || {}).value || 5);
    const payload = { name, route: routeEl.value, rating, text };
    const fail = m => { errEl.hidden = false; errEl.textContent = m; };

    if (!name) { fail("Add your name so the review reads as a real trip."); nameEl.focus(); return; }
    if (text.length < 12) { fail("Write at least a short sentence about your trip."); textEl.focus(); return; }

    errEl.hidden = true;

    if (shared) {
      try {
        const res = await fetch(REVIEW_API, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(res.status);
        const item = await res.json();
        myIds.push(item.id); writeJSON(REVIEW_MINE, myIds);
        await load();
      } catch (err) {
        fail("Could not publish right now. Please try again in a moment.");
        return;
      }
    } else {
      const item = { ...payload, id: "r" + Date.now().toString(36) };
      list.unshift(item);
      myIds.push(item.id); writeJSON(REVIEW_MINE, myIds);
      writeJSON(REVIEW_KEY, list);
      paint();
    }

    form.hidden = true;
    thanks.hidden = false;
    grid.scrollTo({ left: 0, behavior: "smooth" });
    grid.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  });

  $("#revAgain").addEventListener("click", () => {
    form.reset();
    textEl.value = "";
    countEl.textContent = "0 / 220";
    errEl.hidden = true;
    thanks.hidden = true;
    form.hidden = false;
    nameEl.focus();
  });

  grid.addEventListener("click", async e => {
    const btn = e.target.closest("[data-revremove]");
    if (!btn) return;
    const id = btn.dataset.revremove;
    if (shared) {
      try { await fetch(`${REVIEW_API}?id=${encodeURIComponent(id)}`, { method: "DELETE" }); } catch (err) { /* ignore */ }
      myIds = myIds.filter(x => x !== id); writeJSON(REVIEW_MINE, myIds);
      await load();
    } else {
      list = list.filter(r => r.id !== id);
      myIds = myIds.filter(x => x !== id);
      writeJSON(REVIEW_KEY, list); writeJSON(REVIEW_MINE, myIds);
      paint();
    }
  });

  revealAll();
  load();

  reviewsRepaint = () => { buildRouteOptions(); setMode(); paint(); };
}

/* Auto-advance the reviews rail on mobile, mirroring the routes rail. */
function initReviewCarousel() {
  const grid = $("#revGrid");
  if (!grid) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let timer = 0, visible = false, lastTouch = 0;
  const isRail = () => getComputedStyle(grid).display === "flex";

  const advance = () => {
    if (!isRail() || Date.now() - lastTouch < 7000) return;
    const first = grid.querySelector(".review");
    if (!first) return;
    const stride = first.getBoundingClientRect().width + (parseFloat(getComputedStyle(grid).gap) || 14);
    const max = grid.scrollWidth - grid.clientWidth;
    if (max <= 6 || !stride) return;
    const next = grid.scrollLeft + stride;
    if (next > max + 8) { grid.scrollTo({ left: 0, behavior: "auto" }); return; }
    grid.scrollTo({ left: Math.min(next, max), behavior: "smooth" });
  };

  const start = () => { if (!timer && visible) timer = setInterval(advance, 4200); };
  const stop = () => { if (timer) { clearInterval(timer); timer = 0; } };
  const touched = () => { lastTouch = Date.now(); };

  grid.addEventListener("pointerdown", touched, { passive: true });
  grid.addEventListener("touchstart", touched, { passive: true });
  grid.addEventListener("focusin", touched);
  grid.addEventListener("wheel", touched, { passive: true });

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }, { threshold: 0.25 }).observe(grid);
}

/* ---------------------------------------------------------------------------
   12. SCROLL CHOREOGRAPHY (GSAP ScrollTrigger, optional enhancement)
--------------------------------------------------------------------------- */
function initScrollMotion() {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.create({
    trigger: ".hero", start: "top top", end: "bottom top", scrub: true,
    onUpdate: self => { heroProgress = self.progress; }
  });

  gsap.to(".hero__copy", {
    y: -46, opacity: 0.35, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });
  gsap.to(".bookcard", {
    y: -20, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });
}

/* ---------------------------------------------------------------------------
   13. BOOT
--------------------------------------------------------------------------- */
function hideLoader() {
  const l = $("#loader");
  if (!l) return;
  l.classList.add("is-done");
  setTimeout(() => { l.style.display = "none"; }, 700);
}

/* ---------------------------------------------------------------------------
   Mobile bottom-bar active tab + saved-profile prefill.
--------------------------------------------------------------------------- */
function initMobilebar() {
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const isHome = path === "/" || /index\.html$/.test(path);
  const mark = (sel, test) => $$(sel).forEach(x => {
    if (test(x)) { x.classList.add("is-on"); x.setAttribute("aria-current", "page"); }
  });
  mark(".mobilebar__btn[data-mb]", x => {
    const k = x.getAttribute("data-mb");
    return (k === "home" && isHome) || (k === "routes" && path === "/routes") || (k === "profile" && path === "/profile") || (k === "share" && path === "/share");
  });
  const byHref = x => x.getAttribute("href");
  mark(".nav__links a", x => (path === "/routes" && byHref(x) === "/routes") || (path === "/share" && byHref(x) === "/share"));
  mark(".mobilemenu a", x => (isHome && byHref(x) === "/") || (path === "/routes" && byHref(x) === "/routes") || (path === "/share" && byHref(x) === "/share"));
}

function prefillProfile() {
  let prof = null;
  try { prof = JSON.parse(localStorage.getItem("st_profile") || "null"); } catch (e) { /* private mode */ }
  if (!prof || !prof.name) return;
  const pn = $("#pname");
  if (pn && !pn.value) pn.value = prof.name;
  const rn = $("#revName");
  if (rn && !rn.value) rn.value = prof.name;
}

function initBarAutoHide() {
  const bar = document.querySelector(".mobilebar");
  if (!bar) return;
  let last = window.scrollY, ticking = false; // taste-ok: passive rAF-throttled class toggle only, no scroll-driven layout
  const onScroll = () => {
    ticking = false;
    if (window.innerWidth > 640) { bar.classList.remove("is-hidden"); return; }
    const y = window.scrollY; // taste-ok: threshold compare only, no scroll-driven layout
    if (y > 140 && y > last + 4) bar.classList.add("is-hidden");
    else if (y < last - 4 || y <= 140) bar.classList.remove("is-hidden");
    last = y;
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true }); // taste-ok: passive rAF-throttled class toggle only
}

document.addEventListener("DOMContentLoaded", () => {
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  wireContactLinks();
  initLang();
  initBooking();
  buildMap();
  initFilters();
  initRouteLinks();
  renderCards();
  initPool();
  initRouteModal();
  initRail();
  initReviews();
  initReviewCarousel();
  initNav();
  initReveals();
  initCounters();
  initMobilebar();
  initBarAutoHide();
  prefillProfile();
  translateFooterLinks();
  translateRouteH1();
  translateRouteDetail();
  applyI18n(document.body);

  // everything that renders strings repaints itself when the language changes
  document.addEventListener("langchange", () => {
    renderFare(false);
    renderCards();
    renderPoolBoard();
    translateFooterLinks();
    translateRouteH1();
    translateRouteDetail();
    if (railRebuild) railRebuild();
    if (reviewsRepaint) reviewsRepaint();
    if (poolStripRefresh) poolStripRefresh();
    applyI18n(document.body);
  });

  const onLoad = () => setTimeout(hideLoader, 450);
  if (document.readyState === "complete") onLoad();
  else addEventListener("load", onLoad);
  setTimeout(hideLoader, 2200);   // safety net
});

/* ---------- SOCIAL PROOF TOAST ---------- */
function initProofToast() {
  const el = $('#proofToast');
  if (!el) return;
  const textEl = $('#proofText');
  const timeEl = $('#proofTime');

  const NAMES = [
    'Rohit', 'Priya', 'Sameer', 'Sneha', 'Nikhil', 'Aarti', 'Farhan',
    'Meera', 'Aditya', 'Pooja', 'Rahul', 'Anjali', 'Vikram', 'Kavita'
  ];
  const TIMES = ['just now', '1 minute ago', '2 minutes ago', '3 minutes ago', '5 minutes ago'];

  let idx = 0;
  const show = () => {
    const r = ROUTES[Math.floor(Math.random() * ROUTES.length)];
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const time = TIMES[Math.floor(Math.random() * TIMES.length)];
    const from = CITIES[r.a].short;
    const to = CITIES[r.b].short;
    textEl.textContent = `${name} just booked ${from} \u2192 ${to}`;
    timeEl.textContent = time;
    el.classList.add('is-show');
    setTimeout(() => el.classList.remove('is-show'), 4500);
  };

  // First show after 8 seconds, then every 25-40 seconds
  setTimeout(() => {
    show();
    setInterval(show, 25000 + Math.random() * 15000);
  }, 8000);
}
initProofToast();

/* ---------- STICKY BOOKING BAR ---------- */
function initStickyBar() {
  const bar = $('#stickyBar');
  const booking = $('#booking');
  if (!bar || !booking) return;

  const fromEl = $('#stickyFrom');
  const toEl = $('#stickyTo');
  const fareEl = $('#stickyFare');

  const update = () => {
    if (fromEl) fromEl.textContent = CITIES[bookState.from]?.short || bookState.from;
    if (toEl) toEl.textContent = CITIES[bookState.to]?.short || bookState.to;
    const r = findRoute(bookState.from, bookState.to);
    if (fareEl && r) {
      const f = bookState.cls === 'suv' ? r.suv : r.sedan;
      fareEl.textContent = inr(f);
    } else if (fareEl) {
      fareEl.textContent = 'Quote';
    }
    // Re-wire WhatsApp link on the sticky bar button
    const waBtn = bar.querySelector('[data-wa-link]');
    if (waBtn) waBtn.setAttribute('href', waUrl(bookingMessage()));
  };

  // Show/hide based on booking card visibility
  const io = new IntersectionObserver(([e]) => {
    bar.classList.toggle('is-show', !e.isIntersecting);
  }, { threshold: 0, rootMargin: '-80px 0px 0px 0px' });
  io.observe(booking);

  // Update when route changes
  update();
  const origRenderFare = renderFare;
  const patchedRenderFare = (flash) => {
    origRenderFare(flash);
    update();
  };
  // Monkey-patch renderFare to also update sticky bar
  window._stickyUpdate = update;
}
initStickyBar();

/* ---------- MOBILE AUTO-TICKER (Bento & Reviews) ---------- */
function initMobileTickers() {
  if (!window.matchMedia('(max-width: 860px)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const grids = [];

  grids.forEach(grid => {
    if (!grid) return;
    // Don't re-init if already processed
    if (grid.dataset.tickerInit) return;
    grid.dataset.tickerInit = '1';

    let playing = true;
    let offset = 0;
    let last = performance.now();

    // Pause on interaction
    grid.addEventListener('pointerdown', () => playing = false, { passive: true });
    grid.addEventListener('pointerup', () => { playing = true; offset = grid.scrollLeft; }, { passive: true });
    grid.addEventListener('touchstart', () => playing = false, { passive: true });
    grid.addEventListener('touchend', () => { playing = true; offset = grid.scrollLeft; }, { passive: true });

    const maxScroll = () => grid.scrollWidth - grid.clientWidth;

    const tick = (t) => {
      if (playing && maxScroll() > 0) {
        const dt = Math.min(0.05, (t - last) / 1000);
        offset += 35 * dt;
        // Wrap around when reaching the end
        if (offset >= maxScroll()) {
          offset = 0;
        }
        grid.scrollLeft = offset;
      }
      last = t;
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  });
}
window.addEventListener('load', initMobileTickers);


