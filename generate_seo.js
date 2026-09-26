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
  ['Ahilyanagar', 'Shirdi']
];

const routes = [];
pairs.forEach(([from, to]) => {
  routes.push({ from, to });
  routes.push({ from: to, to: from });
}); // 32 routes total

const htmlTemplate = fs.readFileSync('index.html', 'utf8');

const sitemapUrls = [];
const baseUrl = 'https://adityacabs.in';

sitemapUrls.push(`${baseUrl}/`);

// Internal linking list
let internalLinksHtml = `<div class="footer-routes" style="padding: 2rem 0; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 2rem;">
  <h3 style="margin-bottom: 1rem; font-size: 1.2rem; color: #fff;">Popular One-Way Cab Routes</h3>
  <div style="display: flex; flex-wrap: wrap; gap: 1rem;">`;

routes.forEach(route => {
  const slug = `${route.from.toLowerCase().replace(/ /g, '-')}-to-${route.to.toLowerCase().replace(/ /g, '-')}-cab`;
  internalLinksHtml += `<a href="/${slug}" style="color: #F5A524; text-decoration: none; font-size: 0.9rem;">${route.from} to ${route.to} Cab</a>`;
});

internalLinksHtml += `</div></div>`;

// Ensure we don't duplicate the internal links footer if run multiple times
let templateWithFooter = htmlTemplate;
if (!templateWithFooter.includes('footer-routes')) {
    templateWithFooter = templateWithFooter.replace(/<div class="footer__brand">/, `${internalLinksHtml}\n    <div class="footer__brand">`);
    fs.writeFileSync('index.html', templateWithFooter);
}

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
           const fromOpt = Array.from(fromSelect.options).find(o => o.value.toLowerCase() === '${route.from.toLowerCase()}');
           const toOpt = Array.from(toSelect.options).find(o => o.value.toLowerCase() === '${route.to.toLowerCase()}');
           if(fromOpt) fromSelect.value = fromOpt.value;
           if(toOpt) toSelect.value = toOpt.value;
           // Trigger change event to update fares if the form listens to it
           fromSelect.dispatchEvent(new Event('change'));
        }
      }, 500);
    });
  </script>
  </body>
  `;
  pageHtml = pageHtml.replace(/<\/body>/, prefillScript);

  fs.writeFileSync(`${slug}.html`, pageHtml);
});

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

console.log('Successfully generated 32 route pages, sitemap.xml, and robots.txt');
