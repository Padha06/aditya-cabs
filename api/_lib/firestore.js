// Minimal Firestore REST client for Vercel serverless functions.
// Uses the service account in FIREBASE_SERVICE_ACCOUNT to mint an OAuth2 token
// (RS256 JWT) — no npm dependencies, matching the project's zero-dep style.
const crypto = require("crypto");

let cache = null; // { token, exp }

function sa() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) return null;
  try { return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); }
  catch (e) { return null; }
}

const b64url = (buf) => Buffer.from(buf).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

async function token() {
  const creds = sa();
  if (!creds) throw new Error("FIREBASE_SERVICE_ACCOUNT missing");
  if (cache && cache.exp > Date.now() + 60000) return cache.token;
  const iat = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: creds.token_uri,
    iat,
    exp: iat + 3600
  }));
  const signingInput = header + "." + claims;
  const sig = b64url(crypto.createSign("RSA-SHA256").update(signingInput).sign(creds.private_key));
  const jwt = signingInput + "." + sig;
  const r = await fetch(creds.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + jwt
  });
  const d = await r.json();
  if (!d.access_token) throw new Error("Firestore auth failed: " + JSON.stringify(d));
  cache = { token: d.access_token, exp: Date.now() + (d.expires_in || 3600) * 1000 };
  return cache.token;
}

const base = () => `https://firestore.googleapis.com/v1/projects/${sa().project_id}/databases/(default)/documents`;

/* ---- value <-> Firestore REST mapping ---- */
function toValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === "object") return { mapValue: { fields: toFields(v) } };
  return { stringValue: String(v) };
}
function toFields(o) { const f = {}; for (const k in o) { if (o[k] !== undefined) f[k] = toValue(o[k]); } return f; }
function fromValue(v) {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromValue);
  if ("mapValue" in v) return fromFields(v.mapValue.fields || {});
  return null;
}
function fromFields(f) { const o = {}; for (const k in f) o[k] = fromValue(f[k]); return o; }
const idOf = (name) => String(name || "").split("/").pop();

/* ---- operations ---- */
async function setDoc(path, data, { merge = true } = {}) {
  const t = await token();
  let url = `${base()}/${path}`;
  if (merge) {
    const mask = Object.keys(data).map((k) => "updateMask.fieldPaths=" + encodeURIComponent(k)).join("&");
    url += "?" + mask;
  }
  const r = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: "Bearer " + t, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toFields(data) })
  });
  if (!r.ok) throw new Error("setDoc " + r.status + " " + (await r.text()));
  return true;
}

async function getDoc(path) {
  const t = await token();
  const r = await fetch(`${base()}/${path}`, { headers: { Authorization: "Bearer " + t } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("getDoc " + r.status + " " + (await r.text()));
  const d = await r.json();
  return Object.assign({ id: idOf(d.name) }, fromFields(d.fields || {}));
}

async function addDoc(collectionName, data) {
  const t = await token();
  const r = await fetch(`${base()}/${collectionName}`, {
    method: "POST",
    headers: { Authorization: "Bearer " + t, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toFields(data) })
  });
  if (!r.ok) throw new Error("addDoc " + r.status + " " + (await r.text()));
  const d = await r.json();
  return Object.assign({ id: idOf(d.name) }, fromFields(d.fields || {}));
}

async function runQuery(collectionName, field, value) {
  const t = await token();
  const body = {
    structuredQuery: {
      from: [{ collectionId: collectionName }],
      where: { fieldFilter: { field: { fieldPath: field }, op: "EQUAL", value: toValue(value) } }
    }
  };
  const r = await fetch(`${base()}:runQuery`, {
    method: "POST",
    headers: { Authorization: "Bearer " + t, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error("query " + r.status + " " + (await r.text()));
  const arr = await r.json();
  return arr.filter((x) => x.document).map((x) => Object.assign({ id: idOf(x.document.name) }, fromFields(x.document.fields || {})));
}

module.exports = { setDoc, getDoc, addDoc, runQuery, available: () => !!sa() };
