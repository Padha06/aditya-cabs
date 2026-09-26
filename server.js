/* ============================================================================
   ADITYA CABS - static host + shared reviews API
   ---------------------------------------------------------------------------
   Zero dependencies. Run with:   node server.js
   Then open:                     http://localhost:5500/

   Endpoints
     GET    /api/reviews        -> newest first, JSON array
     POST   /api/reviews        -> { name, route, rating, text } -> the new review
     DELETE /api/reviews?id=..  -> removes a review

   Reviews are stored in reviews.json next to this file. That is fine for a
   single small server (Railway, Render, a VPS). On a serverless host such as
   Vercel the filesystem is read-only, so swap the two storage functions below
   for a database (Vercel KV, Supabase, Postgres) and the front end keeps
   working unchanged.
   ========================================================================= */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 5500;
const ROOT = __dirname;
const DATA = path.join(ROOT, "reviews.json");
const MAX_REVIEWS = 300;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

/* ---------- storage (swap these two for a database in production) ---------- */
function readReviews() {
  try {
    const raw = fs.readFileSync(DATA, "utf8");
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function writeReviews(list) {
  try {
    fs.writeFileSync(DATA, JSON.stringify(list.slice(0, MAX_REVIEWS), null, 2));
  } catch (e) {
    console.error("could not persist reviews:", e.message);
  }
}

/* ---------- helpers ---------- */
const send = (res, code, body, type) => {
  res.writeHead(code, {
    "Content-Type": type || "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(body);
};

const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);

// very small in-memory guard: 6 posts per IP per 10 minutes
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip) || { n: 0, t: now };
  if (now - rec.t > 10 * 60 * 1000) { rec.n = 0; rec.t = now; }
  rec.n += 1;
  hits.set(ip, rec);
  if (hits.size > 5000) hits.clear();
  return rec.n > 6;
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", c => {
      body += c;
      if (body.length > limit) { reject(new Error("too large")); req.destroy(); }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

/* ---------- server ---------- */
const server = http.createServer(async (req, res) => {
  let url;
  try { url = new URL(req.url, "http://localhost"); }
  catch (e) { return send(res, 400, JSON.stringify({ error: "bad url" })); }

  /* ---- API ---- */
  if (url.pathname === "/api/reviews") {
    if (req.method === "GET") {
      return send(res, 200, JSON.stringify(readReviews()));
    }

    if (req.method === "POST") {
      const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "?";
      if (rateLimited(ip)) return send(res, 429, JSON.stringify({ error: "Too many reviews, please try later." }));

      let raw;
      try { raw = await readBody(req, 4000); }
      catch (e) { return send(res, 413, JSON.stringify({ error: "too large" })); }

      let data;
      try { data = JSON.parse(raw || "{}"); }
      catch (e) { return send(res, 400, JSON.stringify({ error: "bad json" })); }

      const name = clean(data.name, 60);
      const text = clean(data.text, 220);
      const route = clean(data.route, 80);
      const rating = Math.min(5, Math.max(1, parseInt(data.rating, 10) || 5));

      if (name.length < 2) return send(res, 400, JSON.stringify({ error: "Name is too short." }));
      if (text.length < 12) return send(res, 400, JSON.stringify({ error: "Review is too short." }));

      const item = {
        id: "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name, route, rating, text, at: Date.now()
      };
      const list = readReviews();
      list.unshift(item);
      writeReviews(list);
      return send(res, 201, JSON.stringify(item));
    }

    if (req.method === "DELETE") {
      const id = url.searchParams.get("id");
      if (!id) return send(res, 400, JSON.stringify({ error: "id required" }));
      const list = readReviews();
      const next = list.filter(r => r.id !== id);
      if (next.length === list.length) return send(res, 404, JSON.stringify({ error: "not found" }));
      writeReviews(next);
      return send(res, 200, JSON.stringify({ ok: true }));
    }

    res.writeHead(405, { Allow: "GET, POST, DELETE" });
    return res.end();
  }

  /* ---- static ---- */
  let rel = decodeURIComponent(url.pathname);
  if (rel === "/" || rel === "") rel = "/index.html";

  const target = path.join(ROOT, path.normalize(rel).replace(/^(\.\.[/\\])+/, ""));
  if (!target.startsWith(ROOT)) return send(res, 403, "Forbidden", "text/plain; charset=utf-8");

  fs.stat(target, (err, stat) => {
    if (err || !stat.isFile()) {
      return send(res, 404, "Not found", "text/plain; charset=utf-8");
    }
    const type = MIME[path.extname(target).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-cache" });
    fs.createReadStream(target).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Aditya Cabs running on http://localhost:${PORT}/`);
  console.log(`Shared reviews API on http://localhost:${PORT}/api/reviews`);
});
