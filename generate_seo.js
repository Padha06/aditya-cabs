const fs = require('fs');
const path = require('path');

const pairs = [
  ['Pune', 'Mumbai'],
  ['Pune', 'Chhatrapati Sambhajinagar'],
  ['Pune', 'Nashik'],
  ['Pune', 'Ahilyanagar'],
  ['Pune', 'Shirdi'],
  ['Mumbai', 'Nashik'],
  ['Mumbai', 'Shirdi'],
  ['Nashik', 'Chhatrapati Sambhajinagar'],
  ['Chhatrapati Sambhajinagar', 'Shirdi'],
  ['Pune', 'Mahabaleshwar'],
  ['Pune', 'Kolhapur'],
  ['Mumbai', 'Lonavala'],
  ['Pune', 'Lonavala'],
  ['Mumbai', 'Mahabaleshwar'],
  ['Nashik', 'Shirdi'],
  ['Ahilyanagar', 'Shirdi'],
  ['Mumbai', 'Chhatrapati Sambhajinagar'],
  ['Mumbai', 'Ahilyanagar'],
  ['Pune', 'Aurangabad'],
  ['Mumbai', 'Aurangabad'],
  ['Nashik', 'Aurangabad'],
  ['Aurangabad', 'Shirdi']
];

const routes = [];
pairs.forEach(([from, to]) => {
  routes.push({ from, to });
  routes.push({ from: to, to: from });
}); // 36 routes total (18 pairs x both directions)

const htmlTemplate = fs.readFileSync('index.html', 'utf8');

const sitemapUrls = [];
const baseUrl = 'https://shivrudrataxi.com';

sitemapUrls.push(`${baseUrl}/`);

// NOTE (audit 2026-09-26): the footer (nav shortlists + full SEO link block)
// lives in index.html and is shared by every generated page. Do NOT inject
// link blocks here and do NOT write back to index.html - re-running this
// script must only regenerate the route pages, sitemap.xml and robots.txt.
const templateWithFooter = htmlTemplate;

// Booking-form <select> option values are city ids (pune, sambhajinagar, ...),
// so map the display names used in slugs back to ids for the fare prefill.
const NAME_TO_ID = {
  'pune': 'pune',
  'mumbai': 'mumbai',
  'chhatrapati sambhajinagar': 'sambhajinagar',
  'aurangabad': 'sambhajinagar',
  'nashik': 'nashik',
  'ahilyanagar': 'ahilyanagar',
  'shirdi': 'shirdi',
  'lonavala': 'lonavala',
  'mahabaleshwar': 'mahabaleshwar',
  'kolhapur': 'kolhapur'
};
const slugOf = d => d.toLowerCase().replace(/ /g, '-');

// ---------------------------------------------------------------------------
// Route detail data (mirrors app.js ROUTES for fares, plus copy the runtime
// table cannot know). KM_TIME is [km, time, sedan, suv] per directed pair;
// ktOf() falls back to the reverse key, so 36 pages resolve from 18 entries.
// ---------------------------------------------------------------------------
const KM_TIME = {
  'pune|mumbai': [150, '3h 30m', 2799, 3199],
  'pune|chhatrapati sambhajinagar': [235, '5h', 2799, 3499],
  'pune|nashik': [210, '4h 30m', 3199, 3799],
  'pune|ahilyanagar': [120, '2h 30m', 1999, 2699],
  'pune|shirdi': [185, '4h', 2999, 3699],
  'pune|lonavala': [65, '1h 30m', 1499, 1999],
  'pune|mahabaleshwar': [120, '3h', 2499, 3199],
  'pune|kolhapur': [230, '5h', 3499, 4299],
  'mumbai|chhatrapati sambhajinagar': [340, '7h', 3999, 4799],
  'mumbai|nashik': [165, '3h 30m', 2999, 3699],
  'mumbai|shirdi': [240, '5h', 3999, 4799],
  'mumbai|ahilyanagar': [255, '5h 30m', 3999, 4799],
  'mumbai|lonavala': [85, '2h', 1799, 2299],
  'mumbai|mahabaleshwar': [230, '4h 45m', 3999, 4799], // !! ESTIMATE - ask client to confirm
  'nashik|chhatrapati sambhajinagar': [180, '4h', 2999, 3699],
  'chhatrapati sambhajinagar|shirdi': [110, '2h 30m', 2199, 2799],
  'nashik|shirdi': [90, '2h', 1999, 2499],
  'ahilyanagar|shirdi': [85, '1h 50m', 1999, 2599],
  'pune|aurangabad': [235, '5h', 2799, 3499],
  'mumbai|aurangabad': [340, '7h', 3999, 4799],
  'nashik|aurangabad': [180, '4h', 2999, 3699],
  'aurangabad|shirdi': [110, '2h 30m', 2199, 2799]
};
const ktOf = (a, b) => KM_TIME[a + '|' + b] || KM_TIME[b + '|' + a];

