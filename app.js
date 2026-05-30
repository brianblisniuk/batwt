/* Expedición Mundial — PWA cliente (V2, acceso por código). Buildless: React UMD + htm. */
(function () {
  "use strict";
  var React = window.React, ReactDOM = window.ReactDOM;
  var html = window.htm.bind(React.createElement);
  var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef, useMemo = React.useMemo;

  var SUPABASE_URL = "https://pptldpjwggrnbkvppolu.supabase.co";
  var SUPABASE_KEY = "sb_publishable_6Xs9DoveG6nvB8FK1q_RAw_apQCmTr_";
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  var LS_CODE = "em_access_code", LS_CACHE = "em_trip_cache";
  var PALETTE = ["#1E3FB8", "#6e1a1f", "#3c6b3c", "#b8512e", "#5a6378", "#8b6914", "#0E9F6E"];

  // ---------- helpers ----------
  function normalizeCode(raw) {
    return String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  }
  function formatCode(c) {
    c = normalizeCode(c);
    return c.length > 4 ? c.slice(0, 4) + "-" + c.slice(4) : c;
  }
  function parseDate(s) { return s ? new Date(s + "T12:00:00") : null; }
  function fmtDate(s, opts) {
    var d = parseDate(s); if (!d) return "";
    return d.toLocaleDateString("es-AR", opts || { day: "numeric", month: "short" });
  }
  function countdown(startS, endS) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var start = parseDate(startS), end = parseDate(endS) || start;
    if (!start) return null;
    var DAY = 86400000;
    if (end && end < today) return { label: "terminó", n: null };
    if (start <= today && today <= (end || start)) return { label: "en curso", n: null };
    var n = Math.round((start - today) / DAY);
    return { label: n === 1 ? "falta" : "faltan", n: n, unit: n === 1 ? "día" : "días" };
  }
  function gmapsUrl(p) {
    if (!p) return null;
    if (p.mapUrl) return p.mapUrl;
    if (p.latitude != null && p.longitude != null)
      return "https://www.google.com/maps/search/?api=1&query=" + p.latitude + "," + p.longitude;
    if (p.address || p.location)
      return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(p.address || p.location);
    return null;
  }
  function telUrl(phone) { return "tel:" + String(phone || "").replace(/[^0-9+]/g, ""); }
  function webUrl(w) { return /^https?:\/\//.test(w) ? w : "https://" + w; }

  // ---------- data hook ----------
  function useTrip() {
    var initial = useMemo(function () {
      var fromUrl = null;
      try {
        var p = new URLSearchParams(window.location.search).get("code");
        if (p) { fromUrl = normalizeCode(p); }
      } catch (e) {}
      if (fromUrl && fromUrl.length === 8) {
        try { localStorage.setItem(LS_CODE, fromUrl); } catch (e) {}
        try { window.history.replaceState({}, "", window.location.pathname); } catch (e) {}
        return fromUrl;
      }
      try { return localStorage.getItem(LS_CODE); } catch (e) { return null; }
    }, []);

    var s = useState(initial ? "loading" : "entry"); var status = s[0], setStatus = s[1];
    var d = useState(null); var data = d[0], setData = d[1];
    var e2 = useState(""); var err = e2[0], setErr = e2[1];
    var st = useState(false); var stale = st[0], setStale = st[1];
    var codeRef = useRef(initial);

    function persist(payload) { try { localStorage.setItem(LS_CACHE, JSON.stringify(payload)); } catch (e) {} }

    function fetchTrip(code, silent) {
      code = normalizeCode(code);
      if (code.length !== 8) { setStatus("entry"); setErr("Ingresá el código completo."); return; }
      codeRef.current = code;
      if (!silent) setStatus(function (cur) { return cur === "trip" ? "trip" : "loading"; });
      return sb.rpc("get_trip_public", { p_access_code: code }).then(function (res) {
        if (res.error) throw res.error;
        if (!res.data) {
          if (!silent) {
            try { localStorage.removeItem(LS_CODE); } catch (e) {}
            setData(null); setErr("Código inválido o vencido."); setStatus("entry");
          }
          return;
        }
        try { localStorage.setItem(LS_CODE, code); } catch (e) {}
        persist(res.data);
        setData(res.data); setStale(false); setErr(""); setStatus("trip");
      }).catch(function (e) {
        // offline / network: fall back to cache
        var cached = null; try { cached = JSON.parse(localStorage.getItem(LS_CACHE) || "null"); } catch (x) {}
        if (cached) { setData(cached); setStale(true); setStatus("trip"); }
        else if (!silent) { setErr("Sin conexión y sin datos guardados."); setStatus(data ? "trip" : "entry"); }
      });
    }

    // initial load
    useEffect(function () {
      if (initial && initial.length === 8) {
        var cached = null; try { cached = JSON.parse(localStorage.getItem(LS_CACHE) || "null"); } catch (x) {}
        if (cached) { setData(cached); setStatus("trip"); setStale(true); }
        fetchTrip(initial, !!cached);
      }
    }, []);

    // polling + focus refresh
    useEffect(function () {
      if (status !== "trip" || !codeRef.current) return;
      var iv = setInterval(function () { fetchTrip(codeRef.current, true); }, 60000);
      var onVis = function () { if (document.visibilityState === "visible") fetchTrip(codeRef.current, true); };
      document.addEventListener("visibilitychange", onVis);
      return function () { clearInterval(iv); document.removeEventListener("visibilitychange", onVis); };
    }, [status]);

    return { status: status, data: data, err: err, stale: stale, fetchTrip: fetchTrip, setErr: setErr };
  }

  // ---------- install prompt ----------
  function useInstall() {
    var p = useState(null); var prompt = p[0], setPrompt = p[1];
    useEffect(function () {
      var h = function (e) { e.preventDefault(); setPrompt(e); };
      window.addEventListener("beforeinstallprompt", h);
      return function () { window.removeEventListener("beforeinstallprompt", h); };
    }, []);
    return {
      canInstall: !!prompt,
      doInstall: function () { if (prompt) { prompt.prompt(); prompt.userChoice.finally(function () { setPrompt(null); }); } }
    };
  }

  // ---------- components ----------
  function Entry(props) {
    var v = useState(""); var val = v[0], setVal = v[1];
    var b = useState(false); var busy = b[0], setBusy = b[1];
    function submit() {
      var c = normalizeCode(val);
      if (c.length !== 8) { props.setErr("El código tiene 8 caracteres."); return; }
      setBusy(true);
      Promise.resolve(props.fetchTrip(c, false)).finally(function () { setBusy(false); });
    }
    return html`
      <div className="entry safe-top safe-bottom">
        <div className="badge">${Globe("#fff", 34)}</div>
        <h1>Expedición Mundial</h1>
        <p>Ingresá el código de acceso que te compartimos para ver tu viaje.</p>
        <input className="code-input" inputMode="text" autoCapitalize="characters" autoComplete="off"
          spellCheck=${false} maxLength=${9} placeholder="XXXX-XXXX" value=${formatCode(val)}
          onChange=${function (e) { setVal(normalizeCode(e.target.value)); props.setErr(""); }}
          onKeyDown=${function (e) { if (e.key === "Enter") submit(); }} />
        <div className="err">${props.err}</div>
        <button className="btn-primary" disabled=${busy || normalizeCode(val).length !== 8} onClick=${submit}>
          ${busy ? "Verificando…" : "Ver mi viaje"}
        </button>
      </div>`;
  }

  function ProviderCard(props) {
    var p = props.provider; if (!p) return null;
    var gm = gmapsUrl(p);
    return html`
      <div className="prov">
        <div className="prov-name">${Pin(14)} ${p.name}</div>
        ${p.address || p.location ? html`<div className="prov-addr">${p.address || p.location}</div>` : null}
        <div className="prov-links">
          ${gm ? html`<a className="chip solid" href=${gm} target="_blank" rel="noopener">${Pin(13)} Mapa</a>` : null}
          ${p.phone ? html`<a className="chip" href=${telUrl(p.phone)}>${Phone(13)} ${p.phone}</a>` : null}
          ${p.web ? html`<a className="chip" href=${webUrl(p.web)} target="_blank" rel="noopener">Web</a>` : null}
        </div>
      </div>`;
  }

  function Attachments(props) {
    var list = (props.items || []).filter(function (a) { return a && a.url; });
    if (!list.length) return null;
    return html`<div className="att">${list.map(function (a, i) {
      var isImg = /^image\//.test(a.mimeType || "");
      return html`<a key=${i} href=${a.url} target="_blank" rel="noopener">
        ${isImg ? Img(13) : Doc(13)} ${a.name || (isImg ? "Imagen" : "Documento")}
      </a>`;
    })}</div>`;
  }

  function Slot(props) {
    var s = props.slot, prov = props.providers[s.providerId];
    return html`
      <div className="slot">
        <div className="slot-time">${s.timeStart || s.time || ""}${s.timeEnd ? html`<span className="end">${s.timeEnd}</span>` : null}</div>
        <div className="slot-body">
          <div className="slot-title">${s.title}</div>
          ${s.description ? html`<div className="slot-desc">${s.description}</div>` : null}
          ${prov ? html`<${ProviderCard} provider=${prov} />` : null}
          <${Attachments} items=${s.attachments} />
        </div>
      </div>`;
  }

  function DayCard(props) {
    var day = props.day, color = props.color;
    return html`
      <div className="day" style=${{ animationDelay: (props.idx * 35) + "ms" }}>
        <div className="day-head">
          <div className="day-num" style=${{ background: color }}>
            <small>DÍA</small>${String(day.dayNumber != null ? day.dayNumber : props.idx).padStart(2, "0")}
          </div>
          <div className="day-meta">
            <div className="dow">${day.weekday || ""}${day.date ? " · " + fmtDate(day.date) : ""}</div>
            <div className="ttl">${day.title || ""}</div>
          </div>
        </div>
        ${day.summary ? html`<div className="day-sum">${day.summary}</div>` : null}
        ${(day.slots || []).map(function (s, i) { return html`<${Slot} key=${s.id || i} slot=${s} providers=${props.providers} />`; })}
      </div>`;
  }

  function MapView(props) {
    var ref = useRef(null), done = useRef(false);
    useEffect(function () {
      if (done.current || !window.google || !google.maps) return;
      done.current = true;
      var meta = props.meta || {};
      google.maps.importLibrary("maps").then(function (lib) {
        var center = meta.mapCenter || { lat: 39, lng: -98 };
        var map = new lib.Map(ref.current, {
          center: center, zoom: meta.mapZoom || 6, mapTypeControl: false, streetViewControl: false,
          fullscreenControl: false, styles: MAP_STYLE
        });
        var bounds = new google.maps.LatLngBounds(), n = 0;
        var pts = (props.providers || []).filter(function (p) { return p.latitude != null && p.longitude != null; });
        var bc = meta.basecamp && meta.basecamp.coords;
        if (bc) { pts.push({ name: meta.basecamp.name || "Base", latitude: bc.lat, longitude: bc.lon, _base: true }); }
        pts.forEach(function (p) {
          var pos = { lat: Number(p.latitude), lng: Number(p.longitude) };
          var mk = new google.maps.Marker({
            position: pos, map: map, title: p.name,
            icon: p._base ? undefined : { path: google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: "#1E3FB8", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 }
          });
          var iw = new google.maps.InfoWindow({ content: '<div style="font:600 13px Inter,sans-serif;color:#0A1430">' + esc(p.name) + "</div>" });
          mk.addListener("click", function () { iw.open(map, mk); });
          bounds.extend(pos); n++;
        });
        if (n > 1) map.fitBounds(bounds, 48);
        else if (n === 1) map.setCenter(bounds.getCenter());
      });
    }, []);
    return html`<div className="map-wrap"><div id="map" ref=${ref}></div></div>`;
  }

  function Trip(props) {
    var data = props.data, meta = data.meta || {};
    var tab = useState("dias"); var active = tab[0], setActive = tab[1];
    var inst = useInstall();
    var providers = useMemo(function () {
      var m = {}; (data.providers || []).forEach(function (p) { m[p.id] = p; }); return m;
    }, [data]);
    var palette = (meta.dayColorPalette && meta.dayColorPalette.length) ? meta.dayColorPalette : PALETTE;
    var cd = countdown(meta.startDate, meta.endDate);
    var days = data.itinerary || [];

    return html`
      <div>
        <div className="wrap">
          <div className="hero safe-top">
            <div style=${{ height: "10px" }}></div>
            <div className="kicker">Expedición Mundial</div>
            <h1>${meta.tripName || "Tu viaje"}</h1>
            <div className="sub">
              ${cd ? html`<span className="countdown">${cd.n != null ? html`${cd.label} <b>${cd.n}</b> ${cd.unit}` : cd.label}</span>` : null}
              ${meta.startDate ? html`<span>${fmtDate(meta.startDate, { day: "numeric", month: "short" })} – ${fmtDate(meta.endDate, { day: "numeric", month: "short", year: "numeric" })}</span>` : null}
              ${meta.pax ? html`<span>· ${meta.pax} viajeros</span>` : null}
            </div>
          </div>

          <div className="body">
            ${props.stale ? html`<div className="stale">Mostrando datos guardados (sin conexión). Se actualiza solo al reconectar.</div>` : null}
            ${active === "dias"
              ? days.map(function (d, i) { return html`<${DayCard} key=${d.id || i} day=${d} idx=${i} providers=${providers} color=${palette[i % palette.length]} />`; })
              : html`<${MapView} meta=${meta} providers=${data.providers || []} />`}
          </div>
        </div>

        ${inst.canInstall ? html`<button className="install" onClick=${inst.doInstall}>Instalar app</button>` : null}

        <nav className="nav safe-bottom">
          <button className=${active === "dias" ? "active" : ""} onClick=${function () { setActive("dias"); }}>
            ${Cal(22)}<span>Itinerario</span>
          </button>
          <button className=${active === "mapa" ? "active" : ""} onClick=${function () { setActive("mapa"); }}>
            ${Pin(22)}<span>Mapa</span>
          </button>
        </nav>
      </div>`;
  }

  function App() {
    var t = useTrip();
    if (t.status === "entry") return html`<${Entry} fetchTrip=${t.fetchTrip} err=${t.err} setErr=${t.setErr} />`;
    if (t.status === "loading" && !t.data) return html`
      <div className="center"><div className="ring spin"></div>
        <div style=${{ color: "#8A97BD", fontSize: "14px" }}>Cargando tu viaje…</div></div>`;
    if (t.data) return html`<${Trip} data=${t.data} stale=${t.stale} />`;
    return html`<${Entry} fetchTrip=${t.fetchTrip} err=${t.err} setErr=${t.setErr} />`;
  }

  // ---------- tiny inline icons (stroke currentColor) ----------
  function svg(children, size, fill) {
    return html`<svg className="ico" width=${size || 22} height=${size || 22} viewBox="0 0 24 24" fill=${fill || "none"}
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">${children}</svg>`;
  }
  function Cal(s) { return svg(html`<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/>`, s); }
  function Pin(s) { return svg(html`<path d="M12 21s-7-6.4-7-11a7 7 0 1 1 14 0c0 4.6-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>`, s); }
  function Phone(s) { return svg(html`<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>`, s); }
  function Doc(s) { return svg(html`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>`, s); }
  function Img(s) { return svg(html`<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>`, s); }
  function Globe(color, s) { return svg(html`<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>`, s, "none"); }

  function esc(x) { return String(x || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var MAP_STYLE = [
    { elementType: "geometry", stylers: [{ color: "#eef1f6" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#5C6680" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#c7d8ea" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] }
  ];

  ReactDOM.createRoot(document.getElementById("root")).render(html`<${App} />`);
})();
