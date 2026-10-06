// Shared signed-cookie session for the phone (WhatsApp OTP) account layer.
// Dependency-free: HMAC-SHA256 over a base64url payload.
const crypto = require("crypto");

const SECRET = process.env.SESSION_SECRET || "";
const COOKIE = "st_session";
const ADMIN_COOKIE = "st_admin";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const b64url = (buf) => Buffer.from(buf).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
const b64urlDecode = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");

function sign(payload) {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac("sha256", SECRET).update(body).digest());
  return body + "." + sig;
}

function verify(token) {
  if (!SECRET || !token || token.indexOf(".") === -1) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = b64url(crypto.createHmac("sha256", SECRET).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let data;
  try { data = JSON.parse(b64urlDecode(body)); } catch (e) { return null; }
  if (!data.exp || Date.now() > data.exp) return null;
  return data;
}

function parseCookies(req) {
  const out = {};
  String((req && req.headers && req.headers.cookie) || "").split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}

function createSession(res, user) {
  if (!SECRET) return null;
  const now = Date.now();
  const token = sign({ uid: user.id, phone: user.phone, iat: now, exp: now + MAX_AGE * 1000 });
  res.setHeader("Set-Cookie", `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`);
  return token;
}

function clearSession(res) {
  res.setHeader("Set-Cookie", `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

function getSession(req) {
  return verify(parseCookies(req)[COOKIE]);
}

// Admin sessions use a separate cookie + a role claim.
function createAdminSession(res, admin) {
  if (!SECRET) return null;
  const now = Date.now();
  const token = sign({ role: "admin", uid: admin.uid || admin.email, email: admin.email, iat: now, exp: now + MAX_AGE * 1000 });
  res.setHeader("Set-Cookie", `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`);
  return token;
}
function clearAdminSession(res) {
  res.setHeader("Set-Cookie", `${ADMIN_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}
function getAdminSession(req) {
  const data = verify(parseCookies(req)[ADMIN_COOKIE]);
  return (data && data.role === "admin") ? data : null;
}

function adminEmails() {
  return String(process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}
function isAdminEmail(email) {
  const list = adminEmails();
  if (!list.length) return false;
  return list.indexOf(String(email || "").toLowerCase()) !== -1;
}

module.exports = { createSession, clearSession, getSession, COOKIE, createAdminSession, clearAdminSession, getAdminSession, isAdminEmail, adminEmails };