// Directional corridor phrasing [en, mr] - keyed by city ids, all 36 written,
// because "via X" reads differently depending on which way the car is going.
const VIA = {
  'pune|mumbai': ['along the Mumbai-Pune Expressway', 'मुंबई-पुणे एक्सप्रेसवे मार्गाने'],
  'mumbai|pune': ['across the ghat sections towards Pune', 'घाटांच्या वाटेतून पुण्याकडे'],
  'pune|sambhajinagar': ['via Ahilyanagar on the highway', 'अहिल्यानगर होऊन महामार्गावर'],
  'sambhajinagar|pune': ['via Ahilyanagar towards Pune', 'अहिल्यानगर होऊन पुण्याकडे'],
  'pune|nashik': ['via Sangamner on the Nashik highway', 'सांगनेर होऊन नाशिक महामार्गावर'],
  'nashik|pune': ['via Sangamner towards Pune', 'सांगनेर होऊन पुण्याकडे'],
  'pune|ahilyanagar': ['on the direct Ahilyanagar highway', 'थेट अहिल्यानगर महामार्गावर'],
  'ahilyanagar|pune': ['on the direct highway towards Pune', 'थेट महामार्गावर पुण्याकडे'],
  'pune|shirdi': ['via Ahilyanagar and Rahata', 'अहिल्यानगर व राहाता होऊन'],
  'shirdi|pune': ['via Rahata and Ahilyanagar', 'राहाता व अहिल्यानगर होऊन'],
  'mumbai|nashik': ['across Kasara ghat on the Nashik road', 'कसारा घाटांच्या वाटेने नाशिक रस्त्यावर'],
  'nashik|mumbai': ['across the ghat sections towards Mumbai', 'घाटांच्या वाटेतून मुंबईकडे'],
  'mumbai|shirdi': ['on the Samruddhi Mahamarg', 'समृद्धी महामार्गावर'],
  'shirdi|mumbai': ['on the Samruddhi Mahamarg towards Mumbai', 'समृद्धी महामार्गावर मुंबईकडे'],
  'nashik|sambhajinagar': ['via Yeola on the Ahilyanagar road', 'येवला होऊन अहिल्यानगर रस्त्यावर'],
  'sambhajinagar|nashik': ['via Yeola towards Nashik', 'येवला होऊन नाशिककडे'],
  'sambhajinagar|shirdi': ['along the Samruddhi Mahamarg', 'समृद्धी महामार्गावर'],
  'shirdi|sambhajinagar': ['on the Samruddhi Mahamarg towards Chhatrapati Sambhajinagar', 'समृद्धी महामार्गावर छत्रपती संभाजीनगरकडे'],
  'pune|mahabaleshwar': ['via Wai on the Satara road', 'वाई होऊन सातारा रस्त्यावर'],
  'mahabaleshwar|pune': ['via Wai towards Pune', 'वाई होऊन पुण्याकडे'],
  'pune|kolhapur': ['via Satara and Karad', 'सातारा व कराड होऊन'],
  'kolhapur|pune': ['via Karad and Satara', 'कराड व सातारा होऊन'],
  'mumbai|lonavala': ['on the expressway', 'एक्सप्रेसवे मार्गाने'],
  'lonavala|mumbai': ['down the expressway towards Mumbai', 'एक्सप्रेसवे मार्गाने मुंबईकडे'],
  'pune|lonavala': ['on the old Lonavala highway', 'जुन्या लोणावळा महामार्गावर'],
  'lonavala|pune': ['on the highway towards Pune', 'महामार्गावर पुण्याकडे'],
  'mumbai|mahabaleshwar': ['via the expressway and Wai', 'एक्सप्रेसवे व वाई होऊन'],
  'mahabaleshwar|mumbai': ['via Wai and the expressway', 'वाई व एक्सप्रेसवे होऊन'],
  'nashik|shirdi': ['via Sinnar on the Shirdi road', 'सिन्नर होऊन शिर्डी रस्त्यावर'],
  'shirdi|nashik': ['via Sinnar towards Nashik', 'सिन्नर होऊन नाशिककडे'],
  'ahilyanagar|shirdi': ['via Rahata on the Shirdi road', 'राहाता होऊन शिर्डी रस्त्यावर'],
  'shirdi|ahilyanagar': ['via Rahata towards Ahilyanagar', 'राहाता होऊन अहिल्यानगरकडे'],
  'mumbai|sambhajinagar': ['on the Samruddhi Mahamarg towards Marathwada', 'समृद्धी महामार्गावर मराठवाड्याकडे'],
  'sambhajinagar|mumbai': ['along the Samruddhi Mahamarg towards Mumbai', 'समृद्धी महामार्गावर मुंबईकडे'],
  'mumbai|ahilyanagar': ['via Sinnar and Nashik', 'सिन्नर व नाशिक होऊन'],
  'ahilyanagar|mumbai': ['via Nashik towards Mumbai', 'नाशिक होऊन मुंबईकडे']
};

