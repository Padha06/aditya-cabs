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
  ['Mumbai', 'Ahilyanagar']
];

const routes = [];
pairs.forEach(([from, to]) => {
  routes.push({ from, to });
  routes.push({ from: to, to: from });
}); // 36 routes total (18 pairs x both directions)

const htmlTemplate = fs.readFileSync('index.html', 'utf8');

const sitemapUrls = [];
const baseUrl = 'https://adityacabs.in';

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
  'nashik': 'nashik',
  'ahilyanagar': 'ahilyanagar',
  'shirdi': 'shirdi',
  'lonavala': 'lonavala',
  'mahabaleshwar': 'mahabaleshwar',
  'kolhapur': 'kolhapur'
};
const slugOf = d => d.toLowerCase().replace(/ /g, '-');

if (!fs.existsSync('routes')) {
    fs.mkdirSync('routes');
}

routes.forEach(route => {
  const slug = `${route.from.toLowerCase().replace(/ /g, '-')}-to-${route.to.toLowerCase().replace(/ /g, '-')}-cab`;
  const url = `${baseUrl}/${slug}`;
  sitemapUrls.push(url);

  const title = `One-Way Cab ${route.from} to ${route.to} | Aditya Cabs`;
  const description = `Book a one-way cab from ${route.from} to ${route.to} with Aditya Cabs. Fixed fares, 24x7 service, sedan and SUV options. Door-to-door taxi pickup.`;
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

  fs.writeFileSync(`${slug}.html`, pageHtml);
});

// ---------- Routes hub (/routes) ----------
// Distances/times mirror app.js ROUTES (the runtime fare table); fares live
// only on the route pages and in the booking widget, never here.
const KM_TIME = {
  'pune|mumbai': [150, '3h 30m'],
  'pune|chhatrapati sambhajinagar': [235, '5h'],
  'pune|nashik': [210, '4h 30m'],
  'pune|ahilyanagar': [120, '2h 30m'],
  'pune|shirdi': [185, '4h'],
  'pune|lonavala': [65, '1h 30m'],
  'pune|mahabaleshwar': [120, '3h'],
  'pune|kolhapur': [230, '5h'],
  'mumbai|chhatrapati sambhajinagar': [340, '7h'],
  'mumbai|nashik': [165, '3h 30m'],
  'mumbai|shirdi': [240, '5h'],
  'mumbai|ahilyanagar': [255, '5h 30m'],
  'mumbai|lonavala': [85, '2h'],
  'mumbai|mahabaleshwar': [230, '4h 45m'],
  'nashik|chhatrapati sambhajinagar': [180, '4h'],
  'chhatrapati sambhajinagar|shirdi': [110, '2h 30m'],
  'nashik|shirdi': [90, '2h'],
  'ahilyanagar|shirdi': [85, '1h 50m']
};
const ORIGIN_INTROS = {
  'Pune': "Maharashtra's busiest one-way corridor, airport drops, IT travel and weekend getaways.",
  'Mumbai': "Maximum city non-stop demand, airport runs, business trips and coastal escapes, day and night.",
  'Chhatrapati Sambhajinagar': "Marathwada's gateway, heritage caves, temple towns and business travel across the region.",
  'Nashik': "Wine country and pilgrim trails, Trimbakeshwar, Shirdi and Mumbai connections around the clock.",
  'Ahilyanagar': "Central Maharashtra's crossroads, Shirdi pilgrims and Pune commuters pass through daily."
};
const hubUrl = `${baseUrl}/routes`;
sitemapUrls.push(hubUrl);

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
const hubTitle = 'All One-Way Cab Routes in Maharashtra | Aditya Cabs';
const hubDesc = 'Browse every fixed-fare one-way cab route across Maharashtra, grouped by starting city, with distances, durations and instant booking.';
let hubPage = templateWithFooter;
{
  const heroIdx = hubPage.indexOf('<section class="hero">');
  const faqIdx = hubPage.indexOf('<section class="section faq"');
  const dropped = hubPage.slice(heroIdx, faqIdx);
  const opens = (dropped.match(/<section/g) || []).length;
  const closes = (dropped.match(/<\/section>/g) || []).length;
  if (heroIdx === -1 || faqIdx === -1 || heroIdx > faqIdx || opens !== closes || opens < 7) throw new Error('hub slice anchors unsafe');
  hubPage = hubPage.slice(0, heroIdx) + hubHero + hubDir + hubPage.slice(faqIdx);
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
  `<script type="application/ld+json">{"@context": "https://schema.org", "@type": "ItemList", "name": "Aditya Cabs one-way cab routes", "numberOfItems": ${routes.length}, "itemListElement": [\n${hubItems}\n    ]}</script>`);
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
