/* ============================================================================
   SHIVRUDRA TAXI - booking-flow.js
   ---------------------------------------------------------------------------
   Controller for the dedicated one-way booking funnel:
     /cabs    (data-bf-page="cabs")    Step 1 - Select Cab
     /book    (data-bf-page="book")    Step 2 - Passenger + WhatsApp OTP
     /summary (data-bf-page="summary") Step 3 - Summary + Pay & Book
   Depends on booking-data.js (window.STBooking).
   ========================================================================= */
(function () {
  "use strict";

  const ST = window.STBooking;
  if (!ST) { console.error("booking-data.js not loaded"); return; }

  const $ = (s) => document.querySelector(s);
  const cleanPhone = (v) => String(v || "").replace(/\D/g, "").slice(-10);
  const page = document.body.getAttribute("data-bf-page");
  const flow = ST.loadFlow();

  const otpState = { token: null, verified: false, phone: "", timer: null, seconds: 30 };

  function showError(el, msg) {
    if (!el) { alert(msg); return; }
    el.hidden = false;
    el.textContent = msg;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function clearError(el) { if (el) { el.hidden = true; el.textContent = ""; } }

  document.addEventListener("DOMContentLoaded", () => {
    const start = () => {
      if (page === "cabs") initCabs();
      else if (page === "book") initBook();
      else if (page === "summary") initSummary();
    };
    // Wait for admin-edited config before rendering, so fares/routes are current.
    if (ST.ready && typeof ST.ready.then === "function") ST.ready.then(start).catch(start);
    else start();
  });

  /* =========================================================================
     STEP 1 - /cabs
     ====================================================================== */
  function routePillHTML() {
    const type = flow.type || "oneway";
    const dt = ST.dateTimeDisplay(flow.date, flow.time);
    let left = "", right = dt;
    if (type === "local") {
      left = `<span class="dot-blue"></span><b>${flow.city || "Pune"}</b><span class="route-note">Local package</span>`;
    } else if (type === "share") {
      const r = ST.SHARE_ROUTES.find((x) => x.key === flow.route) || ST.SHARE_ROUTES[0];
      const seats = Math.min(ST.SHARE_MAX_SEATS, Math.max(1, Number(flow.seats) || 1));
      left = `<span class="dot-blue"></span><b>${ST.cityName(r.a)}</b><span class="line-connector"></span><svg class="ic route-pin" aria-hidden="true"><use href="#i-pin"/></svg><b>${ST.cityName(r.b)}</b><span class="route-note">Shared · ${seats} seat${seats > 1 ? "s" : ""}</span>`;
    } else {
      const note = type === "round" ? '<span class="route-note">Round trip</span>' : "";
      left = `<span class="dot-blue"></span><b>${ST.cityName(flow.from)}</b><span class="line-connector"></span><svg class="ic route-pin" aria-hidden="true"><use href="#i-pin"/></svg><b>${ST.cityName(flow.to)}</b>${note}`;
      if (type === "round" && flow.rdate) right = `${dt} → ${ST.formatDate(flow.rdate)}`;
    }
    return `<div class="oneway-route-pill">
      <div class="oneway-route-line">${left}</div>
      <div class="oneway-route-schedule"><svg class="ic" aria-hidden="true" style="width:15px;height:15px"><use href="#i-cal"/></svg><span>${right}</span></div>
    </div>`;
  }

  function guaranteeHTML() {
    return `<div class="oneway-blue-guarantee">
      <div class="guarantee-icon"><svg viewBox="0 0 24 24" class="ic"><path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" fill="currentColor"/></svg></div>
      <div class="guarantee-text">
        <div class="guarantee-title"><span>WHAT YOU SEE IS WHAT YOU PAY</span><span class="guarantee-badge">GUARANTEED</span></div>
        <p>Tolls, driver allowance, GST and state permits are all included. No hidden charges.</p>
      </div>
    </div>`;
  }

  function helpStripHTML() {
    return `<div class="oneway-help-strip">
      <div class="help-left"><svg class="ic" aria-hidden="true" style="width:20px;height:20px;color:#0284C7"><use href="#i-phone"/></svg>
        <div><b>Need something special?</b><span>We're available 24/7: +91 60057 91807</span></div></div>
      <a href="tel:+916005791807" class="btn-help-link">Call dispatch <svg class="ic" aria-hidden="true" style="width:15px;height:15px"><use href="#i-arrow"/></svg></a>
    </div>`;
  }

  function genericCarCard(o) {
    const fuelClass = o.fuel ? (/diesel/i.test(o.fuel) && !/cng/i.test(o.fuel) ? "fuel-diesel" : "fuel-cng") : "";
    const popular = o.popular ? '<span class="star-badge"><svg class="ic ic--fill" aria-hidden="true" style="width:10px;height:10px"><use href="#i-star"/></svg> POPULAR</span>' : "";
    return `<div class="oneway-cab-card" data-car="${o.key}">
        <div class="cab-left">
          <div class="cab-icon-wrap">
            <img src="${o.image}" alt="${o.name}" class="cab-thumb" width="200" height="133" loading="lazy" decoding="async" />
            ${o.fuel ? `<span class="fuel-badge ${fuelClass}">${o.fuel}</span>` : ""}
          </div>
          <div class="cab-details">
            <div class="cab-title-row"><h4 class="cab-name">${o.name}</h4>${popular}</div>
            <p class="cab-models">${o.models}</p>
            <div class="cab-specs"><span>${o.seats} seats</span><span>${o.bags} bag${o.bags > 1 ? "s" : ""}</span></div>
          </div>
        </div>
        <div class="cab-right">
          <div class="cab-pricing"><span class="cab-price-num">${o.priceMain}</span><span class="cab-price-sub">${o.priceSub}</span></div>
          <button type="button" class="btn btn-yellow btn-select-cab" data-select="${o.dataVal || o.key}">Select <svg class="ic" aria-hidden="true" style="width:15px;height:15px"><use href="#i-arrow"/></svg></button>
        </div>
      </div>`;
  }

  function seatPickerHTML() {
    const cur = Math.min(ST.SHARE_MAX_SEATS, Math.max(1, Number(flow.seats) || 1));
    let chips = "";
    for (let i = 1; i <= ST.SHARE_MAX_SEATS; i++) chips += `<button type="button" class="seat-chip${i === cur ? " is-on" : ""}" data-seats="${i}">${i} seat${i > 1 ? "s" : ""}</button>`;
    return `<div class="seat-picker"><span class="seat-picker__label">Seats (max ${ST.SHARE_MAX_SEATS})</span><div class="seat-chips">${chips}</div></div>`;
  }

  function buildStepOneList(type) {
    if (type === "round") {
      return ST.ROUND_ORDER.map((k) => {
        const c = ST.ROUND_CARS[k];
        return genericCarCard({ key: k, dataVal: k, name: c.name, models: c.models, seats: c.seats, bags: c.bags, image: c.image, priceMain: ST.inr(c.rate) + "/km", priceSub: "Est. " + ST.inr(c.rate * ST.ROUND_EST_KM) + " · " + ST.ROUND_EST_KM + " km" });
      }).join("");
    }
    if (type === "local") {
      const cards = [];
      ["8h", "12h"].forEach((pk) => {
        const p = ST.LOCAL_PACKAGES[pk];
        ["sedan", "suv"].forEach((cls) => {
          const c = ST.LOCAL_CLS[cls];
          cards.push(genericCarCard({ key: pk + ":" + cls, dataVal: pk + ":" + cls, name: c.name + " · " + p.label, models: p.km + " km included · extra ₹12/km", seats: cls === "suv" ? 6 : 4, bags: cls === "suv" ? 4 : 2, image: c.image, priceMain: ST.inr(p[cls]), priceSub: p.label + " package" }));
        });
      });
      return cards.join("");
    }
    if (type === "share") {
      return ST.SHARE_ROUTES.map((r) => genericCarCard({ key: r.key, dataVal: r.key, name: ST.cityName(r.a) + " ⇄ " + ST.cityName(r.b), models: "Shared AC sedan · verified co-riders", seats: 3, bags: 1, image: "sedan-thumb.webp", priceMain: ST.inr(r.rate), priceSub: "per seat" })).join("");
    }
    return ST.CAR_ORDER.map((k) => {
      const c = ST.ONEWAY_CARS[k];
      return genericCarCard({ key: k, dataVal: k, name: c.name, models: c.models, seats: c.seats, bags: c.bags, image: c.image, fuel: c.fuel, popular: c.popular, priceMain: ST.inr(ST.getCarFare(k, flow.from, flow.to)), priceSub: "All inclusive" });
    }).join("");
  }

  function initCabs() {
    const card = $("#bfCard");
    const type = flow.type || "oneway";
    card.innerHTML = `<div class="bf-card__body">
      ${routePillHTML()}
      ${guaranteeHTML()}
      ${type === "share" ? seatPickerHTML() : ""}
      <div class="oneway-cabs-list">${buildStepOneList(type)}</div>
      ${helpStripHTML()}
    </div>`;

    card.querySelectorAll(".btn-select-cab").forEach((btn) => {
      btn.addEventListener("click", (e) => { e.stopPropagation(); handleStepOneSelect(btn.getAttribute("data-select")); });
    });
    card.querySelectorAll(".oneway-cab-card").forEach((el) => {
      el.addEventListener("click", (e) => { if (e.target.closest(".btn-select-cab")) return; handleStepOneSelect(el.getAttribute("data-car")); });
    });
    card.querySelectorAll(".seat-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        ST.updateFlow({ seats: chip.getAttribute("data-seats") });
        card.querySelectorAll(".seat-chip").forEach((c) => c.classList.toggle("is-on", c === chip));
      });
    });
  }

  function handleStepOneSelect(val) {
    if (!val) return;
    const type = flow.type || "oneway";
    if (type === "local") {
      const parts = val.split(":");
      ST.updateFlow({ pkg: parts[0], car: parts[1] });
    } else if (type === "share") {
      ST.updateFlow({ route: val });
    } else {
      ST.updateFlow({ car: val });
    }
    window.location.href = ST.buildUrl("book", ST.loadFlow());
  }

  // GPS current-location detector (mirrors the landing-page widget in app.js).
  // Reverse-geocodes via Photon and fills the given address input + flow state.
  function detectGpsLocation(btn, input, statusEl, flowKey) {
    if (!btn) return;
    if (!navigator.geolocation) { btn.style.display = "none"; return; }
    const orig = btn.textContent;
    btn.addEventListener("click", () => {
      btn.textContent = "⏳ Locating…";
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const lat = pos.coords.latitude, lon = pos.coords.longitude;
          const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`);
          if (res.ok) {
            const data = await res.json();
            if (data.features && data.features.length) {
              const p = data.features[0].properties || {};
              const parts = [p.name, p.street, p.locality || p.district, p.city || p.county].filter(Boolean);
              const addr = parts.join(", ") || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
              if (input) input.value = addr;
              const patch = {};
              patch[flowKey] = addr;
              ST.updateFlow(patch);
              if (statusEl) {
                statusEl.hidden = false;
                statusEl.innerHTML = `<span class="addr-valid-icon"><svg class="ic" aria-hidden="true" style="width:11px;height:11px"><use href="#i-check"/></svg></span> <span><b>GPS location detected:</b> ${addr}</span>`;
              }
            }
          }
        } catch (e) {
          // ignore — user can type the address manually
        } finally {
          btn.textContent = orig;
        }
      }, () => {
        btn.textContent = orig;
        alert("Please enable location permission in your browser to auto-detect your address.");
      }, { timeout: 8000 });
    });
  }

  // Address autocomplete for the /book doorstep fields.
  // Instant curated local matches (no network) + debounced live map search
  // (Photon) merged in, cached, with keyboard nav and a loading state.
  function setupBookAddressAutocomplete(inputId, dropdownId, statusId, getCity, flowKey) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    const statusEl = statusId ? document.getElementById(statusId) : null;
    if (!input || !dropdown) return;
    if (input.dataset.acBound) return; // guard against double init
    input.dataset.acBound = "1";

    let hiIndex = -1;
    let reqId = 0;
    let aborter = null;
    let netTimer = null;
    const cache = new Map();

    const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));

    function tagFor(name) {
      const n = name.toLowerCase();
      if (n.includes("airport")) return "Airport";
      if (n.includes("railway") || n.includes("station")) return "Railway";
      if (n.includes("temple") || n.includes("mandir") || n.includes("caves")) return "Landmark";
      if (n.includes("midc") || n.includes("it park") || n.includes("market") || n.includes("mall")) return "Area";
      return "Popular area";
    }

    // Instant, network-free matches. Searches the trip city first, then every
    // other city, so a partial query like "pu" always returns Pune places.
    function localMatches(cityKey, q) {
      const ql = (q || "").toLowerCase();
      const seen = new Set();
      const out = [];
      const addFrom = (names, k) => {
        (names || []).forEach((name) => {
          if (ql && !name.toLowerCase().includes(ql)) return;
          const key = name.toLowerCase();
          if (seen.has(key)) return;
          seen.add(key);
          out.push({ name, sub: ST.cityName(k), tag: tagFor(name) });
        });
      };
      addFrom(ST.LOCAL_SUGGESTIONS && ST.LOCAL_SUGGESTIONS[cityKey], cityKey);
      if (ql && out.length < 6) {
        Object.keys(ST.LOCAL_SUGGESTIONS || {}).forEach((k) => {
          if (k !== cityKey && out.length < 6) addFrom(ST.LOCAL_SUGGESTIONS[k], k);
        });
      }
      return out.slice(0, 6);
    }

    async function fetchPhoton(q, geo) {
      const key = geo.lat + "," + geo.lon + "|" + q;
      if (cache.has(key)) return cache.get(key);
      if (aborter) aborter.abort();
      aborter = new AbortController();
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${geo.lat}&lon=${geo.lon}&limit=6&lang=en`;
      const res = await fetch(url, { signal: aborter.signal });
      if (!res.ok) return [];
      const data = await res.json();
      const out = (data.features || []).map((f) => {
        const p = f.properties || {};
        const parts = [p.street, p.locality || p.district || p.suburb, p.city || p.county, p.state].filter(Boolean);
        const name = p.name || parts[0] || q;
        return { name, sub: parts.join(", "), tag: "Map verified" };
      }).filter((i) => i.name);
      cache.set(key, out);
      return out;
    }

    function rowHTML(item, q) {
      let title = esc(item.name);
      const idx = q ? item.name.toLowerCase().indexOf(q.toLowerCase()) : -1;
      if (idx >= 0) {
        title = esc(item.name.slice(0, idx)) + "<mark>" + esc(item.name.slice(idx, idx + q.length)) + "</mark>" + esc(item.name.slice(idx + q.length));
      }
      return `<div class="autocomplete-item" role="option" aria-selected="false" data-name="${esc(item.name)}" data-sub="${esc(item.sub || "")}">`
        + `<div class="addr-item-content"><span class="addr-item-name">${title}</span>`
        + (item.sub ? `<span class="addr-item-detail">${esc(item.sub)}</span>` : "")
        + `</div><span class="autocomplete-tag">${esc(item.tag || "Area")}</span></div>`;
    }

    function customRow(q, city) {
      return `<div class="autocomplete-item autocomplete-item--custom" role="option" aria-selected="false" data-name="${esc(q)}" data-sub="Exact doorstep address in ${esc(city.name || "the city")}">`
        + `<div class="addr-item-content"><span class="addr-item-name"><b>Use "${esc(q)}"</b></span>`
        + `<span class="addr-item-detail">Doorstep pickup &amp; drop confirmed</span></div>`
        + `<span class="autocomplete-tag" style="background:#FEF3C7;color:#B45309">Custom</span></div>`;
    }

    function paint(items, q, showLoading, city) {
      hiIndex = -1;
      let html = "";
      if (showLoading && !items.length) {
        html += `<div class="autocomplete-loading"><span class="ac-spinner"></span> Searching…</div>`;
      }
      html += items.map((it) => rowHTML(it, q)).join("");
      if (q) {
        html += customRow(q, city || {});
      } else if (!items.length) {
        html += `<div class="autocomplete-item" style="cursor:default"><span>Type area, landmark, hotel or society…</span></div>`;
      }
      dropdown.innerHTML = html;
      dropdown.classList.add("is-open");
      if (input.getAttribute("role") === "combobox") input.setAttribute("aria-expanded", "true");
    }

    async function enrich(q, geo, city) {
      const myId = ++reqId;
      let live = [];
      try { live = await fetchPhoton(q, geo); } catch (e) { live = []; }
      if (myId !== reqId || input.value.trim() !== q) return; // stale
      const local = localMatches(city.key, q);
      const cn = (ST.cityName(city.key) || "").toLowerCase();
      const seen = new Set(local.map((i) => i.name.toLowerCase()));
      const same = [], other = [];
      live.forEach((i) => {
        const k = i.name.toLowerCase();
        if (seen.has(k)) return;
        seen.add(k);
        (cn && (i.sub || "").toLowerCase().includes(cn) ? same : other).push(i);
      });
      const merged = local.concat(same, other).slice(0, 8);
      paint(merged, q, false, city);
    }

    function run(q, { immediate }) {
      const city = getCity() || {};
      const geo = (ST.CITY_GEO && ST.CITY_GEO[city.key]) || { lat: 18.5204, lon: 73.8567 };
      paint(localMatches(city.key, q), q, q.length >= 2, city); // instant
      clearTimeout(netTimer);
      if (q.length < 2) return;
      if (immediate) enrich(q, geo, city);
      else netTimer = setTimeout(() => enrich(q, geo, city), 240);
    }

    function closeDropdown() {
      dropdown.classList.remove("is-open");
      hiIndex = -1;
      if (input.getAttribute("role") === "combobox") input.setAttribute("aria-expanded", "false");
    }

    function commit(addr, subText) {
      input.value = addr;
      closeDropdown();
      const patch = {};
      patch[flowKey] = addr;
      ST.updateFlow(patch);
      if (statusEl && addr) {
        statusEl.hidden = false;
        statusEl.innerHTML = `<span class="addr-valid-icon"><svg class="ic" aria-hidden="true" style="width:11px;height:11px"><use href="#i-check"/></svg></span> <span><b>Address set:</b> ${esc(addr)}${subText ? ` <small style="opacity:.85">(${esc(subText)})</small>` : ""}</span>`;
      }
    }

    const rows = () => Array.from(dropdown.querySelectorAll(".autocomplete-item[data-name]"));

    input.addEventListener("focus", () => run(input.value.trim(), { immediate: input.value.trim().length >= 2 }));
    input.addEventListener("input", () => run(input.value.trim(), { immediate: false }));

    dropdown.addEventListener("mousedown", (e) => e.preventDefault()); // keep focus while tapping
    dropdown.addEventListener("click", (e) => {
      const item = e.target.closest(".autocomplete-item");
      if (!item || !item.dataset.name) return;
      commit(item.dataset.name, item.dataset.sub);
      input.blur();
    });

    input.addEventListener("keydown", (e) => {
      const list = rows();
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!list.length) return;
        e.preventDefault();
        hiIndex = e.key === "ArrowDown"
          ? (hiIndex + 1) % list.length
          : (hiIndex - 1 + list.length) % list.length;
        list.forEach((r, i) => {
          r.classList.toggle("is-selected", i === hiIndex);
          r.setAttribute("aria-selected", i === hiIndex ? "true" : "false");
        });
        if (list[hiIndex].scrollIntoView) list[hiIndex].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (hiIndex >= 0 && list[hiIndex]) commit(list[hiIndex].dataset.name, list[hiIndex].dataset.sub);
        else { const v = input.value.trim(); if (v) commit(v); }
        input.blur();
      } else if (e.key === "Escape") {
        closeDropdown();
      }
    });

    document.addEventListener("click", (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target) && !e.target.closest(".autocomplete-item")) {
        closeDropdown();
      }
    });
  }

  /* =========================================================================
     STEP 2 - /book  (Passenger + WhatsApp OTP)
     ====================================================================== */
  function initBook() {
    const profile = ST.readProfile();
    const fareInfo = ST.computeFare(flow);
    const type = flow.type || "oneway";

    const label = $("#selectedCabLabel");
    if (label) label.innerHTML = `Selected: <b>${fareInfo.carLabel}</b> (${ST.inr(fareInfo.total)}${type === "round" ? " est." : ""} · ${fareInfo.meta})`;

    // Prefill from lightweight profile / stored flow
    const nameIn = $("#mCustName"), phoneIn = $("#mCustPhone");
    const pAddrIn = $("#mCustAddress"), dAddrIn = $("#mCustDropAddress");
    if (nameIn && (flow.name || profile.name)) nameIn.value = flow.name || profile.name;
    if (phoneIn && (flow.phone || profile.phone)) phoneIn.value = cleanPhone(flow.phone || profile.phone);
    if (pAddrIn && flow.pickupAddress) pAddrIn.value = flow.pickupAddress;
    if (dAddrIn && flow.dropAddress) dAddrIn.value = flow.dropAddress;
    // Left empty otherwise so the type-ahead suggestions start clean.

    // Back / change-cab links (preserve route params)
    const cabsUrl = ST.buildUrl("cabs", flow);
    const crumb = $("#bfBackToCabsCrumb");
    if (crumb) crumb.setAttribute("href", cabsUrl);
    const back = $("#btnBackToCabs");
    if (back) back.addEventListener("click", () => (window.location.href = cabsUrl));
    const change = $("#btnChangeCab");
    if (change) change.addEventListener("click", () => (window.location.href = cabsUrl));

    // Phone input digits only
    if (phoneIn) {
      phoneIn.addEventListener("input", () => {
        const d = cleanPhone(phoneIn.value);
        if (phoneIn.value !== d) phoneIn.value = d;
      });
    }

    // GPS auto-detect for the pickup address (drop uses typed search only)
    detectGpsLocation($("#btnBookPickupGps"), $("#mCustAddress"), $("#bookPickupStatus"), "pickupAddress");

    // Live address suggestions while typing (Photon map search, city-biased)
    setupBookAddressAutocomplete("mCustAddress", "mCustAddressDropdown", "bookPickupStatus",
      () => ({ key: flow.from, name: ST.cityName(flow.from) }), "pickupAddress");
    setupBookAddressAutocomplete("mCustDropAddress", "mCustDropAddressDropdown", "bookDropStatus",
      () => ({ key: flow.to, name: ST.cityName(flow.to) }), "dropAddress");

    $("#btnSendOtp").addEventListener("click", sendOtp);
    $("#btnResendOtp").addEventListener("click", sendOtp);
    $("#btnVerifyOtp").addEventListener("click", verifyOtp);
    const otpIn = $("#mCustOtp");
    if (otpIn) {
      otpIn.addEventListener("input", () => { otpIn.value = otpIn.value.replace(/\D/g, "").slice(0, 6); });
      otpIn.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); verifyOtp(); } });
    }

    $("#btnGoToSummary").addEventListener("click", () => {
      const err = $("#bfOtpError");
      const name = (nameIn.value || "").trim();
      const phone = cleanPhone(phoneIn.value);
      const pickup = (pAddrIn.value || "").trim();
      const drop = (dAddrIn.value || "").trim();

      if (!name) { showError(err, "Please enter the passenger's full name."); nameIn.focus(); return; }
      if (!/^[6-9]\d{9}$/.test(phone)) { showError(err, "Please enter a valid 10-digit WhatsApp mobile number."); phoneIn.focus(); return; }
      if (!pickup) { showError(err, "Please enter your exact doorstep pickup address."); pAddrIn.focus(); return; }
      if (!otpState.verified) { showError(err, "Please verify your WhatsApp number before continuing."); sendOtp(); return; }

      clearError(err);
      ST.updateFlow({
        name,
        phone,
        pickupAddress: pickup,
        dropAddress: drop || `${ST.cityName(flow.to)} drop point`,
        altPhone: cleanPhone(($("#mCustAltPhone") || {}).value),
        gst: (($("#mCustGstNumber") || {}).value || "").trim(),
        gstCompany: (($("#mCustGstCompany") || {}).value || "").trim(),
        otpVerified: true
      });
      const next = ST.loadFlow();
      window.location.href = ST.buildUrl("summary", next);
    });

    // If already verified this session, reflect it
    if (flow.otpVerified && flow.phone && cleanPhone(flow.phone) === cleanPhone(phoneIn && phoneIn.value)) {
      otpState.verified = true;
      showVerified(cleanPhone(flow.phone));
    }
  }

  async function sendOtp() {
    const err = $("#bfOtpError");
    const nameIn = $("#mCustName"), phoneIn = $("#mCustPhone");
    const name = (nameIn && nameIn.value.trim()) || "Valued Customer";
    const phone = cleanPhone(phoneIn && phoneIn.value);

    if (!/^[6-9]\d{9}$/.test(phone)) {
      showError(err, "Please enter a valid 10-digit Indian WhatsApp mobile number.");
      if (phoneIn) phoneIn.focus();
      return;
    }
    clearError(err);

    const btn = $("#btnSendOtp"), txt = $("#btnSendOtpText");
    if (btn) btn.disabled = true;
    if (txt) txt.textContent = "Sending…";

    try {
      const res = await fetch("/api/send-whatsapp-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showError(err, "Could not send OTP: " + (data.error || "please try again."));
        if (btn) btn.disabled = false;
        if (txt) txt.textContent = "Verify OTP";
        return;
      }

      otpState.token = data.token;
      otpState.phone = phone;
      otpState.verified = false;

      const box = $("#otpInputArea");
      const target = $("#otpTargetPhone");
      if (target) target.textContent = "+91 " + phone;
      if (box) box.hidden = false;

      const demo = $("#otpDemoNotice"), demoText = $("#otpDemoText"), otpIn = $("#mCustOtp");
      if (data.isTestMode && data.testOtp) {
        if (demo) demo.hidden = false;
        if (demoText) demoText.innerHTML = `Demo OTP: <b>${data.testOtp}</b>`;
        if (otpIn) otpIn.value = data.testOtp;
      } else if (demo) {
        demo.hidden = true;
      }

      startCountdown();
      if (otpIn) otpIn.focus();
      if (txt) txt.textContent = "Code sent";
    } catch (e) {
      showError(err, "Network error sending OTP. Please check your connection.");
      if (btn) btn.disabled = false;
      if (txt) txt.textContent = "Verify OTP";
    }
  }

  function startCountdown() {
    clearInterval(otpState.timer);
    otpState.seconds = 30;
    const wrap = $("#otpTimerCount"), sec = $("#otpSeconds"), resend = $("#btnResendOtp");
    if (resend) resend.disabled = true;
    if (wrap) wrap.hidden = false;
    if (sec) sec.textContent = "30s";
    otpState.timer = setInterval(() => {
      otpState.seconds--;
      if (sec) sec.textContent = otpState.seconds + "s";
      if (otpState.seconds <= 0) {
        clearInterval(otpState.timer);
        if (resend) resend.disabled = false;
        if (wrap) wrap.hidden = true;
      }
    }, 1000);
  }

  async function verifyOtp() {
    const err = $("#bfOtpError");
    const phone = otpState.phone || cleanPhone(($("#mCustPhone") || {}).value);
    const otp = (($("#mCustOtp") || {}).value || "").trim();

    if (!/^[6-9]\d{9}$/.test(phone)) { showError(err, "Please enter a valid mobile number first."); return; }
    if (otp.length !== 6) { showError(err, "Please enter the 6-digit code sent on WhatsApp."); return; }

    const btn = $("#btnVerifyOtp");
    if (btn) { btn.disabled = true; const s = btn.querySelector("span"); if (s) s.textContent = "Verifying…"; }

    try {
      const res = await fetch("/api/verify-whatsapp-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, token: otpState.token })
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.verified) {
        showError(err, data.error || "Incorrect OTP. Please try again.");
        if (btn) { btn.disabled = false; const s = btn.querySelector("span"); if (s) s.textContent = "Verify OTP"; }
        return;
      }

      clearError(err);
      otpState.verified = true;
      clearInterval(otpState.timer);

      // Lightweight account creation (no login): persist a rider profile by phone.
      ST.saveProfile({
        name: (($("#mCustName") || {}).value || "").trim(),
        phone,
        verified: true,
        createdAt: new Date().toISOString()
      });
      ST.updateFlow({ phone, otpVerified: true, name: (($("#mCustName") || {}).value || "").trim() });

      showVerified(phone);
    } catch (e) {
      showError(err, "Error verifying OTP. Please try again.");
      if (btn) { btn.disabled = false; const s = btn.querySelector("span"); if (s) s.textContent = "Verify OTP"; }
    }
  }

  function showVerified(phone) {
    const box = $("#otpInputArea"), banner = $("#otpSuccessBanner"), sp = $("#otpSuccessPhone");
    const btn = $("#btnSendOtp"), txt = $("#btnSendOtpText"), note = $("#phoneVerifyStatusNote");
    if (box) box.hidden = true;
    if (banner) banner.hidden = false;
    if (sp) sp.textContent = "+91 " + phone;
    if (btn) btn.disabled = true;
    if (txt) txt.textContent = "Verified";
    if (note) { note.textContent = "WhatsApp number verified successfully."; note.style.color = "#10B981"; }
  }

  /* =========================================================================
     STEP 3 - /summary  (Summary + Pay & Book)
     ====================================================================== */
  function initSummary() {
    const fare = ST.computeFare(flow);

    // Guard: require verified passenger details
    if (!flow.phone || !flow.otpVerified) {
      window.location.href = ST.buildUrl("book", flow);
      return;
    }

    const type = flow.type || "oneway";
    const baseFare = fare.total;

    // Summary card (type-aware)
    $("#summaryRouteTitle").textContent = fare.title;
    $("#summaryPickupAddr").textContent = type === "local"
      ? `${flow.city || "Pune"} — within city limits`
      : (flow.pickupAddress || `${ST.cityName(flow.from)} doorstep pickup`);
    $("#summaryDropAddr").textContent = type === "local"
      ? `${flow.city || "Pune"} — within city limits`
      : (flow.dropAddress || `${ST.cityName(flow.to)} drop point`);
    $("#summaryPickupTime").textContent = (type === "round" && flow.rdate)
      ? `${ST.dateTimeDisplay(flow.date, flow.time)} · returns ${ST.formatDate(flow.rdate)}`
      : ST.dateTimeDisplay(flow.date, flow.time);
    $("#summaryCabImg").src = fare.carImage;
    $("#summaryCabName").textContent = fare.carLabel;
    $("#summaryCabSpec").textContent = fare.carSpec;

    $("#bfBackToBookCrumb").setAttribute("href", ST.buildUrl("book", flow));
    $("#btnBackToBook").addEventListener("click", () => (window.location.href = ST.buildUrl("book", flow)));

    // Fare plan choice
    $("#saverPlanAmount").textContent = ST.inr(baseFare);
    $("#flexiPlanAmount").textContent = ST.inr(baseFare + 100);
    $("#btnChooseSaver").addEventListener("click", () => setPlan("saver"));
    $("#btnChooseFlexi").addEventListener("click", () => setPlan("flexi"));

    // Coupon
    $("#btnApplyCoupon").addEventListener("click", () => {
      const code = (($("#couponInput") || {}).value || "").trim().toUpperCase();
      const msg = $("#couponMsg");
      if (!code) return;
      msg.hidden = false;
      if (code === "ONEWAY100" || code === "SHIVRUDR100") {
        msg.textContent = "Coupon applied — ₹100 off included.";
        msg.style.color = "#10B981";
      } else {
        msg.textContent = "Promotional fare already applied to this route.";
        msg.style.color = "#0284C7";
      }
    });

    // Payment buttons — all three methods are always available.
    $("#btnPayAdvanceRzp").addEventListener("click", () => { setPlan("saver"); pay("advance"); });
    $("#btnPayFullRzp").addEventListener("click", () => { setPlan("saver"); pay("full"); });
    $("#btnPayCashCab").addEventListener("click", () => { setPlan("flexi"); pay("cash"); });

    renderPlan();
  }

  function setPlan(plan) {
    flow.plan = plan;
    ST.updateFlow({ plan });
    renderPlan();
  }

  function renderPlan() {
    const base = ST.computeFare(flow).total;
    const flexiTotal = base + 100;
    const saver = $("#planSaverCard"), flexi = $("#planFlexiCard");
    if (saver) saver.classList.toggle("is-selected", flow.plan === "saver");
    if (flexi) flexi.classList.toggle("is-selected", flow.plan === "flexi");

    const badge = $("#summaryPlanBadge");
    if (badge) {
      badge.className = flow.plan === "flexi" ? "plan-badge-flexi" : "plan-badge-saver";
      badge.textContent = flow.plan === "flexi" ? "FLEXIBLE Flexi Fare" : "SAVE ₹100 Saver Fare";
    }

    // All three payment methods stay visible: pay advance, pay full online, or pay offline to driver.
    const adv = $("#btnPayAdvanceRzp"), full = $("#btnPayFullRzp"), cash = $("#btnPayCashCab");
    if (adv) adv.hidden = false;
    if (full) full.hidden = false;
    if (cash) cash.hidden = false;

    const advAmt = $("#btnPayAdvAmt"), fullAmt = $("#btnPayFullAmt"), cashAmt = $("#btnPayCashAmt");
    if (advAmt) advAmt.textContent = ST.inr(500);
    if (fullAmt) fullAmt.textContent = ST.inr(base);
    if (cashAmt) cashAmt.textContent = ST.inr(flexiTotal);
    $("#summaryFareNum").textContent = ST.inr(base);
  }

  function bookAmounts(mode) {
    const total = ST.planFare(flow);
    if (mode === "full") return { total, advance: total, balance: 0 };
    if (mode === "cash") return { total, advance: 0, balance: total };
    return { total, advance: 500, balance: Math.max(0, total - 500) };
  }

  let razorpayPromise = null;
  function loadRazorpay() {
    if (typeof window.Razorpay === "function") return Promise.resolve();
    if (razorpayPromise) return razorpayPromise;
    razorpayPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      s.onload = () => (typeof window.Razorpay === "function" ? resolve() : reject(new Error("Razorpay unavailable")));
      s.onerror = () => { razorpayPromise = null; reject(new Error("Razorpay load error")); };
      document.head.appendChild(s);
    });
    return razorpayPromise;
  }

  async function pay(mode) {
    const err = $("#bfPayError");
    clearError(err);
    const { total, advance } = bookAmounts(mode);

    if (mode === "cash") {
      finalizeBooking("cash", null);
      return;
    }

    const amount = mode === "full" ? total : advance;
    const btn = mode === "full" ? $("#btnPayFullRzp") : $("#btnPayAdvanceRzp");
    if (btn) { btn.disabled = true; btn.style.opacity = ".7"; }

    try {
      // Load Razorpay's checkout on demand — keeps ~100 KB off the initial page load.
      try {
        await loadRazorpay();
      } catch (e) {
        showError(err, "Couldn't load the payment gateway. Check your connection, or choose 'Pay to driver on drop'.");
        if (btn) { btn.disabled = false; btn.style.opacity = ""; }
        return;
      }

      const orderRes = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          notes: { name: flow.name, phone: flow.phone, from: ST.cityName(flow.from), to: ST.cityName(flow.to), car: flow.car }
        })
      });
      const order = await orderRes.json();
      if (!orderRes.ok || !order.success) {
        showError(err, order.missingKeys
          ? "Online payments are not configured yet. Please choose 'Pay to driver on drop' or call us."
          : "Could not start payment: " + (order.error || "please try again."));
        if (btn) { btn.disabled = false; btn.style.opacity = ""; }
        return;
      }
      if (typeof window.Razorpay !== "function") {
        showError(err, "Payment gateway failed to initialise. Please retry or choose 'Pay to driver on drop'.");
        if (btn) { btn.disabled = false; btn.style.opacity = ""; }
        return;
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Shivrudra Taxi",
        description: `${ST.cityName(flow.from)} to ${ST.cityName(flow.to)} cab`,
        image: "https://shivrudrataxi.com/taxi.svg",
        order_id: order.orderId,
        prefill: { name: flow.name, contact: "+91" + flow.phone, method: "upi" },
        theme: { color: "#0088EA" },
        config: {
          display: {
            blocks: {
              upi: { name: "Pay via UPI / QR", instruments: [{ method: "upi" }] },
              other: { name: "Cards, NetBanking & Wallets", instruments: [{ method: "card" }, { method: "netbanking" }, { method: "wallet" }] }
            },
            sequence: ["block.upi", "block.other"],
            preferences: { show_default_blocks: true }
          }
        },
        modal: { backdropclose: false, confirm_close: true, ondismiss: () => { if (btn) { btn.disabled = false; btn.style.opacity = ""; } } },
        handler: async (response) => {
          let verified = false;
          try {
            const vRes = await fetch("/api/verify-razorpay-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response)
            });
            const vData = await vRes.json();
            verified = !!(vData && vData.verified);
          } catch (e) {}
          finalizeBooking(mode, response, verified);
        }
      });
      rzp.on("payment.failed", (r) => {
        if (btn) { btn.disabled = false; btn.style.opacity = ""; }
        showError(err, "Payment failed or cancelled: " + ((r.error && r.error.description) || "transaction declined."));
      });
      rzp.open();
    } catch (e) {
      showError(err, "Payment error. Please try again or choose cash on drop.");
      if (btn) { btn.disabled = false; btn.style.opacity = ""; }
    }
  }

  function finalizeBooking(mode, rzResponse, verified) {
    const fare = ST.computeFare(flow);
    const type = flow.type || "oneway";
    const { total, advance, balance } = bookAmounts(mode);

    let bFrom, bTo;
    if (type === "local") { bFrom = flow.city || "Pune"; bTo = "Local package"; }
    else if (type === "share") {
      const r = ST.SHARE_ROUTES.find((x) => x.key === flow.route) || ST.SHARE_ROUTES[0];
      bFrom = ST.cityName(r.a); bTo = ST.cityName(r.b);
    } else { bFrom = ST.cityName(flow.from); bTo = ST.cityName(flow.to); }

    const booking = {
      id: ST.newBookingId(),
      createdAt: new Date().toISOString(),
      type: type,
      from: bFrom,
      to: bTo,
      date: flow.date || "",
      time: flow.time || "08:00",
      returnDate: flow.rdate || "",
      package: type === "local" ? ((ST.LOCAL_PACKAGES[flow.pkg] || {}).label || "") : "",
      seats: type === "share" ? (Number(flow.seats) || 1) : undefined,
      car: fare.carLabel,
      totalFare: total,
      advance,
      balance,
      paymentMode: mode,
      paymentStatus: mode === "cash"
        ? "Cash on Cab (pay on drop)"
        : (verified ? "Paid online (Razorpay verified)" : "Paid online"),
      razorpayPaymentId: rzResponse ? rzResponse.razorpay_payment_id : null,
      razorpayOrderId: rzResponse ? rzResponse.razorpay_order_id : null,
      name: flow.name,
      phone: flow.phone,
      pickupAddress: flow.pickupAddress,
      dropAddress: flow.dropAddress,
      gst: flow.gst || "",
      urgent: !!flow.urgent,
      status: "confirmed"
    };

    ST.saveBooking(booking);
    ST.syncBookingToServer(booking);

    const msg = bookingWhatsAppMessage(booking);
    const confirmCard = $("#bfConfirmCard"), summaryCard = $("#bfSummaryCard");
    if (summaryCard) summaryCard.hidden = true;
    if (confirmCard) confirmCard.hidden = false;

    $("#bfBookingId").textContent = "#" + booking.id;
    $("#bfcRoute").textContent = fare.title;
    $("#bfcTime").textContent = ST.dateTimeDisplay(flow.date, flow.time);
    $("#bfcCar").textContent = fare.carLabel;
    $("#bfcPassenger").textContent = `${booking.name} (${booking.phone})`;
    $("#bfcPickup").textContent = booking.pickupAddress;
    $("#bfcDrop").textContent = booking.dropAddress;
    $("#bfcFare").textContent = ST.inr(total);

    const payStatus = $("#bfPayStatus");
    if (mode === "cash") {
      payStatus.textContent = `Confirmed — pay ${ST.inr(total)} to the driver on drop.`;
    } else if (mode === "full") {
      payStatus.textContent = `Full payment of ${ST.inr(total)} received. Nothing to pay on drop.`;
    } else {
      payStatus.textContent = `Advance ${ST.inr(advance)} received. Pay the balance ${ST.inr(balance)} to the driver on drop.`;
    }

    const waBtn = $("#bfWaConfirm");
    if (waBtn) waBtn.setAttribute("href", ST.waUrl(msg));

    window.scrollTo({ top: 0, behavior: "smooth" });
    try { window.open(ST.waUrl(msg), "_blank", "noopener"); } catch (e) {}
  }

  function bookingWhatsAppMessage(b) {
    const carLine = `Car: ${b.car}`;
    const typeLabel = { oneway: "One-way", round: "Round trip", local: "Local rental", share: "Shared cab" }[b.type || "oneway"] || "One-way";
    const extras = [];
    if (b.type === "round" && b.returnDate) extras.push(`Return: ${ST.formatDate(b.returnDate)}`);
    if (b.type === "local" && b.package) extras.push(`Package: ${b.package}`);
    if (b.type === "share" && b.seats) extras.push(`Seats: ${b.seats}`);
    const head = b.paymentMode === "cash"
      ? "🚖 *CASH ON CAB - SHIVRUDRA TAXI*"
      : (b.paymentMode === "full" ? "🌟 *FULLY PAID BOOKING - SHIVRUDRA TAXI*" : "✅ *ADVANCE PAID BOOKING - SHIVRUDRA TAXI*");
    const payLine = b.paymentMode === "cash"
      ? `Payment: Cash on drop — ₹${Number(b.totalFare).toLocaleString("en-IN")} to driver`
      : (b.paymentMode === "full"
        ? `Payment: ₹${Number(b.totalFare).toLocaleString("en-IN")} fully paid online`
        : `Payment: ₹500 advance paid, balance ₹${Number(b.balance).toLocaleString("en-IN")} to driver`);
    return [
      head,
      "──────────────────────────",
      `*Booking ID:* #${b.id}`,
      `*Trip type:* ${typeLabel}`,
      `*Route:* ${b.from} → ${b.to}`,
      `*Date:* ${ST.formatDate(b.date)}`,
      `*Time:* ${ST.formatTime(b.time)}${b.urgent ? " (URGENT)" : ""}`,
      carLine,
      ...(extras.length ? extras : []),
      "──────────────────────────",
      payLine,
      `*Total:* ₹${Number(b.totalFare).toLocaleString("en-IN")} (all inclusive)`,
      "──────────────────────────",
      `*Name:* ${b.name}`,
      `*Mobile:* ${b.phone}`,
      `*Pickup:* ${b.pickupAddress}`,
      `*Drop:* ${b.dropAddress}`,
      "──────────────────────────",
      "Please confirm my booking and share the driver & vehicle details."
    ].join("\n");
  }
})();