// Per-city copy [en, mr]: about = what the destination offers, pickup = where
// the car can collect you, tip = a departure-time clause that reads after
// "from <city>," on every page this city appears on.
const CITY_INFO = {
  pune: {
    about: ['Pune mixes the old-city wadas and Koregaon Park cafes with IT hubs in Hinjewadi and Kharadi, and it is the usual starting point for ghat getaways',
      'पुण्यात जुने शहर, कोरेगांवपार्कची कॅफे, हिंजवडी-खराडी IT हब आणि घाटांसाठी सामान्य प्रवासाची सुरुवात असते'],
    pickup: ['Kothrud, Baner, Hinjewadi, Viman Nagar, the railway station and Pune airport',
      'कोथरूड, बाणेर, हिंजवडी, विमाननगर, रेल्वे स्थानक आणि पुणे विमानतळ'],
    tip: ['depart before 8 am to clear the city rush.',
      'शहराची गल्ली टाळण्यासाठी सकाळी ८ वाजेपूर्वी निघा.']
  },
  mumbai: {
    about: ['Mumbai runs on Marine Drive, both airport terminals, the Bandra-Andheri business belt and the coastal road, with pickups possible at any hour',
      'मुंबईत मरीन ड्राईव्ह, दोन्ही विमानतळे, बांद्रा-अंधेरी व्यावसायिक पट्टी आणि कोस्टल रोड आहे; कोणत्याही वेळी पिकअप शक्य आहे'],
    pickup: ['Bandra, Andheri, Powai, Dadar, CSMT and both airport terminals',
      'बांद्रा, अंधेरी, पवई, दादर, सीएसएमटी आणि दोन्ही विमानतळे'],
    tip: ['start after the morning peak; weekend evenings are busiest.',
      'सकाळच्या गर्दीनंतर निघा; आठवड्याच्या अखेरच्या संध्याकाळी सर्वाधिक प्रवास असतो.']
  },
  sambhajinagar: {
    about: ['Chhatrapati Sambhajinagar is the gateway to Ellora and Ajanta, Bibi ka Maqbara and the Samruddhi corridor into Marathwada',
      'छत्रपती संभाजीनगर हे एळोरा-अजंठा, बीबी का मकबरा आणि मराठवाड्यातील समृद्धी विभागाचे प्रवेशद्वार आहे'],
    pickup: ['CIDCO, Chikalthana airport, the railway station and the old city',
      'सीआयडीसीओ, चिकलथाणा विमानतळ, रेल्वे स्थानक आणि जुने शहर'],
    tip: ['set out mid-morning, once the city traffic settles.',
      'शहराचा वाहतूक संपल्यावर दुपारी निघा.']
  },
  nashik: {
    about: ['Nashik lines up Trimbakeshwar, Panchavati, the Godavari ghats and vineyards within an easy drive of the city',
      'नाशिकजवळ त्र्यंबकेश्वर, पंचवटी, गोदावरी घाट आणि द्राक्षबाग शहरापासून सहज पोहोचतात'],
    pickup: ['Gangapur Road, the Central Bus Stand, Trimbak Road and the airport',
      'गंगापूर रोड, केंद्रीय बस स्थानक, त्र्यंबक रोड आणि विमानतळ'],
    tip: ['leave early on festival days, when the temple roads fill up.',
      'सणाच्या दिवशी लवकर निघा, कारण मंदिराचे रस्ते लवकर भरतात.']
  },
  ahilyanagar: {
    about: ['Ahilyanagar joins the Samruddhi interchange with Ahilya Fort, Siddhivinayak temple and quick access to Shirdi',
      'अहिल्यानगर हे समृद्धी आंतरराष्ट्रीय जोडणी, अहिल्या किल्ला, सिद्धिविनायक मंदिर आणि शिर्डीपर्यंत झपाट्याने पोहोचण्याचे केंद्र आहे'],
    pickup: ['the city centre, the railway station and the Samruddhi interchange',
      'शहराचा मध्यभाग, रेल्वे स्थानक आणि समृद्धी आंतरराष्ट्रीय जोडणी'],
    tip: ['any time of day; the junction is quick to cross.',
      'दिवसभर कोणत्याही वेळी; जोडणी ओलांडणे सोपे आहे.']
  },
  shirdi: {
    about: ['Shirdi is built around the Sai Baba temple, with Saibaba Nagar, the bus stand and the Samruddhi exit close by',
      'शिर्डी साईबाबा मंदिराभोवती विकसित झालेले आहे; साईबाबा नगर, बस स्थानक व समृद्धी उतारा जवळचे आहे'],
    pickup: ['the temple gates, Saibaba Nagar, the bus stand and the Samruddhi exit',
      'मंदिराचे दारे, साईबाबा नगर, बस स्थानक आणि समृद्धी उतारा'],
    tip: ['get in before the darshan rush so the day stays easy.',
      'दर्शनाच्या गर्दीपूर्वी पोहोचा, दिवस सोपा जाईल.']
  },
  lonavala: {
    about: ['Lonavala packs Bhushi Dam, Tiger\'s Leap, the viewpoints and chikki into one hill stop between the two metros',
      'लोणावळ्यात भुशी डॅम, टायगर्स लीप, व्यूपॉइंट व चिक्की एका डोंगरीथांब्यावरच मिळतात'],
    pickup: ['the railway station, Tiger\'s Leap Road and hotels off the old highway',
      'रेल्वे स्थानक, टायगर्स लीप रोड आणि जुन्या महामार्गापासून लागणारी हॉटेल्स'],
    tip: ['start before the weekend ghat traffic builds.',
      'आठवड्याच्या शेवटी घाटातील वाहतूक वाढण्यापूर्वी निघा.']
  },
  mahabaleshwar: {
    about: ['Mahabaleshwar holds Venna Lake, Arthur\'s Seat, the strawberry farms and the Panchgani turn-off above the Krishna valley',
      'महाबळेश्वरात व्हेना तलाव, आर्थर्स सीट, स्ट्रॉबेरी शेते आणि कृष्णा दरीवरील पंचगनी ओलांडणी आहे'],
    pickup: ['the market, Venna Lake road and the Panchgani turn-off',
      'बाजार, व्हेना तलाव रोड आणि पंचगनी ओलांडणी'],
    tip: ['leave in the morning to reach before the lake crowds.',
      'तलावावरील गर्दीपूर्वी पोहोचण्यासाठी सकाळी निघा.']
  },
  kolhapur: {
    about: ['Kolhapur brings Mahalakshmi temple, Panhala fort, Kolhapuri chappals and its famous food into one stop on the southern route',
      'कोल्हापूरात महालक्ष्मी मंदिर, पन्हाळा किल्ला, कोल्हापुरी चपला आणि स्वादिष्ट अन्न दक्षिणेतील एकाच थांब्यात मिळते'],
    pickup: ['the railway station, Rajarampuri, Mahadwar Road and the bus stand',
      'रेल्वे स्थानक, राजारामपुरी, महाद्वार रोड आणि बस स्थानक'],
    tip: ['travel after breakfast for an easy ghat crossing.',
      'नाश्त्यानंतर प्रवास करा, घाट ओलांडणे सोपे जाईल.']
  }
};
const MR_NAME = {
  pune: 'पुणे', mumbai: 'मुंबई', sambhajinagar: 'छत्रपती संभाजीनगर',
  nashik: 'नाशिक', ahilyanagar: 'अहिल्यानगर', shirdi: 'शिर्डी',
  lonavala: 'लोणावळा', mahabaleshwar: 'महाबळेश्वर', kolhapur: 'कोल्हापूर'
};
const inr = n => '₹' + n.toLocaleString('en-IN');

