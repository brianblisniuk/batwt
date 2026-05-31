/* Expedición Mundial · PWA cliente (V3.1). Vanilla JS, sin build. Data real vía get_trip_public + wc26_matches. */
(function () {
  "use strict";

  // ── config ──
  var SUPABASE_URL = "https://pptldpjwggrnbkvppolu.supabase.co";
  var SUPABASE_KEY = "sb_publishable_6Xs9DoveG6nvB8FK1q_RAw_apQCmTr_";
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  var LS_CODE = "em_code", LS_TRIP = "em_trip", LS_MATCHES = "em_matches";
  var DEFAULT_PALETTE = ["#1E3FB8", "#9A5A3A", "#0E9F6E", "#F59E0B", "#6B6258", "#7C3AED", "#0A1F70"];

  // ── teams (FIFA 3-letter codes → nombre es + bandera) ──
  var TEAMS = {
    ALG: ["Argelia", "🇩🇿"], ARG: ["Argentina", "🇦🇷"], AUS: ["Australia", "🇦🇺"], AUT: ["Austria", "🇦🇹"],
    BEL: ["Bélgica", "🇧🇪"], BIH: ["Bosnia y Herzegovina", "🇧🇦"], BRA: ["Brasil", "🇧🇷"], CAN: ["Canadá", "🇨🇦"],
    CIV: ["Costa de Marfil", "🇨🇮"], COD: ["RD del Congo", "🇨🇩"], COL: ["Colombia", "🇨🇴"], CPV: ["Cabo Verde", "🇨🇻"],
    CRO: ["Croacia", "🇭🇷"], CUW: ["Curazao", "🇨🇼"], CZE: ["Chequia", "🇨🇿"], ECU: ["Ecuador", "🇪🇨"],
    EGY: ["Egipto", "🇪🇬"], ENG: ["Inglaterra", "🏴󠁧󠁢󠁥󠁮󠁧󠁿"], ESP: ["España", "🇪🇸"], FRA: ["Francia", "🇫🇷"],
    GER: ["Alemania", "🇩🇪"], GHA: ["Ghana", "🇬🇭"], HAI: ["Haití", "🇭🇹"], IRN: ["Irán", "🇮🇷"],
    IRQ: ["Irak", "🇮🇶"], JOR: ["Jordania", "🇯🇴"], JPN: ["Japón", "🇯🇵"], KOR: ["Corea del Sur", "🇰🇷"],
    KSA: ["Arabia Saudita", "🇸🇦"], MAR: ["Marruecos", "🇲🇦"], MEX: ["México", "🇲🇽"], NED: ["Países Bajos", "🇳🇱"],
    NOR: ["Noruega", "🇳🇴"], NZL: ["Nueva Zelanda", "🇳🇿"], PAN: ["Panamá", "🇵🇦"], PAR: ["Paraguay", "🇵🇾"],
    POR: ["Portugal", "🇵🇹"], QAT: ["Catar", "🇶🇦"], RSA: ["Sudáfrica", "🇿🇦"], SCO: ["Escocia", "🏴󠁧󠁢󠁳󠁣󠁴󠁿"],
    SEN: ["Senegal", "🇸🇳"], SUI: ["Suiza", "🇨🇭"], SWE: ["Suecia", "🇸🇪"], TUN: ["Túnez", "🇹🇳"],
    TUR: ["Turquía", "🇹🇷"], URU: ["Uruguay", "🇺🇾"], USA: ["Estados Unidos", "🇺🇸"], UZB: ["Uzbekistán", "🇺🇿"]
  };
  function teamName(c) { return (TEAMS[c] && TEAMS[c][0]) || c || "?"; }
  function teamFlag(c) { return (TEAMS[c] && TEAMS[c][1]) ? TEAMS[c][1] + " " : ""; }

  // ── helpers ──
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function normCode(r) { return String(r || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8); }
  function fmtCode(c) { c = normCode(c); return c.length > 4 ? c.slice(0, 4) + "-" + c.slice(4) : c; }
  function pdate(s) { if (!s) return null; var d = new Date(String(s).slice(0, 10) + "T12:00:00"); return isNaN(d) ? null : d; }
  function fdate(s, o) { var d = pdate(s); return d ? d.toLocaleDateString("es-AR", o || { day: "numeric", month: "short" }) : ""; }
  function ftime(t) { return t ? String(t).slice(0, 5) : ""; }
  function telUrl(p) { return "tel:" + String(p || "").replace(/[^0-9+]/g, ""); }
  function webUrl(w) { return /^https?:\/\//.test(w) ? w : "https://" + w; }
  function isArg(m) { return m.team_home === "ARG" || m.team_away === "ARG"; }

  // direcciones manejando desde ubicación actual (Google decide el origen)
  function dirTo(dest) { return dest ? "https://www.google.com/maps/dir/?api=1&destination=" + dest + "&travelmode=driving" : null; }
  function dirProvider(p) {
    if (!p) return null;
    if (p.latitude != null && p.longitude != null) return dirTo(p.latitude + "," + p.longitude);
    var q = p.address || p.location || p.name; return q ? dirTo(encodeURIComponent(q)) : null;
  }
  function dirCoords(lat, lon, label) {
    if (lat != null && lon != null) return dirTo(lat + "," + lon);
    return label ? dirTo(encodeURIComponent(label)) : null;
  }

  function countdown(startS, endS, total) {
    var t = new Date(); t.setHours(0, 0, 0, 0);
    var s = pdate(startS); if (!s) return null;
    var n = Math.round((s - t) / 86400000);
    if (n > 0) return { band: "<b>" + n + "</b> " + (n === 1 ? "día para el viaje" : "días para el viaje") };
    var e = pdate(endS);
    if (e && t <= e) {
      var dn = Math.round((t - s) / 86400000) + 1;
      var tot = total || (Math.round((e - s) / 86400000) + 1);
      return { band: "Día <b>" + dn + "</b> de " + tot + " · ¡estás en el viaje!" };
    }
    return null;
  }
  function weatherLabel(code) {
    if (code === 0 || code === 1) return "Soleado";
    if (code === 2) return "Parcial";
    if (code === 3) return "Nublado";
    if (code >= 95) return "Tormenta";
    if (code >= 80 || (code >= 51 && code < 70)) return "Chubascos";
    if (code >= 71 && code < 80) return "Nieve";
    return "Templado";
  }
  function weatherEmoji(code) {
    if (code === 0 || code === 1) return "☀️";
    if (code === 2) return "🌤️";
    if (code === 3) return "☁️";
    if (code >= 95) return "⛈️";
    if (code >= 71 && code < 80) return "🌨️";
    if (code >= 80 || (code >= 51 && code < 70)) return "🌦️";
    return "🌡️";
  }
  function checklistKey(slot) { return "em:chk:" + (state.code || "x") + ":" + (slot.id || slot.title || ""); }
  function renderChecklist(slot) {
    var items = slot.checklist; var key = checklistKey(slot);
    var done; try { done = JSON.parse(localStorage.getItem(key) || "[]"); } catch (e) { done = []; }
    var n = 0; items.forEach(function (_, i) { if (done.indexOf(i) >= 0) n++; });
    var h = '<div class="chk" data-key="' + esc(key) + '">' +
      '<div class="chk-head"><span class="chk-title">Checklist</span><span class="chk-count">' + n + "/" + items.length + "</span></div>";
    items.forEach(function (it, i) {
      var on = done.indexOf(i) >= 0;
      h += '<label class="chk-item' + (on ? " on" : "") + '"><input type="checkbox" data-chk-i="' + i + '"' + (on ? " checked" : "") + '><span class="chk-box"></span><span class="chk-text">' + esc(it) + "</span></label>";
    });
    return h + "</div>";
  }
  function stageLabel(m) {
    var map = { group: "Grupos", r32: "16avos", r16: "8vos", qf: "4tos", sf: "Semifinal", third: "3er puesto", final: "Final" };
    if (m.stage === "group") return m.group_code ? "Grupo " + m.group_code : "Grupos";
    return map[m.stage] || (m.stage || "").toUpperCase();
  }
  function matchup(m) {
    var h = m.team_home, a = m.team_away;
    if (h && h !== "TBD" && a && a !== "TBD")
      return teamFlag(h) + esc(teamName(h)) + ' <span class="x">vs</span> ' + teamFlag(a) + esc(teamName(a));
    if (m.notes) return '<span style="font-weight:600;color:var(--text-muted)">' + esc(m.notes) + "</span>";
    return '<span style="font-weight:600;color:var(--text-muted)">Por definir</span>';
  }

  // km del día: prioriza day.km (backend), si no parsea "N km" de title+description de los slots
  function dayKm(day) {
    if (day.km != null) return Number(day.km) || 0;
    var sum = 0, found = false;
    (day.slots || []).forEach(function (s) {
      var txt = (s.description || "") + " " + (s.title || "");
      var re = /(\d{1,3}(?:[.,]\d{3})+|\d+)\s*km\b/gi, mm;
      while ((mm = re.exec(txt))) {
        var n = parseInt(mm[1].replace(/[.,]/g, ""), 10);
        if (!isNaN(n)) { sum += n; found = true; }
      }
    });
    return found ? sum : null;
  }

  // ── icons ──
  var I = {
    key: '<circle cx="7.5" cy="15.5" r="4.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M10.7 12.3L20 3M16 7l3 3M13.5 9.5l2.5 2.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    clock: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    plane: '<path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0011.5 2 1.5 1.5 0 0010 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" fill="currentColor"/>',
    fork: '<path d="M7 2v8a3 3 0 003 3v9M3 2v6a3 3 0 003 3M17 2v20M17 14h4l-1-12h-3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    rv: '<rect x="2" y="7" width="16" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M18 10h2l2 3v4h-4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="18" r="1.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="17" cy="18" r="1.5" fill="none" stroke="currentColor" stroke-width="2.2"/>',
    bed: '<path d="M3 18v-6a2 2 0 012-2h14a2 2 0 012 2v6M3 14h18M5 10V7a1 1 0 011-1h4a1 1 0 011 1v3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    fuel: '<rect x="4" y="3" width="9" height="18" rx="1" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M4 11h9M13 8l3 3v8a2 2 0 004 0V9l-3-3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    car: '<path d="M3 13l2-6h14l2 6v5h-3v-2H6v2H3v-5z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="16" r="1.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="17" cy="16" r="1.5" fill="none" stroke="currentColor" stroke-width="2.2"/>',
    mountain: '<path d="M3 20l5-9 4 6 3-4 6 7H3z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="17" cy="6" r="2" fill="none" stroke="currentColor" stroke-width="2.2"/>',
    star: '<path d="M12 3l2.6 5.6 6 .7-4.4 4.1 1.2 6L12 16.8 6.6 19.4l1.2-6L3.4 9.3l6-.7z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    fan: '<path d="M12 12V2M12 12l-7 7M12 12l7 7M12 12l-7-7M12 12l7-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="2" fill="currentColor"/>',
    stadium: '<ellipse cx="12" cy="12" rx="10" ry="6" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M2 12c0 3.3 4.5 6 10 6s10-2.7 10-6M9 9h6M9 12h6M9 15h6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    cart: '<path d="M3 4h2l2.5 11h11l2-8H6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="20" r="1.5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="17" cy="20" r="1.5" fill="none" stroke="currentColor" stroke-width="2.2"/>',
    pin: '<path d="M12 21s-7-6.4-7-11a7 7 0 1114 0c0 4.6-7 11-7 11z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><circle cx="12" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="2.2"/>',
    walk: '<circle cx="13" cy="4" r="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M7 22l3-7-3-3 2-5 4 1 2 4 4 1M7 12l-2 4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    doc: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2v6h6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    img: '<rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="8.5" cy="8.5" r="1.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M21 15l-5-5L5 21" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    phone: '<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.2a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    map: '<path d="M9 3L3 5v16l6-2 6 2 6-2V3l-6 2-6-2z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M3 10h18M8 3v4M16 3v4" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    plus: '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    down: '<path d="M12 3v14m0 0l-5-5m5 5l5-5M5 21h14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    chev: '<path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    back: '<path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    nav: '<path d="M3 11l19-8-8 19-2-9-9-2z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    web: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M3 12h18M12 3a15 15 0 010 18 15 15 0 010-18z" fill="none" stroke="currentColor" stroke-width="2.2"/>'
  };
  function svg(name, sz) { return '<svg width="' + (sz || 18) + '" height="' + (sz || 18) + '" viewBox="0 0 24 24">' + (I[name] || I.pin) + "</svg>"; }
  function pickIcon(text) {
    var t = (text || "").toLowerCase();
    if (/vuelo|flight|aero|airport|aeropuerto|\beze\b|\biah\b|check-in vuelo/.test(t)) return "plane";
    if (/partido|stadium|estadio|arrowhead|at&t|at&t|fan fest|fan zone|\bvs\b|match/.test(t)) return "stadium";
    if (/almuerzo|cena|desayuno|comida|restaurant|bbq|chili|grill|brunch|food|cervec|bar\b/.test(t)) return "fork";
    if (/motorhome|\brv\b|camping|campground|resort|park\b|lodge|hotel|villa|aloj|pernocte|check-in/.test(t)) return "rv";
    if (/nafta|fuel|combustible|carga|gas\b|buc-ee/.test(t)) return "fuel";
    if (/super|walmart|shopping|outlet|compras|mercado|store|mall/.test(t)) return "cart";
    if (/ruta|manejo|drive|conduc|traslado|transfer|chofer/.test(t)) return "car";
    if (/museo|museum|plaza|tour|paseo|caminata|parque|jard|lago|lake|mirador|relax|descanso|libre/.test(t)) return "star";
    return "pin";
  }

  // ── state ──
  var state = { code: null, trip: null, matches: [], dayIdx: 0, filter: "all", stale: false, mapDone: false, deferredInstall: null, prevTab: "itinerary" };

  // ── data ──
  function readInitialCode() {
    try { var u = new URLSearchParams(location.search).get("code"); if (u) { var c = normCode(u); if (c.length === 8) { localStorage.setItem(LS_CODE, c); history.replaceState({}, "", location.pathname); return c; } } } catch (e) {}
    try { return localStorage.getItem(LS_CODE); } catch (e) { return null; }
  }
  function cacheGet(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function cacheSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function fetchMatches() {
    return sb.from("wc26_matches").select("*").order("match_date", { ascending: true }).order("match_time", { ascending: true }).then(function (r) {
      if (r.error) throw r.error;
      state.matches = r.data || []; cacheSet(LS_MATCHES, state.matches);
    }).catch(function (e) { console.error("[EM] fetchMatches:", e); var c = cacheGet(LS_MATCHES); if (c) state.matches = c; });
  }

  function fetchTrip(code, silent) {
    code = normCode(code);
    if (code.length !== 8) { showEntry("Ingresá el código completo."); return Promise.resolve(); }
    state.code = code;
    return sb.rpc("get_trip_public", { p_access_code: code }).then(function (r) {
      if (r.error) throw r.error;
      if (!r.data) {
        if (!silent) { try { localStorage.removeItem(LS_CODE); } catch (e) {} showEntry("Código inválido o vencido."); }
        return;
      }
      try { localStorage.setItem(LS_CODE, code); } catch (e) {}
      state.trip = r.data; state.stale = false; cacheSet(LS_TRIP, r.data);
      $("#staleBanner").hidden = true;
      renderAll();
      showApp();
    }).catch(function (e) {
      console.error("[EM] fetchTrip:", e);
      var c = cacheGet(LS_TRIP);
      if (c) { state.trip = c; state.stale = true; $("#staleBanner").hidden = false; renderAll(); showApp(); }
      else if (!silent) showEntry("Sin conexión y sin datos guardados.");
    });
  }

  // ── screens visibility ──
  function showEntry(err) { $("#loading").hidden = true; $("#app").hidden = true; $("#entry").hidden = false; $("#codeErr").textContent = err || ""; }
  function showApp() { $("#entry").hidden = true; $("#loading").hidden = true; $("#app").hidden = false; }

  // ── render: overview ──
  function renderOverview() {
    var t = state.trip, meta = t.meta || {};
    var cd = countdown(meta.startDate, meta.endDate, (t.itinerary || []).length);
    $("#overviewHeader").innerHTML =
      '<header class="trip-header has-cover"><div class="cover-ov"></div><div class="trip-header-top">' +
      '<span class="trip-header-title">Mi Viaje</span></div>' +
      '<div class="trip-hero">' +
      '<h2 class="trip-title">' + esc(meta.tripName || "Tu viaje") + "</h2>" +
      '<div class="trip-dates">' + fdate(meta.startDate, { day: "numeric", month: "long" }) + " — " + fdate(meta.endDate, { day: "numeric", month: "long", year: "numeric" }) + "</div>" +
      (cd ? '<div class="countdown-hero">' + cd.band + "</div>" : "") +
      "</div></header>";

    var html = "";
    // próximo partido de Argentina (o primero del torneo)
    var argMatches = state.matches.filter(isArg);
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var next = argMatches.filter(function (m) { return pdate(m.match_date) >= today; })[0] || argMatches[0];
    if (next) {
      html += '<div class="nextmatch"><span class="flag">🇦🇷</span><div class="lbl">Próximo partido de Argentina</div>' +
        '<div class="vs">' + matchup(next) + "</div>" +
        '<div class="meta"><span>' + svgInline("cal") + " " + fdate(next.match_date, { weekday: "long", day: "numeric", month: "long" }) + " · " + ftime(next.match_time) + "</span>" +
        "<span>" + esc(next.stadium) + " · " + esc(next.city) + "</span></div></div>";
    }
    // quick links
    html += '<div class="section-header">Tu viaje</div>';
    html += link("itinerary", "cal", "Itinerario día a día", (t.itinerary || []).length + " días");
    html += link("mapa", "map", "Mapa del viaje", "el recorrido por Texas");
    html += link("mundial", "stadium", "Todos los partidos del Mundial", state.matches.length + " partidos");
    html += '<a class="big-link" target="_blank" rel="noopener" href="https://www.cruiseamerica.com/rv-rentals/renters-resources/rv-orientation-language-videos?wvideo=dfuk8apec8#Espanol"><span class="ll"><span class="ic">' + svgInline("rv") + "</span>" +
      '<span>Video de orientación del motorhome<div style="font:500 12px var(--font-body);color:var(--text-muted);margin-top:1px">Cruise America · en español</div></span></span>' +
      '<span class="chev"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span></a>';
    if (state.deferredInstall) html += '<button class="big-link" id="installBtn"><span class="ll"><span class="ic">' + svgInline("down") + '</span>Instalar la app</button>';

    // documentos: un botón que abre la lista completa (no sueltos)
    var docs = collectDocs(t);
    if (docs.length) {
      html += '<div class="section-header">Documentos</div>';
      html += '<button class="big-link" data-docs="1"><span class="ll"><span class="ic">' + svgInline("doc") + "</span>" +
        '<span>Todos los documentos<div style="font:500 12px var(--font-body);color:var(--text-muted);margin-top:1px">' + docs.length + (docs.length === 1 ? " archivo" : " archivos") + '</div></span></span>' +
        '<span class="chev"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span></button>';
    }

    // emergencias (tarjeta fija)
    var emg = meta.emergency || [];
    if (emg.length) {
      html += '<div class="section-header">Emergencias</div><div class="emg-card">';
      emg.forEach(function (x) {
        html += '<a class="emg-row" href="' + esc(telUrl(x.tel || x.value)) + '"><span class="emg-ic">' + svgInline2("phone", 15) + "</span>" +
          '<span class="emg-body"><span class="emg-label">' + esc(x.label) + '</span><span class="emg-value">' + esc(x.value) + "</span></span></a>";
      });
      html += "</div>";
    }

    $("#overviewBody").innerHTML = html;

    var ib = $("#installBtn"); if (ib) ib.addEventListener("click", doInstall);
  }
  function link(tab, icon, title, sub) {
    return '<button class="big-link" data-tab="' + tab + '"><span class="ll"><span class="ic">' + svgInline(icon) + "</span>" +
      "<span>" + esc(title) + '<div style="font:500 12px var(--font-body);color:var(--text-muted);margin-top:1px">' + esc(sub) + "</div></span></span>" +
      '<span class="chev"><svg width="16" height="16" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span></button>';
  }
  function svgInline(name) { return '<svg width="18" height="18" viewBox="0 0 24 24">' + (I[name] || I.pin) + "</svg>"; }
  function svgInline2(name, sz) { return '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 24 24">' + (I[name] || I.pin) + "</svg>"; }
  function basecampDir(bc) {
    if (bc.coords && bc.coords.lat != null) return dirCoords(bc.coords.lat, bc.coords.lon, bc.address || bc.name);
    if (bc.address) return dirTo(encodeURIComponent(bc.address));
    if (bc.name) return dirTo(encodeURIComponent(bc.name));
    return null;
  }
  function collectDocs(t) {
    var out = [];
    (t.itinerary || []).forEach(function (d) {
      (d.slots || []).forEach(function (s) {
        (s.attachments || []).forEach(function (a) { if (a && a.url) out.push({ name: a.name, url: a.url, mimeType: a.mimeType, dayLabel: fdate(d.date) + " · " + (s.title || "") }); });
      });
    });
    return out;
  }

  // ── render: itinerary ──
  function providersMap() { var m = {}; (state.trip.providers || []).forEach(function (p) { m[p.id] = p; }); return m; }
  function matchesOnDate(dateS) {
    var d = (dateS || "").slice(0, 10);
    return state.matches.filter(function (m) { return m.match_date === d; });
  }
  function sortedSlots(day) {
    return (day.slots || []).map(function (s, i) { return { s: s, i: i }; }).sort(function (a, b) {
      var ta = (a.s.timeStart || a.s.time || "99:99"), tb = (b.s.timeStart || b.s.time || "99:99");
      var c = String(ta).localeCompare(String(tb));
      return c !== 0 ? c : a.i - b.i;
    }).map(function (x) { return x.s; });
  }
  // Día inicial del itinerario = hoy si cae dentro del viaje; si es antes → primer día; si es después → último.
  function pickInitialDay() {
    var days = (state.trip && state.trip.itinerary) || [];
    if (!days.length) return 0;
    var today = new Date(); today.setHours(0, 0, 0, 0); var ts = today.getTime();
    for (var i = 0; i < days.length; i++) { var d = pdate(days[i].date); if (d && d.getTime() === ts) return i; }
    var first = pdate(days[0].date), last = pdate(days[days.length - 1].date);
    if (first && ts < first.getTime()) return 0;
    if (last && ts > last.getTime()) return days.length - 1;
    var best = 0, bestDiff = Infinity;
    for (var j = 0; j < days.length; j++) { var dd = pdate(days[j].date); if (!dd) continue; var diff = Math.abs(dd.getTime() - ts); if (diff < bestDiff) { bestDiff = diff; best = j; } }
    return best;
  }
  // Primera imagen adjunta de un slot (mimeType image/*), o null.
  function slotImage(slot) {
    if (slot.coverImage) return slot.coverImage;
    var a = (slot.attachments || []).filter(function (x) { return x && x.url && /^image\//.test(x.mimeType || ""); });
    return a.length ? a[0].url : null;
  }
  // Imagen de portada de un día: day.coverImage explícito, o la primera imagen de sus slots, o null.
  function dayCover(day) {
    if (day.coverImage) return day.coverImage;
    var slots = day.slots || [];
    for (var i = 0; i < slots.length; i++) { var im = slotImage(slots[i]); if (im) return im; }
    return null;
  }
  function cssUrl(u) { return "url('" + String(u).replace(/'/g, "%27").replace(/\)/g, "%29") + "')"; }
  function renderItinerary() {
    var t = state.trip, meta = t.meta || {}, days = t.itinerary || [];
    $("#itiSub").textContent = days.length + " días · " + fdate(meta.startDate) + " – " + fdate(meta.endDate) + " · v15";
    // scroller
    $("#dateScroller").innerHTML = days.map(function (d, i) {
      var dd = pdate(d.date);
      var hasMatch = matchesOnDate(d.date).length > 0;
      return '<button class="date-item' + (i === state.dayIdx ? " active" : "") + '" data-idx="' + i + '">' +
        (hasMatch ? '<span class="dot"></span>' : "") +
        '<span class="d">' + (dd ? dd.getDate() : (i + 1)) + "</span>" +
        '<span class="l">' + (dd ? dd.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "") : "") + "</span></button>";
    }).join("");
    renderDay();
  }
  function goToDay(delta) {
    var days = (state.trip && state.trip.itinerary) || [];
    if (!days.length) return;
    var ni = state.dayIdx + delta;
    if (ni < 0 || ni >= days.length) return;
    state.dayIdx = ni;
    renderItinerary();
    var dc = $("#dayContent");
    if (dc) { dc.classList.remove("slide-from-right", "slide-from-left"); void dc.offsetWidth; dc.classList.add(delta > 0 ? "slide-from-right" : "slide-from-left"); }
    requestAnimationFrame(function () { var a = $(".date-item.active"); if (a) a.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }); });
  }
  function renderDay() {
    var t = state.trip, meta = t.meta || {}, days = t.itinerary || [], day = days[state.dayIdx];
    if (!day) { $("#dayContent").innerHTML = ""; return; }
    var palette = (meta.dayColorPalette && meta.dayColorPalette.length) ? meta.dayColorPalette : DEFAULT_PALETTE;
    var color = palette[state.dayIdx % palette.length];
    var dd = pdate(day.date);
    var dayMatches = matchesOnDate(day.date);
    var heroIcon = dayMatches.length ? "stadium" : ["walk", "car", "star", "mountain", "fan", "rv"][state.dayIdx % 6];
    var slots = sortedSlots(day);
    var km = dayKm(day);
    var dMin = day.driveMinutes != null ? Number(day.driveMinutes) : null;
    var cover = dayCover(day);

    var html = "";
    var heroStyle = cover
      ? "background-image:linear-gradient(160deg," + color + "55 0%," + color + "dd 100%)," + cssUrl(cover) + ";background-size:cover;background-position:center;"
      : "background:linear-gradient(155deg," + color + " 0%," + color + "cc 100%)";
    html += '<div class="day-hero' + (cover ? " has-img" : "") + '" style="' + heroStyle + '">' +
      '<div class="pat"></div>' + (cover ? "" : '<div class="big-ic"><svg width="200" height="200" viewBox="0 0 24 24">' + (I[heroIcon] || "") + "</svg></div>") +
      '<div class="hero-top"><div class="date-chip"><span class="m">' + (dd ? dd.toLocaleDateString("es-AR", { month: "short" }).toUpperCase().replace(".", "") : "") + '</span><span class="d">' + (dd ? dd.getDate() : "") + "</span></div>" +
      (day.weather && day.weather.tmax != null ? '<div class="wx-chip">' + weatherEmoji(day.weather.code) + " <span>" + day.weather.tmax + "°</span></div>" : "") +
      "</div>" +
      '<div class="ov"></div><div class="ttl"><div class="sub">' + (dd ? dd.toLocaleDateString("es-AR", { weekday: "long" }) : "") + (day.dayNumber != null ? " · Día " + day.dayNumber : "") + "</div>" +
      '<div class="main">' + esc(day.title || "") + "</div></div></div>";

    // stats del día: manejo (km · millas · horas)
    var stats = [];
    if (km != null && km > 0) {
      var mi = Math.round(km * 0.621371);
      stats.push('<span class="stat">' + svgInline2("car", 13) + " ~" + km + " km · " + mi + " mi</span>");
    }
    if (dMin != null && dMin > 0) {
      var dh = Math.floor(dMin / 60), dmm = Math.round(dMin % 60);
      stats.push('<span class="stat">' + svgInline2("nav", 13) + " " + (dh > 0 ? dh + " h" + (dmm ? " " + dmm + " min" : "") : dmm + " min") + "</span>");
    }
    if (stats.length) html += '<div class="day-stats">' + stats.join("") + "</div>";

    if (day.summary) html += '<p class="day-desc">' + esc(day.summary) + "</p>";

    if (dayMatches.length) {
      html += '<div class="block-title">Partidos de hoy</div><div class="matchgrid">';
      dayMatches.forEach(function (m) {
        html += '<div class="mtile' + (isArg(m) ? " arg" : "") + '">' +
          '<div class="mt-top">' + ftime(m.match_time) + " · " + esc(stageLabel(m)) + "</div>" +
          '<div class="mt-vs">' + matchup(m) + "</div>" +
          '<div class="mt-loc">' + esc(m.city || m.stadium || "") + "</div></div>";
      });
      html += "</div>";
    }

    if (slots.length) {
      var provs = providersMap();
      html += '<div class="block-title">Plan del día</div><div class="activities">';
      slots.forEach(function (s, idx) {
        var p = provs[s.providerId];
        var icon = pickIcon((s.title || "") + " " + (p ? p.name + " " + (p.type || "") : "") + " " + (s.description || ""));
        var simg = slotImage(s);
        var sub = p ? p.name : (s.description ? (s.description.length > 80 ? s.description.slice(0, 80) + "…" : s.description) : "");
        var nAtt = (s.attachments || []).filter(function (a) { return a && a.url; }).length;
        var resvChips = "";
        if (s.reservationCode || s.checkIn || s.checkOut) {
          var ch = [];
          if (s.reservationCode) ch.push('<span class="resv-chip code">' + svgInline2("key", 11) + " " + esc(s.reservationCode) + "</span>");
          if (s.checkIn) ch.push('<span class="resv-chip">Check-in ' + esc(s.checkIn) + "</span>");
          if (s.checkOut) ch.push('<span class="resv-chip">Check-out ' + esc(s.checkOut) + "</span>");
          resvChips = '<div class="activity-resv">' + ch.join("") + "</div>";
        }
        html += '<div class="activity-row"><div class="activity-time">' + esc(ftime(s.timeStart) || ftime(s.time) || "") +
          (s.timeEnd ? '<span class="end">' + esc(ftime(s.timeEnd)) + "</span>" : "") + "</div>" +
          '<div class="activity-card" data-day="' + state.dayIdx + '" data-slot-idx="' + idx + '">' +
          '<div class="head"><div class="activity-icon">' + svgInline2(icon, 16) + "</div>" +
          '<div class="activity-body"><div class="activity-title-text">' + esc(s.title || "") + "</div>" +
          (sub ? '<div class="activity-sub">' + esc(sub) + "</div>" : "") + "</div>" +
          (simg ? '<img class="activity-thumb" src="' + esc(simg) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'" style="width:50px;height:50px;border-radius:10px;object-fit:cover;flex:0 0 auto;margin-left:10px;">' : "") +
          '<span class="go">' + svgInline2("chev", 16) + "</span></div>" +
          (nAtt ? '<div class="att-hint">' + svgInline2("doc", 12) + " " + nAtt + (nAtt === 1 ? " adjunto" : " adjuntos") + "</div>" : "") +
          resvChips +
          "</div></div>";
      });
      html += "</div>";
    }
    $("#dayContent").innerHTML = html;
  }

  // bloque estructurado de reserva (código + check-in/out)
  function resvBlock(slot) {
    var rows = [];
    if (slot.reservationCode) {
      rows.push('<div class="resv-row"><div class="resv-ic">' + svgInline2("key", 15) + "</div>" +
        '<div class="resv-main"><div class="resv-k">Código de reserva</div>' +
        '<div class="resv-v"><code>' + esc(slot.reservationCode) + "</code>" +
        '<button class="resv-copy" type="button" data-copy="' + esc(slot.reservationCode) + '">' + svgInline2("copy", 14) + "<span>Copiar</span></button></div></div></div>");
    }
    if (slot.checkIn || slot.checkOut) {
      var parts = [];
      if (slot.checkIn) parts.push('<div class="resv-time"><span>Check-in</span><b>' + esc(slot.checkIn) + "</b></div>");
      if (slot.checkOut) parts.push('<div class="resv-time"><span>Check-out</span><b>' + esc(slot.checkOut) + "</b></div>");
      rows.push('<div class="resv-row times"><div class="resv-ic">' + svgInline2("clock", 15) + '</div><div class="resv-times">' + parts.join("") + "</div></div>");
    }
    return rows.length ? '<div class="resv-card">' + rows.join("") + "</div>" : "";
  }

  // ── render: detail (slot) ──
  function openSlotDetail(dayIdx, slotIdx) {
    var t = state.trip, days = t.itinerary || [], day = days[dayIdx]; if (!day) return;
    var slots = sortedSlots(day);
    var slot = slots[slotIdx]; if (!slot) return;
    var meta = t.meta || {};
    var palette = (meta.dayColorPalette && meta.dayColorPalette.length) ? meta.dayColorPalette : DEFAULT_PALETTE;
    var color = palette[dayIdx % palette.length];
    var p = providersMap()[slot.providerId];
    var dd = pdate(day.date);
    var icon = pickIcon((slot.title || "") + " " + (p ? p.name + " " + (p.type || "") : "") + " " + (slot.description || ""));
    var cat = p ? (p.type || "Lugar") : "Actividad";
    var dir = p ? dirProvider(p) : null;
    var img = slotImage(slot);
    var when = (dd ? dd.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }) : "") +
      (ftime(slot.timeStart) || ftime(slot.time) ? " · " + (ftime(slot.timeStart) || ftime(slot.time)) : "") +
      (slot.timeEnd ? "–" + ftime(slot.timeEnd) : "");

    var html = "";
    var dHeroStyle = img
      ? "background-image:linear-gradient(160deg," + color + "44 0%," + color + "dd 100%)," + cssUrl(img) + ";background-size:cover;background-position:center;"
      : "background:linear-gradient(160deg," + color + " 0%," + color + "dd 100%)";
    html += '<div class="detail-hero' + (img ? " has-img" : "") + '" style="' + dHeroStyle + '">' +
      '<div class="detail-hero-art"' + (img ? ' style="display:none"' : "") + '><svg width="180" height="180" viewBox="0 0 24 24" style="color:rgba(255,255,255,.18)">' + (I[icon] || I.pin) + "</svg></div>" +
      '<div class="detail-cat-badge">' + svgInline2(icon, 12) + " " + esc(cat) + "</div>" +
      "</div>";

    html += '<div class="detail-body">' +
      '<h1 class="detail-title">' + esc(slot.title || "Actividad") + "</h1>" +
      (when ? '<div class="detail-subtitle"><span>' + svgInline2("cal", 13) + " " + esc(when) + "</span></div>" : "");

    // action row: Cómo llegar / Llamar / Web
    var actions = [];
    if (dir) actions.push('<a class="btn primary full" target="_blank" rel="noopener" href="' + esc(dir) + '">' + svgInline2("nav", 15) + ' Cómo llegar</a>');
    if (p && p.phone) actions.push('<a class="btn secondary" href="' + esc(telUrl(p.phone)) + '">' + svgInline2("phone", 15) + ' Llamar</a>');
    if (p && p.web) actions.push('<a class="btn secondary" target="_blank" rel="noopener" href="' + esc(webUrl(p.web)) + '">' + svgInline2("web", 15) + ' Web</a>');
    if (actions.length) html += '<div class="action-row">' + actions.join("") + "</div>";

    html += resvBlock(slot);

    if (slot.description) html += '<p class="detail-desc">' + esc(slot.description) + "</p>";

    if (slot.checklist && slot.checklist.length) html += renderChecklist(slot);

    // info-card del proveedor
    if (p) {
      var rows = [];
      if (p.name) rows.push({ ic: "pin", t: "Lugar", v: esc(p.name) });
      if (p.address || p.location) rows.push({ ic: "map", t: "Dirección", v: esc(p.address || p.location) });
      if (p.phone) rows.push({ ic: "phone", t: "Teléfono", v: '<a href="' + esc(telUrl(p.phone)) + '">' + esc(p.phone) + "</a>" });
      if (p.web) rows.push({ ic: "web", t: "Sitio web", v: '<a target="_blank" rel="noopener" href="' + esc(webUrl(p.web)) + '">' + esc(p.web) + "</a>" });
      if (rows.length) {
        html += '<div class="info-card">';
        rows.forEach(function (r, i) {
          html += '<div class="info-row' + (i === rows.length - 1 ? " last" : "") + '">' +
            '<div class="info-icon">' + svgInline2(r.ic, 14) + "</div>" +
            '<div class="info-body"><div class="info-label">' + r.t + '</div><div class="info-value">' + r.v + "</div></div></div>";
        });
        html += "</div>";
      }
    }

    // attachments
    var atts = (slot.attachments || []).filter(function (a) { return a && a.url; });
    if (atts.length) {
      html += '<div class="block-title" style="padding:18px 0 8px">Adjuntos</div><div class="docs-list">';
      atts.forEach(function (a) {
        var im = /^image\//.test(a.mimeType || "");
        html += '<a class="doc-row" target="_blank" rel="noopener" href="' + esc(a.url) + '">' +
          '<div class="doc-icon">' + svgInline2(im ? "img" : "doc", 18) + "</div>" +
          '<div class="doc-body"><div class="doc-name">' + esc(a.name || (im ? "Imagen" : "Documento")) + "</div></div>" +
          '<div class="doc-icon" style="background:transparent;color:var(--text-dim)">' + svgInline2("down", 16) + "</div></a>";
      });
      html += "</div>";
    }

    html += "</div>"; // /detail-body

    $("#detailContent").innerHTML = html;
    // activar pantalla
    state.prevTab = $$(".screen.active")[0] ? $$(".screen.active")[0].id : "itinerary";
    $$(".screen").forEach(function (s) { s.classList.toggle("active", s.id === "detail"); });
    $$("#bottomNav button, #topNav button").forEach(function (b) { b.classList.remove("active"); });
    window.scrollTo(0, 0);
    state.detailOpen = true;
    try { history.pushState({ d: 1 }, ""); } catch (e) {}
  }
  function closeSlotDetail() {
    if (state.detailOpen) { try { history.back(); return; } catch (e) {} }
    setTab(state.prevTab || "itinerary");
  }
  function openDocs() {
    var t = state.trip; var docs = collectDocs(t);
    var h = '<div class="detail-body docs-screen">' +
      '<h1 class="detail-title">Documentos</h1>' +
      '<div class="detail-subtitle"><span>' + docs.length + (docs.length === 1 ? " archivo" : " archivos") + " del viaje</span></div>" +
      '<div class="docs-list" style="margin-top:14px">';
    docs.forEach(function (d) {
      var im = /^image\//.test(d.mimeType || "");
      h += '<a class="doc-row" target="_blank" rel="noopener" href="' + esc(d.url) + '"><div class="doc-icon">' + svgInline2(im ? "img" : "doc", 18) + "</div>" +
        '<div class="doc-body"><div class="doc-name">' + esc(d.name || "Documento") + '</div><div class="doc-meta">' + esc(d.dayLabel || "") + "</div></div>" +
        '<div class="doc-icon" style="background:transparent;color:var(--text-dim)">' + svgInline2("down", 16) + "</div></a>";
    });
    h += "</div></div>";
    $("#detailContent").innerHTML = h;
    state.prevTab = $$(".screen.active")[0] ? $$(".screen.active")[0].id : "overview";
    $$(".screen").forEach(function (s) { s.classList.toggle("active", s.id === "detail"); });
    $$("#bottomNav button, #topNav button").forEach(function (b) { b.classList.remove("active"); });
    window.scrollTo(0, 0);
    state.detailOpen = true;
    try { history.pushState({ d: 1 }, ""); } catch (e) {}
  }

  // ── render: mundial ──
  function renderMundial() {
    var meta = state.trip.meta || {};
    var cities = {}; state.matches.forEach(function (m) { if (m.city) cities[m.city] = 1; });
    $("#mundialSub").textContent = state.matches.length + " partidos · " + Object.keys(cities).length + " sedes";
    var ms = state.matches.slice();
    if (state.filter === "arg") ms = ms.filter(isArg);
    else if (state.filter === "trip") {
      var a = (meta.startDate || "").slice(0, 10), b = (meta.endDate || "").slice(0, 10);
      ms = ms.filter(function (m) { return m.match_date >= a && m.match_date <= b; });
    }
    // group by date
    var groups = {}; var order = [];
    ms.forEach(function (m) { if (!groups[m.match_date]) { groups[m.match_date] = []; order.push(m.match_date); } groups[m.match_date].push(m); });
    order.sort();
    var html = "";
    if (!order.length) html = '<div style="padding:40px 16px;text-align:center;color:var(--text-muted)">No hay partidos para este filtro.</div>';
    order.forEach(function (date) {
      var list = groups[date].sort(function (x, y) { return (x.match_time || "").localeCompare(y.match_time || ""); });
      html += '<div class="match-group"><div class="match-group-date">' + fdate(date, { weekday: "long", day: "numeric", month: "long" }) +
        ' <span class="n">' + list.length + (list.length === 1 ? " partido" : " partidos") + "</span></div><div class=\"match-list\">";
      list.forEach(function (m) {
        var played = m.home_score != null && m.away_score != null;
        html += '<div class="match-row' + (isArg(m) ? " arg" : "") + '">' +
          '<div class="match-time"><div class="h">' + ftime(m.match_time) + "</div></div>" +
          '<div class="match-main"><div class="match-vs">' + matchup(m) + "</div>" +
          '<div class="match-venue">' + esc(m.stadium || "") + " · " + esc(m.city || "") + ", " + esc(m.country || "") + "</div></div>" +
          (played ? '<div class="match-score">' + m.home_score + "–" + m.away_score + "</div>" : '<div class="match-grp">' + esc(stageLabel(m)) + "</div>") +
          "</div>";
      });
      html += "</div></div>";
    });
    $("#matchList").innerHTML = html;
  }

  // ── render: accesos directos (apps del viaje) ──
  // icon = ícono oficial (App Store CDN). ios/android = links a la store (abren la ficha → la app).
  var ICON = "https://is1-ssl.mzstatic.com/image/thumb/";
  var SHORTCUTS = [
    { group: "Mundial", items: [
      { name: "FIFA Oficial", sub: "Fixture, resultados y noticias",
        icon: ICON + "Purple221/v4/50/c6/a1/50c6a16c-3155-8503-b154-bdc28ac6c9e3/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/160x160bb.jpg",
        ios: "https://apps.apple.com/app/id756904853",
        android: "https://play.google.com/store/apps/details?id=com.fifa.fifaapp.android" },
      { name: "FIFA Tickets", sub: "Entradas y acceso móvil al estadio",
        icon: ICON + "Purple211/v4/b7/f9/8f/b7f98f34-318d-ca76-9943-4c7e838adb1e/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/160x160bb.jpg",
        ios: "https://apps.apple.com/app/id6532603739",
        android: "https://play.google.com/store/apps/details?id=io.tixngo.app.fifatickets" }
    ]},
    { group: "Ruta y nafta", items: [
      { name: "Google Maps", sub: "Navegación y tiempos",
        icon: ICON + "Purple221/v4/70/35/bc/7035bcda-2a58-977e-fc83-1fc9766c804b/maps_2025-0-0-1x_U007epad-0-0-0-1-0-0-sRGB-0-0-85-220.png/160x160bb.jpg",
        ios: "https://apps.apple.com/app/id585027354",
        android: "https://play.google.com/store/apps/details?id=com.google.android.apps.maps" },
      { name: "Waze", sub: "Tráfico y radares en vivo",
        icon: ICON + "Purple211/v4/ff/26/c6/ff26c6fe-3775-f512-4ee8-5fb91905b3a1/AppIcon-0-0-1x_U007epad-0-1-0-85-220.png/160x160bb.jpg",
        ios: "https://apps.apple.com/app/id323229106",
        android: "https://play.google.com/store/apps/details?id=com.waze" },
      { name: "GasBuddy", sub: "Estaciones con nafta más barata",
        icon: ICON + "Purple211/v4/44/57/cf/4457cf74-cf2b-8b26-046f-5c091ee607f5/AppIcon-0-0-1x_U007emarketing-0-11-0-85-220.png/160x160bb.jpg",
        ios: "https://apps.apple.com/app/id406719683",
        android: "https://play.google.com/store/apps/details?id=gbis.gbandroid" }
    ]},
    { group: "Motorhome", items: [
      { name: "Cruise America", sub: "Tu motorhome · asistencia en ruta",
        icon: ICON + "Purple221/v4/42/62/70/42627093-2d05-793a-a09a-02ded18725d1/AppIcon-1x_U007emarketing-0-7-0-85-220-0.png/160x160bb.jpg",
        ios: "https://apps.apple.com/app/id1078524816",
        android: "https://play.google.com/store/apps/details?id=com.androidapi.cruiseamerica" }
    ]},
    { group: "Útiles", items: [
      { name: "AccuWeather", sub: "Clima y alertas de tormenta",
        icon: ICON + "Purple211/v4/a8/4d/e6/a84de69e-39a4-a0da-a839-4ddbe7364351/AppIcon-0-0-1x_U007epad-0-1-0-0-sRGB-85-220.png/160x160bb.jpg",
        ios: "https://apps.apple.com/app/id300048137",
        android: "https://play.google.com/store/apps/details?id=com.accuweather.android" },
      { name: "Google Translate", sub: "Traductor con cámara",
        icon: ICON + "Purple221/v4/5d/94/4c/5d944c80-2037-75f5-6b1b-59791170ac62/TranslateApp-0-0-1x_U007epad-0-0-0-1-0-0-0-85-220.png/160x160bb.jpg",
        ios: "https://apps.apple.com/app/id414706506",
        android: "https://play.google.com/store/apps/details?id=com.google.android.apps.translate" }
    ]}
  ];
  function detectOS() {
    var ua = navigator.userAgent || "";
    if (/android/i.test(ua)) return "android";
    if (/iphone|ipad|ipod/i.test(ua)) return "ios";
    if ((navigator.platform === "MacIntel" || /Mac/.test(ua)) && navigator.maxTouchPoints > 1) return "ios"; // iPad iOS13+
    return "other";
  }
  function scIcon(s) {
    return '<span class="sc-ic"><img class="sc-ic-img" src="' + esc(s.icon) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()"></span>';
  }
  function scBody(s) {
    return '<span class="sc-tx"><span class="sc-name">' + esc(s.name) + '</span><span class="sc-sub">' + esc(s.sub) + "</span></span>";
  }
  function renderAccesos() {
    var os = detectOS();
    var intro = os === "other"
      ? "Tocá la store de tu celular para descargar cada app."
      : "Tocá una app para abrirla en " + (os === "ios" ? "el App Store" : "Google Play") + ".";
    var html = '<p class="accesos-intro">' + intro + "</p>";
    SHORTCUTS.forEach(function (g) {
      html += '<div class="section-header">' + esc(g.group) + "</div><div class=\"shortcut-grid\">";
      g.items.forEach(function (s) {
        if (os === "ios" || os === "android") {
          var url = os === "ios" ? s.ios : s.android;
          html += '<a class="shortcut" target="_blank" rel="noopener" href="' + esc(url) + '">' +
            scIcon(s) + scBody(s) + '<span class="sc-go">' + svgInline2("chev", 16) + "</span></a>";
        } else {
          html += '<div class="shortcut">' + scIcon(s) + scBody(s) +
            '<span class="sc-stores">' +
            '<a class="sc-store" target="_blank" rel="noopener" href="' + esc(s.ios) + '">iPhone</a>' +
            '<a class="sc-store" target="_blank" rel="noopener" href="' + esc(s.android) + '">Android</a>' +
            "</span></div>";
        }
      });
      html += "</div>";
    });
    $("#accesosBody").innerHTML = html;
  }


  // ── render: map ──
  function mapMarkerIcon(kind, num) {
    var COL = { base: "#1E3FB8", stadium: "#c0392b", attraction: "#1f7a43", stop: "#7a8399" };
    var scale = num != null ? 10 : (kind === "stadium" ? 9 : kind === "base" || kind === "attraction" ? 8 : 6);
    return { path: google.maps.SymbolPath.CIRCLE, scale: scale, fillColor: COL[kind] || COL.stop, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 };
  }
  function initMap() {
    if (state.mapDone || !window.google || !google.maps) return;
    state.mapDone = true;
    var t = state.trip, meta = t.meta || {};
    var pm = providersMap();
    var days = t.itinerary || [];
    // armar paradas por día (usando sortedSlots, para que el pin abra el slot correcto)
    state.mapDays = days.map(function (d, di) {
      var ss = sortedSlots(d); var pts = [];
      ss.forEach(function (s, si) {
        var p = pm[s.providerId];
        if (!p || p.latitude == null || p.longitude == null) return;
        var kind = "stop";
        if (s.providerId === "stadium-att" || /stadium|estadio/i.test(p.name || "")) kind = "stadium";
        else if (["fan-festival", "space-center", "schlitterbahn"].indexOf(s.providerId) >= 0 || p.type === "activity") kind = "attraction";
        pts.push({ lat: +p.latitude, lng: +p.longitude, name: s.title || p.name, place: p.name, kind: kind, di: di, si: si });
      });
      if (pts.length && pts[pts.length - 1].kind === "stop") pts[pts.length - 1].kind = "base"; // pernocte
      return { di: di, date: d.date, title: d.title, dayNumber: d.dayNumber, km: d.km, driveMinutes: d.driveMinutes, pts: pts };
    });

    google.maps.importLibrary("maps").then(function (lib) {
      var map = new lib.Map($("#map"), { center: meta.mapCenter || { lat: 31, lng: -97 }, zoom: meta.mapZoom || 6, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, clickableIcons: false, styles: MAP_STYLE });
      state._map = map; state._markers = []; state._seg = null; state._iw = new google.maps.InfoWindow();
      var sub = $("#mapSub"); if (sub) sub.textContent = "El recorrido · tocá un día";

      // ruta completa (línea punteada tenue) — dedup de puntos consecutivos iguales
      var route = []; var fb = new google.maps.LatLngBounds();
      state.mapDays.forEach(function (d) { d.pts.forEach(function (p) {
        var L = route[route.length - 1];
        if (!L || Math.abs(L.lat - p.lat) > 1e-6 || Math.abs(L.lng - p.lng) > 1e-6) route.push({ lat: p.lat, lng: p.lng });
        fb.extend({ lat: p.lat, lng: p.lng });
      }); });
      state._routeLine = new google.maps.Polyline({ path: route, map: map, strokeOpacity: 0, icons: [{ icon: { path: "M 0,-1 0,1", strokeColor: "#6B768F", strokeOpacity: 0.7, scale: 3 }, offset: "0", repeat: "13px" }] });

      function clearMarkers() { state._markers.forEach(function (m) { m.setMap(null); }); state._markers = []; if (state._seg) { state._seg.setMap(null); state._seg = null; } }
      function addMarker(p, num, onClick, posOverride) {
        var m = new google.maps.Marker({ position: posOverride || { lat: p.lat, lng: p.lng }, map: map, title: p.name, zIndex: num != null ? 60 : (p.kind === "stop" ? 1 : 12), icon: mapMarkerIcon(p.kind, num), label: num != null ? { text: String(num), color: "#fff", fontSize: "11px", fontWeight: "700" } : null });
        m.addListener("click", function () {
          if (onClick) { onClick(); return; }
          state._iw.setContent('<div style="font:700 13px Inter,sans-serif;color:#0A1430;max-width:210px">' + esc(p.name) + (p.place && p.place !== p.name ? '<div style="font:500 12px Inter;color:#5C6680;margin-top:2px">' + esc(p.place) + "</div>" : "") + "</div>");
          state._iw.open(map, m);
        });
        state._markers.push(m);
      }
      function banner(d) {
        var el = $("#mapBanner"); if (!el) return;
        if (!d) { el.className = "map-banner"; el.innerHTML = ""; return; }
        var dd = pdate(d.date);
        var ds = dd ? dd.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }) : "";
        var info;
        if (d.km != null && d.km > 0) {
          var mi = Math.round(d.km * 0.621371), mm = d.driveMinutes || 0, h = Math.floor(mm / 60), m2 = mm % 60;
          info = "~" + d.km + " km · " + mi + " mi · " + (h > 0 ? h + " h" + (m2 ? " " + m2 + " min" : "") : m2 + " min") + " de manejo";
        } else info = "Sin traslados";
        el.className = "map-banner on";
        el.innerHTML = '<div class="mb-day">' + esc(d.title || ("Día " + (d.dayNumber != null ? d.dayNumber : d.di))) + '</div><div class="mb-sub">' + esc(ds) + (ds ? " · " : "") + info + "</div>";
      }
      var strip = $("#mapDayStrip");
      function markStripActive(key) { if (strip) $$("[data-k]", strip).forEach(function (c) { var on = c.dataset.k === String(key); c.classList.toggle("on", on); c.classList.toggle("active", on); }); }

      function showAll() {
        clearMarkers(); state._routeLine.setMap(map);
        var seen = {};
        state.mapDays.forEach(function (d) { d.pts.forEach(function (p) {
          if (p.kind === "stop") return; // vista general: solo bases, estadio y atracciones
          var k = p.lat.toFixed(3) + "," + p.lng.toFixed(3); if (seen[k]) return; seen[k] = 1;
          addMarker(p, null, null);
        }); });
        if (!fb.isEmpty()) map.fitBounds(fb, 60);
        banner(null); markStripActive("all");
      }
      function showDay(di) {
        clearMarkers(); state._routeLine.setMap(map);
        var d = state.mapDays[di]; if (!d || !d.pts.length) { showAll(); return; }
        if (d.pts.length >= 2) state._seg = new google.maps.Polyline({ path: d.pts.map(function (p) { return { lat: p.lat, lng: p.lng }; }), map: map, geodesic: true, strokeColor: "#1E3FB8", strokeOpacity: 0.95, strokeWeight: 5 });
        // una chincheta por ubicación única (orden de visita), sin duplicar
        var uniq = [], seenLoc = {};
        d.pts.forEach(function (p) { var k = p.lat.toFixed(4) + "," + p.lng.toFixed(4); if (!seenLoc[k]) { seenLoc[k] = 1; uniq.push(p); } });
        // separar las paradas muy cercanas para que los números no se solapen
        var cells = {}, off = {};
        uniq.forEach(function (p, i) { var c = p.lat.toFixed(2) + "," + p.lng.toFixed(2); (cells[c] = cells[c] || []).push(i); });
        Object.keys(cells).forEach(function (c) {
          var arr = cells[c]; if (arr.length < 2) return;
          arr.forEach(function (idx, j) {
            var ang = (2 * Math.PI * j / arr.length) - Math.PI / 2;
            off[idx] = { dlat: 0.0055 * Math.sin(ang), dlng: 0.0055 * Math.cos(ang) / Math.cos(uniq[idx].lat * Math.PI / 180) };
          });
        });
        var b = new google.maps.LatLngBounds();
        uniq.forEach(function (p, i) {
          var o = off[i] || { dlat: 0, dlng: 0 };
          addMarker(p, i + 1, function () { openSlotDetail(p.di, p.si); }, { lat: p.lat + o.dlat, lng: p.lng + o.dlng });
          b.extend({ lat: p.lat + o.dlat, lng: p.lng + o.dlng });
        });
        if (!b.isEmpty()) { if (uniq.length === 1) { map.setCenter(b.getCenter()); map.setZoom(12); } else map.fitBounds(b, 80); }
        banner(d); markStripActive(di);
      }
      state._showAll = showAll; state._showDay = showDay;

      if (strip) {
        var sh = '<button class="map-chip-all" data-k="all">Todo el viaje</button>';
        state.mapDays.forEach(function (d) {
          if (!d.pts.length) return;
          var dd = pdate(d.date);
          sh += '<button class="date-item map-date" data-k="' + d.di + '">' +
            (matchesOnDate(d.date).length ? '<span class="dot"></span>' : "") +
            '<span class="d">' + (dd ? dd.getDate() : (d.di + 1)) + '</span>' +
            '<span class="l">' + (dd ? dd.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", "") : "") + "</span></button>";
        });
        strip.innerHTML = sh;
        $$("[data-k]", strip).forEach(function (c) {
          c.addEventListener("click", function () {
            var k = c.dataset.k;
            if (k === "all") showAll(); else showDay(parseInt(k, 10));
            c.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
          });
        });
      }
      var d0 = state.mapDays[state.dayIdx];
      if (d0 && d0.pts && d0.pts.length) showDay(state.dayIdx); else showAll();
    });
  }

  function renderAll() { if (!state._dayPicked) { state.dayIdx = pickInitialDay(); state._dayPicked = true; } renderOverview(); renderItinerary(); renderMundial(); if ($("#mapa").classList.contains("active")) { state.mapDone = false; initMap(); } }

  // ── nav ──
  function setTab(tab) {
    if (tab !== "detail") state.detailOpen = false;
    $$(".screen").forEach(function (s) { s.classList.toggle("active", s.id === tab); });
    $$("#bottomNav button, #topNav button").forEach(function (b) { b.classList.toggle("active", b.dataset.tab === tab); });
    if (tab === "mapa") { initMap(); setTimeout(function () { if (window.google && google.maps && state.mapDone) { window.dispatchEvent(new Event("resize")); if (state._showDay) { var d = state.mapDays && state.mapDays[state.dayIdx]; if (d && d.pts && d.pts.length) state._showDay(state.dayIdx); else if (state._showAll) state._showAll(); } } }, 160); }
    var sb2 = $("#" + tab + " .screen-body") || $("#" + tab); if (sb2) sb2.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  // ── install ──
  function doInstall() { if (state.deferredInstall) { state.deferredInstall.prompt(); state.deferredInstall.userChoice.finally(function () { state.deferredInstall = null; renderOverview(); }); } }

  // ── events ──
  function wire() {
    document.addEventListener("click", function (e) {
      var cp = e.target.closest("[data-copy]");
      if (cp) {
        e.preventDefault(); e.stopPropagation();
        var cval = cp.getAttribute("data-copy");
        try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(cval); } catch (_) {}
        cp.classList.add("ok");
        var csp = cp.querySelector("span"); var cold = csp ? csp.textContent : null;
        if (csp) csp.textContent = "Copiado";
        setTimeout(function () { cp.classList.remove("ok"); if (csp && cold != null) csp.textContent = cold; }, 1400);
        return;
      }
      var nav = e.target.closest("[data-tab]"); if (nav) { setTab(nav.dataset.tab); return; }
      var dq = e.target.closest("[data-docs]"); if (dq) { openDocs(); return; }
      var di = e.target.closest(".date-item"); if (di) { state.dayIdx = parseInt(di.dataset.idx, 10); renderItinerary(); requestAnimationFrame(function () { var a = $(".date-item.active"); if (a) a.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }); }); return; }
      var fc = e.target.closest(".filter-chip"); if (fc) { state.filter = fc.dataset.filter; $$(".filter-chip").forEach(function (c) { c.classList.toggle("active", c === fc); }); renderMundial(); return; }
      var ac = e.target.closest(".activity-card");
      if (ac && ac.dataset.slotIdx != null && !e.target.closest("a")) {
        openSlotDetail(parseInt(ac.dataset.day, 10), parseInt(ac.dataset.slotIdx, 10));
        return;
      }
    });
    var dbf = $("#detailBackFab"); if (dbf) dbf.addEventListener("click", closeSlotDetail);
    window.addEventListener("popstate", function () {
      if (state.detailOpen) { state.detailOpen = false; setTab(state.prevTab || "itinerary"); }
    });
    document.addEventListener("change", function (e) {
      var cb = e.target.closest("input[data-chk-i]"); if (!cb) return;
      var wrap = cb.closest(".chk"); if (!wrap) return;
      var key = wrap.getAttribute("data-key"); var i = parseInt(cb.getAttribute("data-chk-i"), 10);
      var arr; try { arr = JSON.parse(localStorage.getItem(key) || "[]"); } catch (_) { arr = []; }
      var pos = arr.indexOf(i);
      if (cb.checked && pos < 0) arr.push(i); else if (!cb.checked && pos >= 0) arr.splice(pos, 1);
      try { localStorage.setItem(key, JSON.stringify(arr)); } catch (_) {}
      var lab = cb.closest(".chk-item"); if (lab) lab.classList.toggle("on", cb.checked);
      var total = wrap.querySelectorAll("input[data-chk-i]").length;
      var c = wrap.querySelector(".chk-count"); if (c) c.textContent = arr.length + "/" + total;
    });
    (function () {
      var dc = $("#dayContent"); if (!dc) return;
      var sx = 0, sy = 0, on = false, decided = false, horiz = false;
      dc.addEventListener("touchstart", function (e) {
        if (e.touches.length !== 1) { on = false; return; }
        sx = e.touches[0].clientX; sy = e.touches[0].clientY; on = true; decided = false; horiz = false;
      }, { passive: true });
      dc.addEventListener("touchmove", function (e) {
        if (!on || e.touches.length !== 1) return;
        var dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
        if (!decided && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) { decided = true; horiz = Math.abs(dx) > Math.abs(dy) * 1.3; }
        if (decided && horiz) e.preventDefault();
      }, { passive: false });
      dc.addEventListener("touchend", function (e) {
        if (!on) return; on = false;
        if (!decided || !horiz) return;
        var dx = e.changedTouches[0].clientX - sx;
        if (dx <= -40) goToDay(1);
        else if (dx >= 40) goToDay(-1);
      }, { passive: true });
    })();
    var input = $("#codeInput"), btn = $("#codeBtn");
    input.addEventListener("input", function () { var c = normCode(input.value); input.value = fmtCode(c); btn.disabled = c.length !== 8; $("#codeErr").textContent = ""; });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter" && normCode(input.value).length === 8) submit(); });
    btn.addEventListener("click", submit);
    function submit() { btn.disabled = true; btn.textContent = "Verificando…"; fetchTrip(normCode(input.value), false).finally(function () { btn.textContent = "Ver mi viaje"; btn.disabled = normCode(input.value).length !== 8; }); }

    window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); state.deferredInstall = e; if (state.trip) renderOverview(); });
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible" && state.code) fetchTrip(state.code, true); });
    setInterval(function () { if (state.code) fetchTrip(state.code, true); }, 60000);
  }

  var MAP_STYLE = [
    { elementType: "geometry", stylers: [{ color: "#eef1f6" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#5C6680" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#c7d8ea" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] }
  ];

  // ── boot ──
  function boot() {
    wire();
    renderAccesos();
    var code = readInitialCode();
    fetchMatches();
    if (code && code.length === 8) {
      var ct = cacheGet(LS_TRIP), cm = cacheGet(LS_MATCHES);
      if (cm) state.matches = cm;
      if (ct) { state.trip = ct; state.stale = true; $("#staleBanner").hidden = false; renderAll(); showApp(); }
      else { $("#loading").hidden = false; }
      fetchTrip(code, !!ct);
    } else { showEntry(""); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
