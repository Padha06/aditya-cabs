// Verifies a Firebase ID token server-side (RS256 against Google's public
// certs) — dependency-free, used to authenticate the admin.
const crypto = require("crypto");

let cache = { keys: null, exp: 0 };

function projectId() {
  try { return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT).project_id; }
  catch (e) { return ""; }
}

async function publicKeys() {
  if (cache.keys && cache.exp > Date.now()) return cache.keys;
  const r = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
  if (!r.ok) throw new Error("Could not fetch Firebase public certs");
  const keys = await r.json();
  const m = String(r.headers.get("cache-control") || "").match(/max-age=(\d+)/);
  cache = { keys, exp: Date.now() + (m ? Number(m[1]) * 1000 : 3600000) };
  return keys;
}

const b64urlDecode = (s) => Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64");

async function verifyIdToken(idToken) {
  try {
    const parts = String(idToken || "").split(".");
    if (parts.length !== 3) return null;
    const [h, p, sig] = parts;
    const header = JSON.parse(b64urlDecode(h).toString("utf8"));
    const payload = JSON.parse(b64urlDecode(p).toString("utf8"));
    const keys = await publicKeys();
    const pem = keys[header.kid];
    if (!pem) return null;
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(h + "." + p);
    if (!verifier.verify(pem, b64urlDecode(sig))) return null;

    const now = Math.floor(Date.now() / 1000);
    const pid = projectId();
    if (payload.exp < now || payload.iat > now + 60) return null;
    if (payload.aud !== pid) return null;
    if (payload.iss !== "https://securetoken.google.com/" + pid) return null;
    return { uid: payload.sub || payload.user_id, email: payload.email || "" };
  } catch (e) {
    return null;
  }
}

module.exports = { verifyIdToken };