// Origin-city photo for the detail aside (destination already appears in the
// fare widget and route modal). Filenames mirror app.js CITY_PHOTO; alts are
// descriptive and ship to i18n.js MR for translation.
const RD_PHOTO = {
  pune: 'Shaniwar%20wada%20%28pune%29.jpg',
  mumbai: 'Mumbai%20Skyline%20Marine%20Drive%20Night.jpg',
  nashik: 'River%20Godavari%20Nashik%20-%20panoramio.jpg',
  sambhajinagar: 'Ellora%20Caves%2C%20India%2C%20Kailasanatha%20Temple%202.jpg',
  ahilyanagar: 'Ahmednagar%20Fort%20Main%20Gate.jpg',
  shirdi: 'Samadhi%20Mandir%20of%20Shirdi%20Sai%20Baba.jpg',
  mahabaleshwar: 'Picturesque%20-%20Mahabhaleshwar%20-%20Panchghani%20%285767643681%29.jpg',
  kolhapur: 'Mahalaxmi%20Temple%2C%20Kolhapur%2C%20Maharashtra%2009.jpg',
  lonavala: 'Karla%20caves%20Chaitya.jpg'
};
const RD_ALT = {
  pune: 'Shaniwar Wada in Pune',
  mumbai: 'Marine Drive skyline at night in Mumbai',
  nashik: 'Godavari river at Nashik',
  sambhajinagar: 'Kailasanatha temple at Ellora Caves',
  ahilyanagar: 'Main gate of Ahmednagar Fort',
  shirdi: 'Samadhi Mandir of Shirdi Sai Baba',
  mahabaleshwar: 'Panchgani valley near Mahabaleshwar',
  kolhapur: 'Mahalaxmi temple in Kolhapur',
  lonavala: 'Karla caves near Lonavala'
};

// The generated detail section: breadcrumb, unique prose, facts, facilities,
// booking steps and a BreadcrumbList JSON-LD. Both languages ship in the HTML
// (data-en / data-mr); app.js translateRouteDetail() only swaps which is shown.
function routeDetailHtml(route) {
  const A = route.from, B = route.to;
  const aId = NAME_TO_ID[A.toLowerCase()], bId = NAME_TO_ID[B.toLowerCase()];
  const kt = ktOf(A.toLowerCase(), B.toLowerCase());
  if (!kt) throw new Error('KM_TIME missing for ' + A + '|' + B);
  const via = VIA[aId + '|' + bId];
  if (!via) throw new Error('VIA missing for ' + aId + '|' + bId);
  const a = CITY_INFO[aId], b = CITY_INFO[bId];
  if (!a || !b) throw new Error('CITY_INFO missing for ' + aId + ' / ' + bId);
  const [km, time, sed, suv] = kt;
  const an = MR_NAME[aId], bn = MR_NAME[bId];
  const slug = slugOf(A) + '-to-' + slugOf(B) + '-cab';
  const revSlug = slugOf(B) + '-to-' + slugOf(A) + '-cab';
  const url = baseUrl + '/' + slug;

  const h2en = `About the ${A} to ${B} route`;
  const h2mr = `${an} ते ${bn} मार्गाबद्दल`;

  const en = [
    `The ${A} to ${B} one-way cab covers about ${km} km ${via[0]} and usually takes ${time} door to door. The fare is fixed before you travel: Sedan ${inr(sed)}, SUV ${inr(suv)}, toll and parking included. It is one way, so there is no return fare to pay.`,
    `Doorstep pickup in ${A} covers ${a.pickup[0]}; in ${B} we drop you at ${b.pickup[0]}. One car does the whole trip, which makes it the practical option for station transfers, hotel check-ins, airport runs and family luggage.`,
    `${b.about[0]}. Travellers book this cab for temple visits, hill weekends, business meetings and long-distance family travel without changing vehicles on the way.`,
    `When to travel: from ${A}, ${a.tip[0]} From ${B}, ${b.tip[0]}`
  ];
  const mr = [
    `${an} ते ${bn} वन-वे कॅब सुमारे ${km} किमी ${via[1]} धावते आणि दरवाजापासून दरवाजापर्यंत साधारण ${time} वेळ घेते. भाडे प्रवासापूर्वीच ठरलेले: सेडान ${inr(sed)}, एसयूव्ही ${inr(suv)}, टोल व पार्किंग समाविष्ट. हा वन-वे प्रवास आहे, त्यामुळे परतीचे भाडे द्यावे लागत नाही.`,
    `${an} मध्ये दरवाजापासून पिकअप: ${a.pickup[1]}; ${bn} मध्ये ड्रॉप: ${b.pickup[1]}. संपूर्ण प्रवासासाठी तीच गाडी चालते - स्थानिक बदली, हॉटेल चेक-इन, विमानतळ व कुटुंबासह प्रवासासाठी ही सोपी पर्याय.`,
    `${b.about[1]}. मंदिर दर्शन, डोंगरी सहली, व्यावसायिक बैठका आणि कुटुंबासह लांबचा प्रवास यासाठी ही कॅब बुक करतात - वाटेत वाहन बदलणे गरजेचे नाही.`,
    `प्रवास कधी: ${an} मधून, ${a.tip[1]} ${bn} मधून, ${b.tip[1]}`
  ];
  const pHtml = en.map((t, i) =>
    `          <p${i === 0 ? ' class="rdetail__lead"' : ''} data-rd data-en="${t}" data-mr="${mr[i]}">${t}</p>`
  ).join('\n');

  const incl = [
    'Fixed one-way fare, no return charges',
    'Toll, parking and driver allowance included',
    'Doorstep pickup and drop in both cities',
    'Sedan for 4 passengers, SUV for 6-7 with luggage',
    'Driver and car details sent before pickup',
    'Cash or UPI payment after the trip'
  ].map(x => `            <li>${x}</li>`).join('\n');

  const steps = [
    ['Send your route', 'Pick your cities above or send us a message. We reply with the exact fare for your date.'],
    ['We confirm your car', 'You get the car, the driver\'s name and the pickup time in one message. No waiting on hold.'],
    ['Ride and pay at drop', 'Pay by cash or UPI when you reach. The fare does not change on the road.']
  ].map(([h, body]) => `            <li><b>${h}</b><span>${body}</span></li>`).join('\n');

  const bc = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl + '/' },
      { '@type': 'ListItem', position: 2, name: 'All routes', item: baseUrl + '/routes' },
      { '@type': 'ListItem', position: 3, name: `${A} to ${B} cab`, item: url }
    ]
  };

  return `
  <!-- ============ ROUTE DETAIL (generated per route) ============ -->
  <section class="section rdetail" aria-label="About this route">
    <div class="wrap">
      <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/routes">All routes</a><span aria-hidden="true">/</span><span aria-current="page" data-i18n-route="${aId}|${bId}">${A} to ${B} cab</span></nav>
      <div class="rdetail__head" data-reveal>
        <h2 class="rdetail__h2" data-rd data-en="${h2en}" data-mr="${h2mr}">${h2en}</h2>
        <ul class="rdetail__facts">
          <li><b>${km} km</b><span>Distance</span></li>
          <li><b>${time}</b><span>Duration</span></li>
          <li><b>${inr(sed)}</b><span>Sedan from</span></li>
          <li><b>${inr(suv)}</b><span>SUV from</span></li>
        </ul>
      </div>
      <div class="rdetail__grid">
        <div class="rdetail__body">
${pHtml}
        </div>
        <aside class="rdetail__side" data-reveal>
          <figure class="rdetail__pic">
            <img src="https://commons.wikimedia.org/wiki/Special:FilePath/${RD_PHOTO[aId]}?width=720" alt="${RD_ALT[aId]}" width="720" height="450" loading="lazy" decoding="async" />
          </figure>
          <h3>What's included</h3>
          <ul class="rdetail__incl">
${incl}
          </ul>
        </aside>
      </div>
      <div class="rdetail__book" data-reveal>
        <h3>Book this route</h3>
        <ol class="rdetail__steps">
${steps}
        </ol>
        <div class="rdetail__cta">
          <a class="btn btn--wa" href="#" data-wa-link><svg class="ic" aria-hidden="true"><use href="#i-wa"/></svg><span>Book on WhatsApp</span></a>
          <a class="btn btn--ghost" href="tel:+918605953737" data-phone-link><svg class="ic" aria-hidden="true"><use href="#i-phone"/></svg><span>Call 24x7</span></a>
          <a class="rdetail__rev" href="/${revSlug}" data-i18n-route="${bId}|${aId}">${B} to ${A} cab</a>
        </div>
      </div>
    </div>
    <script type="application/ld+json">${JSON.stringify(bc)}</script>
  </section>
`;
}

const RAIL_ANCHOR = '  <!-- ============ LIVE ROUTE RAIL ============ -->';

if (!fs.existsSync('routes')) {
    fs.mkdirSync('routes');
}

routes.forEach(route => {
  const slug = `${route.from.toLowerCase().replace(/ /g, '-')}-to-${route.to.toLowerCase().replace(/ /g, '-')}-cab`;
  const url = `${baseUrl}/${slug}`;
  sitemapUrls.push(url);

  const title = `One-Way Cab ${route.from} to ${route.to} | Shivrudra Taxi`;
  const description = `Book a one-way cab from ${route.from} to ${route.to} with Shivrudra Taxi. Fixed fares, 24x7 service, sedan and SUV options. Door-to-door taxi pickup.`;
  const h1 = `Cab from ${route.from} to ${route.to}`;

  let pageHtml = templateWithFooter;
  
  // Replace Title
  pageHtml = pageHtml.replace(/<title>.*?<\/title>/, `<title>${title}</title>`);
  
  // Replace Meta Description
  pageHtml = pageHtml.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${description}" />`);
  
  // Replace Canonical
  pageHtml = pageHtml.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${url}" />`);
  
  // Replace OG tags
  pageHtml = pageHtml.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title}" />`);
  pageHtml = pageHtml.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${description}" />`);
  pageHtml = pageHtml.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${url}" />`);
  
  // Replace Twitter tags
  pageHtml = pageHtml.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${title}" />`);
  pageHtml = pageHtml.replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${description}" />`);
  
  // Replace H1
  pageHtml = pageHtml.replace(/<h1 class="hero__h1" data-hero="1">.*?<\/h1>/, `<h1 class="hero__h1" data-hero="1">${h1}</h1>`);
  
  // Update Schema JSON-LD
  const schemaMatch = pageHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (schemaMatch) {
    const schemaObj = JSON.parse(schemaMatch[1]);
    schemaObj.description = description;
    schemaObj.url = url;
    pageHtml = pageHtml.replace(schemaMatch[1], JSON.stringify(schemaObj, null, 2) + '\n');
  }

  // Pre-fill the form selects if possible (this requires client-side JS modification, but we can set defaults dynamically via a small script)
  const prefillScript = `
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        const fromSelect = document.getElementById('from');
        const toSelect = document.getElementById('to');
        if(fromSelect && toSelect) {
           const fromOpt = Array.from(fromSelect.options).find(o => o.value.toLowerCase() === '${NAME_TO_ID[route.from.toLowerCase()]}');
           const toOpt = Array.from(toSelect.options).find(o => o.value.toLowerCase() === '${NAME_TO_ID[route.to.toLowerCase()]}');
           if(fromOpt) fromSelect.value = fromOpt.value;
           if(toOpt) toSelect.value = toOpt.value;
           // Trigger change on BOTH selects so bookState updates fully before fare renders
           fromSelect.dispatchEvent(new Event('change'));
           toSelect.dispatchEvent(new Event('change'));
        }
      }, 500);
    });
  </script>
  </body>
  `;
  pageHtml = pageHtml.replace(/<\/body>/, prefillScript);

  // Route detail module: unique prose + facts + facilities + booking info,
  // injected right after the hero so the /routes hub slice drops it cleanly.
  if (!pageHtml.includes(RAIL_ANCHOR)) throw new Error('rail anchor missing on ' + slug);
  pageHtml = pageHtml.replace(RAIL_ANCHOR, routeDetailHtml(route) + '\n' + RAIL_ANCHOR);

  // Related-routes footer: reverse direction first, then up to 4 same-origin
  // pairs, then same-destination pairs to fill. Keeps every page internally
  // linked without the 36-link boilerplate.
  const rel = [{ from: route.to, to: route.from }];
  for (const [f, t] of pairs) {
    if (rel.length >= 5) break;
    if (f === route.from && t !== route.to) rel.push({ from: f, to: t });
  }
  for (const [f, t] of pairs) {
    if (rel.length >= 5) break;
    if (t === route.to && !(f === route.to && t === route.from) && !rel.some(r => r.from === f && r.to === t)) rel.push({ from: f, to: t });
  }
  const relBlock =
    '  <div class="wrap">\n' +
    '    <nav class="footer__seo" aria-label="Related one-way cab routes">\n' +
    '      <h2 class="footer__seo-title">Related routes</h2>\n' +
    '      <ul class="footer__seo-list footer__seo-list--related">\n' +
    rel.map(({ from: f, to: t }) => {
      const a = NAME_TO_ID[f.toLowerCase()], b = NAME_TO_ID[t.toLowerCase()];
      return `        <li><a href="/${slugOf(f)}-to-${slugOf(t)}-cab" data-i18n-route="${a}|${b}">${f} to ${t}&nbsp;cab</a></li>`;
    }).join("\n") +
    '\n      </ul>\n' +
    '    </nav>\n' +
    '  </div>\n\n';
  pageHtml = pageHtml.replace('  <div class="wrap footer__base">', relBlock + '  <div class="wrap footer__base">');

  // Slim route landing pages: keep header, hero (prefilled booking), the
  // detail module, related links, CTA band and footer. Drop the homepage
  // browsing sections and the route modal (only rail cards open it) so each
  // route page reads as its own landing page, not a copy of home.
  const stripById = (html, id) => {
    const idIdx = html.indexOf('id="' + id + '"');
    if (idIdx === -1) return html;
    const openIdx = html.lastIndexOf('<section', idIdx);
    if (openIdx === -1) throw new Error('section open missing for ' + id + ' on ' + slug);
    const closeIdx = html.indexOf('</section>', idIdx);
    if (closeIdx === -1) throw new Error('section close missing for ' + id + ' on ' + slug);
    return html.slice(0, openIdx) + html.slice(closeIdx + '</section>'.length);
  };
  ['live', 'routes', 'pool', 'fleet', 'why', 'how', 'reviews', 'network', 'truststrip'].forEach(id => { pageHtml = stripById(pageHtml, id); });
  const RMODAL_OPEN = '<!-- ============ ROUTE DETAIL MODAL ============ -->';
  const FLOATERS_OPEN = '<!-- ============ FLOATING CTAs ============ -->';
  {
    const a = pageHtml.indexOf(RMODAL_OPEN), b = pageHtml.indexOf(FLOATERS_OPEN);
    if (a === -1 || b === -1 || a > b) throw new Error('modal anchors unsafe on ' + slug);
    pageHtml = pageHtml.slice(0, a) + pageHtml.slice(b);
  }
  if (!pageHtml.includes('hero__scroll" href="#routes"')) throw new Error('hero scroll link missing on ' + slug);
  pageHtml = pageHtml.replace('hero__scroll" href="#routes" aria-label="Scroll to routes"', 'hero__scroll" href="/routes" aria-label="Browse all routes"');
  {
    const opens = (pageHtml.match(/<section/g) || []).length;
    const closes = (pageHtml.match(/<\/section>/g) || []).length;
    if (opens !== closes || opens !== 3) throw new Error('route slim count wrong on ' + slug + ': ' + opens);
    ['id="railTrack"', 'id="rmodal"', 'id="poolform"', 'id="revForm"', 'section rdetail', 'class="ctaband"'].forEach(s => {
      const want = s === 'section rdetail' || s === 'class="ctaband"';
      if (pageHtml.includes(s) !== want) throw new Error('route slim content wrong on ' + slug + ': ' + s);
    });
  }

  fs.writeFileSync(`${slug}.html`, pageHtml);
});

// ---------- Routes hub (/routes) ----------
// Distances/times/fares come from KM_TIME above (mirrors app.js ROUTES);
// fares are used only by the route pages, never rendered on the hub.
const ORIGIN_INTROS = {
  'Pune': "Maharashtra's busiest one-way corridor, airport drops, IT travel and weekend getaways.",
  'Mumbai': "Maximum city non-stop demand, airport runs, business trips and coastal escapes, day and night.",
  'Chhatrapati Sambhajinagar': "Marathwada's gateway, heritage caves, temple towns and business travel across the region.",
  'Nashik': "Wine country and pilgrim trails, Trimbakeshwar, Shirdi and Mumbai connections around the clock.",
  'Ahilyanagar': "Central Maharashtra's crossroads, Shirdi pilgrims and Pune commuters pass through daily.",
  'Aurangabad': "Marathwada's gateway, heritage caves, temple towns and business travel across the region."
};
const hubUrl = `${baseUrl}/routes`;
sitemapUrls.push(hubUrl);
sitemapUrls.push(`${baseUrl}/profile`);
sitemapUrls.push(`${baseUrl}/share`);
sitemapUrls.push(`${baseUrl}/privacy`);
sitemapUrls.push(`${baseUrl}/terms`);

const origins = [];
pairs.forEach(([f]) => { if (!origins.includes(f)) origins.push(f); });
const hubGroups = origins.map(origin => {
  const rows = pairs
    .filter(([f]) => f === origin)
    .map(([f, t]) => {
      const a = NAME_TO_ID[f.toLowerCase()], b = NAME_TO_ID[t.toLowerCase()];
      const kt = KM_TIME[f.toLowerCase() + '|' + t.toLowerCase()] || ['-', '-'];
      return `          <li class="hubdir__row">
            <div class="hubdir__place"><span data-i18n-city="${a}">${f}</span> <span aria-hidden="true">&rarr;</span> <span data-i18n-city="${b}">${t}</span><small>${kt[0]} km &middot; ${kt[1]}</small></div>
            <div class="hubdir__links">
              <a href="/${slugOf(f)}-to-${slugOf(t)}-cab" data-i18n-route="${a}|${b}">${f} to ${t}&nbsp;cab</a>
              <a href="/${slugOf(t)}-to-${slugOf(f)}-cab" data-i18n-route="${b}|${a}">${t} to ${f}&nbsp;cab</a>
            </div>
          </li>`;
    }).join("\n");
  return `        <section class="hubdir__group" aria-label="Cabs from ${origin}">
          <h2>Cabs from ${origin}</h2>
          <p class="hubdir__intro">${ORIGIN_INTROS[origin]}</p>
          <ul class="hubdir__list">
${rows}
          </ul>
        </section>`;
}).join("\n");

const hubHero = `    <section class="hubhero">
      <div class="wrap">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">All routes</span></nav>
        <h1>All one-way cab routes across Maharashtra</h1>
        <p class="lede">Every fixed-fare route we run, grouped by starting city. Choose a direction to see live fares and book in one tap.</p>
      </div>
    </section>
`;
const hubDir = `    <section class="section hubdir" aria-label="Route directory">
      <div class="wrap">
${hubGroups}
      </div>
    </section>
`;
const hubTitle = 'All One-Way Cab Routes in Maharashtra | Shivrudra Taxi';
const hubDesc = 'Browse every fixed-fare one-way cab route across Maharashtra, grouped by starting city, with distances, durations and instant booking.';
let hubPage = templateWithFooter;
{
  const heroIdx = hubPage.indexOf('<section class="hero">');
  const faqIdx = hubPage.indexOf('<section class="ctaband">');
  const dropped = hubPage.slice(heroIdx, faqIdx);
  const opens = (dropped.match(/<section/g) || []).length;
  const closes = (dropped.match(/<\/section>/g) || []).length;
  if (heroIdx === -1 || faqIdx === -1 || heroIdx > faqIdx || opens !== closes || opens < 7) throw new Error('hub slice anchors unsafe');
  hubPage = hubPage.slice(0, heroIdx) + hubHero + hubDir + hubPage.slice(faqIdx);
}
// The hub has no booking widget, so footer route links go straight to the
// dedicated route pages instead of the JS prefill links used on home.
{
  const SLUG = { pune: "pune", mumbai: "mumbai", sambhajinagar: "chhatrapati-sambhajinagar", nashik: "nashik", ahilyanagar: "ahilyanagar", shirdi: "shirdi", mahabaleshwar: "mahabaleshwar", kolhapur: "kolhapur", lonavala: "lonavala" };
  hubPage = hubPage.replace(/href="#routes" data-route-link="([a-z]+)\|([a-z]+)"/g, (m, x, y) => {
    if (!SLUG[x] || !SLUG[y]) throw new Error("bad hub route link " + m);
    return 'href="/' + SLUG[x] + "-to-" + SLUG[y] + '-cab"';
  });
}
hubPage = hubPage.replace(/<title>.*?<\/title>/, `<title>${hubTitle}</title>`);
hubPage = hubPage.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${hubDesc}" />`);
hubPage = hubPage.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${hubUrl}" />`);
hubPage = hubPage.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${hubTitle}" />`);
hubPage = hubPage.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${hubDesc}" />`);
hubPage = hubPage.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${hubUrl}" />`);
hubPage = hubPage.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${hubTitle}" />`);
hubPage = hubPage.replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${hubDesc}" />`);
const hubItems = routes.map((r, i) => {
  const u = `${baseUrl}/${slugOf(r.from)}-to-${slugOf(r.to)}-cab`;
  return `      {"@type": "ListItem", "position": ${i + 1}, "name": "${r.from} to ${r.to} cab", "url": "${u}"}`;
}).join(",\n");
hubPage = hubPage.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,
  `<script type="application/ld+json">{"@context": "https://schema.org", "@type": "ItemList", "name": "Shivrudra Taxi one-way cab routes", "numberOfItems": ${routes.length}, "itemListElement": [\n${hubItems}\n    ]}</script>`);
fs.writeFileSync('routes.html', hubPage);

// Generate Sitemap
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `  <url>\n    <loc>${url}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${url === baseUrl + '/' ? '1.0' : '0.8'}</priority>\n  </url>`).join('\n')}
</urlset>`;

fs.writeFileSync('sitemap.xml', sitemapXml);

// Generate Robots.txt
const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml`;

fs.writeFileSync('robots.txt', robotsTxt);

console.log('Successfully generated 36 route pages, routes hub, sitemap.xml, and robots.txt');
