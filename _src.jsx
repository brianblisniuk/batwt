
    // ============================================================
    // EXPEDICIÓN MUNDIAL · App cliente (single-file)
    // ============================================================

    const { useState, useEffect, useRef, useMemo, useCallback } = React;

    // === CONSTANTES ============================================
    const SUPABASE_URL = 'https://pptldpjwggrnbkvppolu.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_6Xs9DoveG6nvB8FK1q_RAw_apQCmTr_';
    const TRIP_ID = 'mundial-arg-2026';
    const ACCESS_CODE = '4590';

    const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // === PALETA ================================================
    const P = {
      bg: '#0A1430', surface: '#FFFFFF', surfaceDim: '#F4F6FA',
      text: '#0A1430', textMuted: '#5C6680', textDim: '#9099B0',
      border: 'rgba(15,23,42,0.08)',
      primary: '#1E3FB8', primaryDeep: '#0A1F70', accent: '#75AADB',
      good: '#0E9F6E', warn: '#F59E0B', bad: '#DC2626',
    };

    // === MAPEO providerTypes (B&A) → categoría visual + ícono ====
    // Lee colores y labels desde meta.providerTypes del trip.
    // Solo necesitamos añadir el ícono SVG para cada tipo.
    const TYPE_ICON = {
      villa:      'rv',       // para el Mundial el "villa" es la motorhome
      restaurant: 'fork',
      winery:     'star',
      truffle:    'mountain',
      activity:   'star',
      transfer:   'car',
      service:    'rv',
      // fallback
      _default:   'pin',
    };

    // === PARTIDOS DEL MUNDIAL ==================================
    // Cargados desde Supabase (tabla wc26_matches). Antes estaban hardcoded;
    // ahora se cargan desde la DB y se cachean en localStorage para offline.
    // useWorldCupMatches está definido más abajo (después de useLocalStorage).

    // Códigos de equipo → nombres en español. Ampliamos a medida que se cargan
    // los teams reales en la tabla.
    const TEAM_NAMES = {
      ARG: 'Argentina', BRA: 'Brasil', URU: 'Uruguay', CHI: 'Chile', COL: 'Colombia',
      ECU: 'Ecuador', PAR: 'Paraguay', PER: 'Perú', VEN: 'Venezuela',
      MEX: 'México', USA: 'Estados Unidos', CAN: 'Canadá', CRC: 'Costa Rica',
      CUW: 'Curazao', HAI: 'Haití', PAN: 'Panamá', CPV: 'Cabo Verde',
      ESP: 'España', POR: 'Portugal', FRA: 'Francia', ITA: 'Italia',
      GER: 'Alemania', ENG: 'Inglaterra', SCO: 'Escocia', NED: 'Países Bajos', BEL: 'Bélgica',
      CRO: 'Croacia', SUI: 'Suiza', DEN: 'Dinamarca', SWE: 'Suecia',
      POL: 'Polonia', AUT: 'Austria', SRB: 'Serbia', TUR: 'Turquía',
      CZE: 'República Checa', NOR: 'Noruega', BIH: 'Bosnia y Herzegovina',
      MAR: 'Marruecos', SEN: 'Senegal', EGY: 'Egipto', ALG: 'Argelia',
      NGA: 'Nigeria', TUN: 'Túnez', CIV: 'Costa de Marfil', CMR: 'Camerún',
      GHA: 'Ghana', RSA: 'Sudáfrica', COD: 'RD Congo',
      JPN: 'Japón', KOR: 'Corea del Sur', AUS: 'Australia', IRN: 'Irán',
      KSA: 'Arabia Saudita', QAT: 'Catar', UZB: 'Uzbekistán', JOR: 'Jordania',
      IRQ: 'Irak', NZL: 'Nueva Zelanda',
      TBD: 'A definir',
    };

    // Códigos de equipo → emoji bandera. iOS y Android renderizan estas con
    // los íconos nacionales nativos del SO (lindos y consistentes con el resto
    // de la UI del teléfono). Zero dependencia de imágenes externas.
    const TEAM_FLAGS = {
      ARG: '🇦🇷', BRA: '🇧🇷', URU: '🇺🇾', CHI: '🇨🇱', COL: '🇨🇴',
      ECU: '🇪🇨', PAR: '🇵🇾', PER: '🇵🇪', VEN: '🇻🇪',
      MEX: '🇲🇽', USA: '🇺🇸', CAN: '🇨🇦', CRC: '🇨🇷',
      CUW: '🇨🇼', HAI: '🇭🇹', PAN: '🇵🇦', CPV: '🇨🇻',
      ESP: '🇪🇸', POR: '🇵🇹', FRA: '🇫🇷', ITA: '🇮🇹',
      GER: '🇩🇪', ENG: '🏴\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
      SCO: '🏴\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}',
      NED: '🇳🇱', BEL: '🇧🇪',
      CRO: '🇭🇷', SUI: '🇨🇭', DEN: '🇩🇰', SWE: '🇸🇪',
      POL: '🇵🇱', AUT: '🇦🇹', SRB: '🇷🇸', TUR: '🇹🇷',
      CZE: '🇨🇿', NOR: '🇳🇴', BIH: '🇧🇦',
      MAR: '🇲🇦', SEN: '🇸🇳', EGY: '🇪🇬', ALG: '🇩🇿',
      NGA: '🇳🇬', TUN: '🇹🇳', CIV: '🇨🇮', CMR: '🇨🇲',
      GHA: '🇬🇭', RSA: '🇿🇦', COD: '🇨🇩',
      JPN: '🇯🇵', KOR: '🇰🇷', AUS: '🇦🇺', IRN: '🇮🇷',
      KSA: '🇸🇦', QAT: '🇶🇦', UZB: '🇺🇿', JOR: '🇯🇴',
      IRQ: '🇮🇶', NZL: '🇳🇿',
      TBD: '',
    };

    // Etapas del torneo → labels en español
    const STAGE_LABELS = {
      group: 'Fase de grupos',
      r32:   'Dieciseisavos de final',
      r16:   'Octavos de final',
      qf:    'Cuartos de final',
      sf:    'Semifinal',
      tp:    'Tercer puesto',
      final: 'Final',
    };
    const STAGE_SHORT = {
      group: 'Grupo', r32: 'R32', r16: 'Octavos', qf: 'Cuartos', sf: 'Semis', tp: '3er puesto', final: 'Final',
    };

    // === ICON COMPONENT (curated set, same vocabulary as B&A) ===
    function Icon({ name, size = 20, color = 'currentColor', stroke = 2, fill = false }) {
      const s = stroke;
      const props = {
        width: size, height: size, viewBox: '0 0 24 24',
        fill: fill ? color : 'none', stroke: color, strokeWidth: s,
        strokeLinecap: 'round', strokeLinejoin: 'round',
      };
      switch (name) {
        case 'stadium':  return <svg {...props}><ellipse cx="12" cy="12" rx="10" ry="6"/><path d="M2 12c0 3.3 4.5 6 10 6s10-2.7 10-6"/><path d="M9 9h6M9 12h6M9 15h6"/></svg>;
        case 'fan':      return <svg {...props}><path d="M12 12V2M12 12l-7 7M12 12l7 7M12 12l-7-7M12 12l7-7"/><circle cx="12" cy="12" r="2" fill={color}/></svg>;
        case 'fork':     return <svg {...props}><path d="M7 2v8a3 3 0 003 3v9M3 2v6a3 3 0 003 3M17 2v20M17 14h4l-1-12h-3"/></svg>;
        case 'mountain': return <svg {...props}><path d="M3 20l5-9 4 6 3-4 6 7H3z"/><circle cx="17" cy="6" r="2"/></svg>;
        case 'star':     return <svg {...props}><path d="M12 2l3 7 7 .5-5 5 1.5 7-6.5-3.5L5 21.5 6.5 14.5l-5-5L8.5 9z"/></svg>;
        case 'rv':       return <svg {...props}><rect x="2" y="7" width="16" height="10" rx="1"/><path d="M18 10h2l2 3v4h-4"/><circle cx="7" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/></svg>;
        case 'car':      return <svg {...props}><path d="M3 13l2-6h14l2 6v5h-3v-2H6v2H3v-5z"/><circle cx="7" cy="16" r="1.5"/><circle cx="17" cy="16" r="1.5"/></svg>;
        case 'cart':     return <svg {...props}><path d="M3 4h2l2.5 11h11l2-8H6"/><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/></svg>;
        case 'fuel':     return <svg {...props}><rect x="4" y="3" width="9" height="18" rx="1"/><path d="M4 11h9"/><path d="M13 8l3 3v8a2 2 0 002 2 2 2 0 002-2V9l-3-3"/></svg>;
        case 'cross':    return <svg {...props}><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/></svg>;
        case 'search':   return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>;
        case 'filter':   return <svg {...props}><path d="M3 5h18M6 12h12M10 19h4"/></svg>;
        case 'heart':    return <svg {...props} fill={fill ? color : 'none'}><path d="M12 21l-1.5-1.4C5 15 2 12 2 8.5 2 6 4 4 6.5 4c1.5 0 3 .8 3.5 2C10.5 4.8 12 4 13.5 4 16 4 18 6 18 8.5c0 3.5-3 6.5-8.5 11.1L12 21z"/></svg>;
        case 'cal':      return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
        case 'list':     return <svg {...props}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>;
        case 'map':      return <svg {...props}><path d="M9 3L3 5v16l6-2 6 2 6-2V3l-6 2-6-2zM9 3v16M15 5v16"/></svg>;
        case 'arrow-right': return <svg {...props}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
        case 'chevron-l':return <svg {...props}><path d="M15 6l-6 6 6 6"/></svg>;
        case 'chevron-r':return <svg {...props}><path d="M9 6l6 6-6 6"/></svg>;
        case 'chevron-d':return <svg {...props}><path d="M6 9l6 6 6-6"/></svg>;
        case 'x':        return <svg {...props}><path d="M6 6l12 12M18 6l-6 6-6 6"/></svg>;
        case 'plus':     return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
        case 'pin':      return <svg {...props}><path d="M12 2c-3.9 0-7 3-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-4-3.1-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>;
        case 'clock':    return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
        case 'phone':    return <svg {...props}><path d="M5 4h4l2 5-3 2a11 11 0 005 5l2-3 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></svg>;
        case 'share':    return <svg {...props}><circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 11l8-4M8 13l8 4"/></svg>;
        case 'walk':     return <svg {...props}><circle cx="13" cy="4" r="2"/><path d="M7 22l3-7-3-3 2-5 4 1 2 4 4 1M7 12l-2 4"/></svg>;
        case 'soccer':   return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 3l3 5-1 4-4 2-3-3 1-5z"/></svg>;
        case 'crosshair':return <svg {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4"/></svg>;
        case 'home':     return <svg {...props}><path d="M3 11l9-8 9 8v9a2 2 0 01-2 2h-3v-7H8v7H5a2 2 0 01-2-2v-9z"/></svg>;
        case 'check':    return <svg {...props}><path d="M5 12l5 5 9-11"/></svg>;
        case 'flag-ar':  return (
          <svg width={size} height={size} viewBox="0 0 24 16">
            <rect width="24" height="16" fill="#75AADB"/>
            <rect y="5.33" width="24" height="5.33" fill="#fff"/>
            <circle cx="12" cy="8" r="1.5" fill="#F9D616"/>
          </svg>);
        default: return null;
      }
    }

    // === HELPERS ================================================
    function haversineKm(lat1, lng1, lat2, lng2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }
    function placeDistanceLabel(place, ref) {
      if (!ref || place.lat == null) return null;
      const km = haversineKm(ref.lat, ref.lng, place.lat, place.lng);
      if (km < 1) return `${Math.round(km * 1000)} m`;
      if (km < 100) return `${km.toFixed(1)} km`;
      return `${Math.round(km)} km`;
    }
    function formatPhone(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

    // === HOOKS ==================================================
    function useLocalStorage(key, def) {
      const [val, setVal] = useState(() => {
        try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; }
        catch { return def; }
      });
      const setAndSave = useCallback((next) => {
        setVal(prev => {
          const v = typeof next === 'function' ? next(prev) : next;
          try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
          return v;
        });
      }, [key]);
      return [val, setAndSave];
    }

    // Load all World Cup 2026 matches from Supabase, ordered by datetime.
    // Cached in localStorage for offline. Subscribes to realtime so when
    // the operator updates scores or fills in TBD teams, it propagates.
    function useWorldCupMatches() {
      const [matches, setMatches] = useState(() => {
        try {
          const raw = localStorage.getItem('em-wc26-matches');
          return raw ? JSON.parse(raw) : [];
        } catch { return []; }
      });
      useEffect(() => {
        let mounted = true;
        (async () => {
          try {
            const { data, error } = await db
              .from('wc26_matches').select('*')
              .order('match_date', { ascending: true })
              .order('match_time', { ascending: true });
            if (error) throw error;
            if (mounted && data) {
              setMatches(data);
              try { localStorage.setItem('em-wc26-matches', JSON.stringify(data)); } catch {}
            }
          } catch (e) {
            // Silent — fall back to cached version if any
            console.warn('useWorldCupMatches load failed:', e.message);
          }
        })();
        const channel = db
          .channel('wc26-matches-changes')
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'wc26_matches' },
            async () => {
              const { data } = await db
                .from('wc26_matches').select('*')
                .order('match_date', { ascending: true })
                .order('match_time', { ascending: true });
              if (mounted && data) {
                setMatches(data);
                try { localStorage.setItem('em-wc26-matches', JSON.stringify(data)); } catch {}
              }
            })
          .subscribe();
        return () => {
          mounted = false;
          db.removeChannel(channel);
        };
      }, []);
      return matches;
    }

    // Helpers for matches display
    function teamLabel(code) { return TEAM_NAMES[code] || code; }
    function matchDateShort(dateStr) {
      // '2026-06-16' → '16 JUN'
      const [_y, m, d] = (dateStr || '').split('-');
      const mo = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'][parseInt(m,10)-1] || '';
      return `${parseInt(d,10)} ${mo}`;
    }
    function matchTimeShort(timeStr) {
      // '20:00:00' → '20:00'
      return (timeStr || '').slice(0, 5);
    }

    // useTrip: loads from Supabase + subscribes to realtime updates.
    // ALSO caches the latest data to localStorage so the app works offline:
    // if the network fetch fails (no signal in the RV mid-trip), we serve the
    // last known good copy and the UI keeps working with stale-but-usable data.
    function useTrip(tripId) {
      const [state, setState] = useState({ data: null, loading: true, error: null, stale: false });
      useEffect(() => {
        let mounted = true;
        let channel = null;
        const cacheKey = `em-trip-cache-${tripId}`;
        // 1. Optimistic: hydrate from localStorage cache immediately so the UI
        //    has something while we wait on the network.
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            setState({ data: parsed.data, loading: false, error: null, stale: true });
          }
        } catch {}
        // 2. Fetch fresh in background
        (async () => {
          try {
            const { data, error } = await db
              .from('trips').select('data, updated_at').eq('id', tripId).single();
            if (error) throw error;
            if (mounted) {
              setState({ data: data.data, loading: false, error: null, stale: false });
              try {
                localStorage.setItem(cacheKey, JSON.stringify({ data: data.data, updated_at: data.updated_at, cached_at: Date.now() }));
              } catch {}
            }
          } catch (e) {
            console.warn('useTrip fetch failed, using cached:', e.message);
            if (mounted) {
              // If we already hydrated from cache, keep that; only flip to error
              // when we have nothing at all.
              setState(s => s.data
                ? { ...s, loading: false, error: null, stale: true }
                : { data: null, loading: false, error: 'Sin señal · no hay datos guardados', stale: false });
            }
          }
          // Subscribe to realtime — when it fires, also update the cache
          channel = db
            .channel(`trip-${tripId}`)
            .on('postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` },
              (payload) => {
                if (!mounted) return;
                setState(s => ({ ...s, data: payload.new.data, stale: false }));
                try {
                  localStorage.setItem(cacheKey, JSON.stringify({ data: payload.new.data, cached_at: Date.now() }));
                } catch {}
              })
            .subscribe();
        })();
        return () => {
          mounted = false;
          if (channel) db.removeChannel(channel);
        };
      }, [tripId]);
      return state;
    }

    function useUserLocation() {
      const [loc, setLoc] = useState(null);
      const [denied, setDenied] = useState(false);
      const request = useCallback(() => {
        if (!navigator.geolocation) { setDenied(true); return; }
        if (loc) { setLoc(null); return; }
        navigator.geolocation.getCurrentPosition(
          (pos) => setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => setDenied(true),
          { timeout: 8000, enableHighAccuracy: true }
        );
      }, [loc]);
      return [loc, request, denied];
    }

    // === DATA TRANSFORMERS ======================================
    // Convert a B&A provider into a "place" the app cliente uses.
    function providerToPlace(p, providerTypesMeta) {
      if (!p) return null;
      const typeDef = (providerTypesMeta || []).find(t => t.key === p.type) || {};
      // Lat/Lng can be strings (Supabase returns numerics as strings sometimes)
      const lat = p.latitude != null ? Number(p.latitude) : null;
      const lng = p.longitude != null ? Number(p.longitude) : null;
      return {
        id: p.id,
        type: p.type,
        cat: p.type,        // alias for legacy mockup callsites
        name: p.name,
        city: p.location || '',
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
        rating: p.rating || null,
        desc: p.description || p.notes || '',
        tags: p.tags || [],
        hours: p.hoursDescription || p.hours || (p.closingDays ? `Cierra: ${p.closingDays}` : ''),
        price: p.priceRange || '',
        phone: p.phone || '',
        web: p.web || '',
        mapUrl: p.mapUrl || '',
        michelin: p.michelin || 0,
        color: typeDef.color || '#1E3FB8',
        typeLabel: typeDef.label || p.type,
        icon: TYPE_ICON[p.type] || TYPE_ICON._default,
        raw: p,
      };
    }

    // Compute initial map center as the centroid of positioned providers.
    // Falls back to meta.mapCenter, then to Kansas City (Mundial-specific).
    function tripCenter(trip) {
      if (!trip) return { lat: 39.0489, lng: -94.4839 };
      const places = (trip.providers || [])
        .map(p => ({ lat: Number(p.latitude), lng: Number(p.longitude) }))
        .filter(c => Number.isFinite(c.lat) && Number.isFinite(c.lng));
      if (places.length) {
        const sum = places.reduce((a, c) => ({ lat: a.lat + c.lat, lng: a.lng + c.lng }), { lat: 0, lng: 0 });
        return { lat: sum.lat / places.length, lng: sum.lng / places.length };
      }
      const mc = trip.meta?.mapCenter;
      if (mc && Number.isFinite(mc.lat) && Number.isFinite(mc.lng)) return { lat: mc.lat, lng: mc.lng };
      return { lat: 39.0489, lng: -94.4839 };  // Arrowhead Stadium fallback
    }
    // === ACCESS GATE ===========================================
    // Code-protected entry. The code lives in localStorage once entered so it
    // doesn't ask every session. NOT a security boundary — anyone reading the
    // JS sees the code. Just a "this is for the actual passenger" gate.
    function AccessGate({ onUnlock }) {
      const [val, setVal] = useState('');
      const [shake, setShake] = useState(false);
      const submit = () => {
        if (val.trim() === ACCESS_CODE) {
          try { localStorage.setItem('em-unlocked', '1'); } catch {}
          onUnlock();
        } else {
          setShake(true);
          setTimeout(() => setShake(false), 500);
        }
      };
      return (
        <div style={{
          position: 'fixed', inset: 0,
          background: `linear-gradient(180deg, ${P.primary} 0%, ${P.primaryDeep} 100%)`,
          color: '#fff', display: 'flex', flexDirection: 'column',
          padding: '80px 28px 40px', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40 }}>
              <Icon name="flag-ar" size={20}/>
              <span style={{ fontSize: 12, letterSpacing: 2, fontWeight: 600, opacity: 0.85 }}>
                EXPEDICIÓN MUNDIAL
              </span>
            </div>
            <h1 style={{
              fontSize: 38, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.2,
              marginBottom: 12,
            }}>
              Ingresá tu código<br/>de viaje.
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.5, color: 'rgba(255,255,255,0.7)', marginBottom: 40 }}>
              Te lo dimos al momento de confirmar tu reserva.
            </p>
            <div style={{
              animation: shake ? 'shake 0.4s' : 'none',
              transform: shake ? 'translateX(0)' : 'none',
            }}>
              <input
                type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                autoFocus value={val}
                onChange={(e) => setVal(e.target.value.replace(/[^0-9]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                style={{
                  width: '100%', padding: '20px 24px',
                  background: 'rgba(255,255,255,0.1)', border: 'none',
                  borderRadius: 16, color: '#fff',
                  fontSize: 28, fontWeight: 700, letterSpacing: 8,
                  textAlign: 'center', outline: 'none',
                }}
                placeholder="• • • •"
              />
              {shake && (
                <div style={{ marginTop: 12, fontSize: 13, color: '#FECACA', textAlign: 'center' }}>
                  Código incorrecto.
                </div>
              )}
            </div>
          </div>
          <button onClick={submit} disabled={!val} style={{
            background: val ? '#fff' : 'rgba(255,255,255,0.2)',
            color: val ? P.primary : 'rgba(255,255,255,0.6)',
            border: 'none', padding: '18px', borderRadius: 16,
            fontSize: 17, fontWeight: 700, cursor: val ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            Entrar
            <Icon name="arrow-right" size={18} stroke={2.4}/>
          </button>
        </div>
      );
    }

    // === SPLASH ================================================
    function SplashScreen({ onContinue, trip }) {
      const tripName = trip?.meta?.tripName || 'Argentina al Mundial 2026';
      const startDate = trip?.meta?.startDate;
      const endDate = trip?.meta?.endDate;
      const formatRange = () => {
        if (!startDate || !endDate) return 'Jun 2026';
        const fmt = (iso) => {
          const [y,m,d] = iso.split('-');
          const mo = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][parseInt(m,10)-1];
          return `${parseInt(d,10)} ${mo}`;
        };
        return `${fmt(startDate)} – ${fmt(endDate)}`;
      };
      return (
        <div style={{
          position: 'fixed', inset: 0, color: '#fff',
          background: `linear-gradient(180deg, ${P.primary} 0%, ${P.primaryDeep} 100%)`,
          display: 'flex', flexDirection: 'column',
          padding: '70px 24px 40px',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '38%', right: -80, width: 280, height: 280, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)', background: 'radial-gradient(circle at 30% 30%, rgba(117,170,219,0.25), transparent 70%)' }}/>
          <div style={{ position: 'absolute', top: '48%', right: -40, width: 150, height: 150, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }}/>
          <div style={{ position: 'relative', zIndex: 2, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 60 }}>
              <Icon name="flag-ar" size={20}/>
              <span style={{ fontSize: 12, letterSpacing: 2, fontWeight: 600, opacity: 0.85 }}>EXPEDICIÓN MUNDIAL</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 3, color: P.accent, marginBottom: 12, textTransform: 'uppercase' }}>
              USA · {formatRange()}
            </div>
            <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 0.95, letterSpacing: -2 }}>
              Tu mapa<br/>del Mundial,<br/><span style={{ color: P.accent }}>en ruta.</span>
            </h1>
            <p style={{ fontSize: 15, lineHeight: 1.5, marginTop: 24, color: 'rgba(255,255,255,0.78)', maxWidth: 280 }}>
              Estadios, fan zones, dónde comer, cargar nafta y dormir tu motorhome. Todo lo de tu viaje, en una sola app.
            </p>
          </div>
          <button onClick={onContinue} style={{
            position: 'relative', zIndex: 2,
            background: '#fff', color: P.primary, border: 'none',
            padding: '18px 24px', borderRadius: 16, fontSize: 17, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            letterSpacing: -0.2, cursor: 'pointer',
          }}>
            Empezar la expedición
            <Icon name="arrow-right" size={20} stroke={2.4}/>
          </button>
        </div>
      );
    }

    // === BOTTOM NAV (3 items, no chat) =========================
    function BottomNav({ active, goto }) {
      const items = [
        { id: 'map',  icon: 'map',  label: 'Mapa' },
        { id: 'cal',  icon: 'cal',  label: 'Mundial' },
        { id: 'trip', icon: 'list', label: 'Mi viaje' },
      ];
      return (
        <div className="em-safe-bottom" style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 95,
          background: P.surface, borderTop: `1px solid ${P.border}`,
          paddingTop: 10,
          display: 'flex', justifyContent: 'space-around',
        }}>
          {items.map(it => {
            const isActive = it.id === active;
            return (
              <button key={it.id} onClick={() => goto(it.id)} style={{
                background: 'transparent', border: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                color: isActive ? P.primary : P.textMuted, cursor: 'pointer',
                padding: '4px 12px',
              }}>
                <Icon name={it.icon} size={22} stroke={isActive ? 2.4 : 2}/>
                <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: -0.05 }}>{it.label}</span>
              </button>
            );
          })}
        </div>
      );
    }

    // === GOOGLE MAP COMPONENT =================================
    // Wraps a real Google Maps instance. Re-renders pins reactively, supports
    // user location, click on pin → callback.
    function GoogleMap({ pins, activePinId, onPinTap, center, zoom = 11, userLocation, style, mapStyle = 'light', nearbyPins = [], onNearbyPinTap }) {
      const containerRef = useRef(null);
      const mapRef = useRef(null);
      const markersRef = useRef([]);
      const nearbyMarkersRef = useRef([]);
      const userMarkerRef = useRef(null);
      const [ready, setReady] = useState(false);

      // Init map once
      useEffect(() => {
        let cancelled = false;
        (async () => {
          try {
            const { Map } = await google.maps.importLibrary('maps');
            if (cancelled || !containerRef.current) return;
            const map = new Map(containerRef.current, {
              center: center || { lat: 39.0489, lng: -94.4839 },
              zoom,
              disableDefaultUI: true,
              gestureHandling: 'greedy',
              clickableIcons: false,
              backgroundColor: mapStyle === 'dark' ? '#0B1220' : '#E8ECF2',
              styles: mapStyle === 'dark' ? DARK_MAP_STYLES : LIGHT_MAP_STYLES,
            });
            mapRef.current = map;
            setReady(true);
          } catch (e) {
            console.error('Google Maps init failed:', e);
          }
        })();
        return () => { cancelled = true; };
      }, []);

      // Pan/zoom on center change
      useEffect(() => {
        if (!mapRef.current || !center) return;
        mapRef.current.panTo(center);
      }, [center?.lat, center?.lng]);

      // Re-render curated pins
      useEffect(() => {
        if (!ready || !mapRef.current) return;
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];
        pins.forEach(p => {
          if (p.lat == null || p.lng == null) return;
          const isActive = p.id === activePinId;
          const marker = new google.maps.Marker({
            map: mapRef.current,
            position: { lat: p.lat, lng: p.lng },
            icon: {
              url: svgPinDataUrl(p.color, p.icon, isActive),
              scaledSize: new google.maps.Size(isActive ? 44 : 36, isActive ? 55 : 45),
              anchor: new google.maps.Point(isActive ? 22 : 18, isActive ? 55 : 45),
            },
            title: p.name,
            zIndex: isActive ? 1000 : 100,
          });
          marker.addListener('click', () => onPinTap?.(p));
          markersRef.current.push(marker);
        });
      }, [pins, activePinId, ready, onPinTap]);

      // Render nearby utility pins (amber, smaller, distinct)
      useEffect(() => {
        if (!ready || !mapRef.current) return;
        nearbyMarkersRef.current.forEach(m => m.setMap(null));
        nearbyMarkersRef.current = [];
        nearbyPins.forEach(p => {
          if (p.lat == null || p.lng == null) return;
          const marker = new google.maps.Marker({
            map: mapRef.current,
            position: { lat: p.lat, lng: p.lng },
            icon: {
              url: svgNearbyDotDataUrl('#D97706'),
              scaledSize: new google.maps.Size(22, 22),
              anchor: new google.maps.Point(11, 11),
            },
            title: p.name,
            zIndex: 500,
          });
          marker.addListener('click', () => onNearbyPinTap?.(p));
          nearbyMarkersRef.current.push(marker);
        });
      }, [nearbyPins, ready, onNearbyPinTap]);

      // User location pin (animated dot)
      useEffect(() => {
        if (!ready || !mapRef.current) return;
        if (userMarkerRef.current) { userMarkerRef.current.setMap(null); userMarkerRef.current = null; }
        if (!userLocation) return;
        userMarkerRef.current = new google.maps.Marker({
          map: mapRef.current,
          position: userLocation,
          icon: {
            url: svgUserPinDataUrl(),
            scaledSize: new google.maps.Size(28, 28),
            anchor: new google.maps.Point(14, 14),
          },
          zIndex: 2000,
          clickable: false,
        });
      }, [userLocation, ready]);

      return (
        <div ref={containerRef} style={{
          position: 'absolute', inset: 0,
          background: mapStyle === 'dark' ? '#0B1220' : '#E8ECF2',
          ...style,
        }}/>
      );
    }

    // Inline SVG marker as data URL — cheaper than custom HTML overlays
    function svgPinDataUrl(color, iconName, active) {
      const size = active ? 44 : 36;
      const h = size * 1.25;
      const iconSvg = inlineIconPath(iconName);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${h}" viewBox="0 0 36 45">
        <path d="M18 0C8 0 0 8 0 18c0 13 18 27 18 27s18-14 18-27C36 8 28 0 18 0z" fill="${color}"/>
        <circle cx="18" cy="18" r="14" fill="white"/>
        <g transform="translate(8 8)" stroke="${color}" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</g>
      </svg>`;
      return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }
    function svgUserPinDataUrl() {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="13" fill="rgba(30,63,184,0.18)"/>
        <circle cx="14" cy="14" r="6" fill="#1E3FB8" stroke="white" stroke-width="2.5"/>
      </svg>`;
      return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }
    // Smaller amber dot for Google Places utility results (gas, super, ATM, etc).
    // Visually distinct from curated provider pins so the user understands the difference.
    function svgNearbyDotDataUrl(color) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
        <circle cx="11" cy="11" r="9" fill="${color}" fill-opacity="0.22"/>
        <circle cx="11" cy="11" r="5.5" fill="${color}" stroke="white" stroke-width="2.5"/>
      </svg>`;
      return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }
    // Compact icon paths matching our SVG icons (just inner geometry, no <svg> wrapper).
    // Sized for a 20×20 viewport (the <g> in svgPinDataUrl offsets by 8 → 0..20).
    function inlineIconPath(name) {
      switch(name) {
        case 'stadium':  return `<ellipse cx="10" cy="10" rx="8" ry="5"/><path d="M2 10c0 2.8 3.5 5 8 5s8-2.2 8-5"/>`;
        case 'fan':      return `<path d="M10 10V2M10 10l-6 6M10 10l6 6M10 10l-6-6M10 10l6-6"/>`;
        case 'fork':     return `<path d="M6 1v7a2 2 0 002 2v9M3 1v5a2 2 0 002 2M14 1v18M14 11h3l-1-10h-2"/>`;
        case 'mountain': return `<path d="M2 17l4-8 3 5 3-3 5 6H2z"/>`;
        case 'star':     return `<path d="M10 1l2.5 6 6 .5-4.5 4 1 6-5-3-5 3 1-6L1 7.5l6-.5z"/>`;
        case 'rv':       return `<rect x="1" y="6" width="13" height="8" rx="1"/><path d="M14 8h2l2 2v4h-4"/><circle cx="5" cy="15" r="1.5"/><circle cx="14" cy="15" r="1.5"/>`;
        case 'car':      return `<path d="M2 11l2-5h12l2 5v4h-3v-2H5v2H2v-4z"/><circle cx="5.5" cy="13.5" r="1.5"/><circle cx="14.5" cy="13.5" r="1.5"/>`;
        case 'cart':     return `<path d="M2 3h2l2.5 9h9l2-7H5"/><circle cx="7.5" cy="17" r="1.3"/><circle cx="14" cy="17" r="1.3"/>`;
        case 'fuel':     return `<rect x="3" y="2" width="8" height="15" rx="1"/><path d="M3 9h8"/><path d="M11 7l2.5 2.5v6.5a1.6 1.6 0 003.2 0V8L14 5.5"/>`;
        case 'cross':    return `<path d="M8 2h5v5h5v5h-5v5H8v-5H3V7h5z"/>`;
        case 'soccer':   return `<circle cx="10" cy="10" r="8"/><path d="M10 2.5l2.5 4-1 3.5-3.5 1.5-2.5-2.5 1-4z"/>`;
        case 'pin':
        default:         return `<path d="M10 1c-3.3 0-6 2.5-6 6 0 4.5 6 11 6 11s6-6.5 6-11c0-3.3-2.6-6-6-6z"/><circle cx="10" cy="7.5" r="2"/>`;
      }
    }

    // Map styles (subtle, matches the editorial brief)
    const LIGHT_MAP_STYLES = [
      { featureType: 'poi',  stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#5C6680' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#C8DDF0' }] },
      { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#F4F6FA' }] },
    ];
    const DARK_MAP_STYLES = [
      { featureType: 'poi',  stylers: [{ visibility: 'off' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      { elementType: 'geometry', stylers: [{ color: '#0F1A2E' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: 'rgba(255,255,255,0.42)' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0A2545' }] },
    ];

    // === DIRECTIONS CACHE (offline-friendly) ===================
    // Persists driving polylines from the user's basecamp / userLocation to
    // each positioned slot of the itinerary, plus inter-day slot pairs.
    // Lets RouteScreen render real routes even when there's no signal.
    function loadDirectionsCache() {
      try {
        const raw = localStorage.getItem(`em-directions-${TRIP_ID}`);
        return raw ? JSON.parse(raw) : {};
      } catch { return {}; }
    }
    function saveDirectionsCache(cache) {
      try { localStorage.setItem(`em-directions-${TRIP_ID}`, JSON.stringify(cache)); } catch {}
    }
    function dirCacheKey(origin, dest, mode = 'DRIVING') {
      const r = n => Math.round(n * 1e4) / 1e4;  // 4 decimals ≈ 11m precision
      return `${r(origin.lat)},${r(origin.lng)}→${r(dest.lat)},${r(dest.lng)}:${mode}`;
    }

    // Hook: kicks off background prefetch of routes to all positioned slots
    // once the trip is loaded. Best-effort — silent failures keep the app
    // responsive even when offline.
    function useDirectionsPrefetch(trip, places, origin) {
      useEffect(() => {
        if (!trip || !places.length || !origin) return;
        let cancelled = false;
        (async () => {
          try {
            const { DirectionsService } = await google.maps.importLibrary('routes');
            const svc = new DirectionsService();
            const cache = loadDirectionsCache();
            const positioned = places.filter(p => p.lat != null);
            // Prefetch driving routes from origin to each positioned place
            for (const place of positioned) {
              if (cancelled) return;
              const key = dirCacheKey(origin, { lat: place.lat, lng: place.lng }, 'DRIVING');
              if (cache[key]) continue;  // already cached
              try {
                const result = await svc.route({
                  origin, destination: { lat: place.lat, lng: place.lng },
                  travelMode: google.maps.TravelMode.DRIVING,
                });
                const leg = result.routes[0]?.legs[0];
                if (!leg) continue;
                cache[key] = {
                  duration_min: Math.round(leg.duration.value / 60),
                  distance_km: Math.round(leg.distance.value / 100) / 10,
                  polyline: result.routes[0].overview_polyline,
                  fetched_at: Date.now(),
                };
                saveDirectionsCache(cache);
                // Tiny stagger to avoid hammering API
                await new Promise(r => setTimeout(r, 250));
              } catch (e) {
                // Silently skip — typical for places very far away or API errors
              }
            }
          } catch (e) {
            // Top-level fail (e.g. no network) — just skip prefetch
          }
        })();
        return () => { cancelled = true; };
      }, [trip?.providers?.length, origin?.lat, origin?.lng]);
    }
    // Curated list of utility categories that make sense on the road.
    // Type strings come from https://developers.google.com/maps/documentation/places/web-service/place-types
    const UTILITIES = [
      { id: 'gas_station',     label: 'Nafta',         icon: 'fuel',     types: ['gas_station'] },
      { id: 'supermarket',     label: 'Súper',         icon: 'cart',     types: ['supermarket', 'grocery_store'] },
      { id: 'pharmacy',        label: 'Farmacia',      icon: 'cross',    types: ['pharmacy', 'drugstore'] },
      { id: 'atm',             label: 'Cajero',        icon: 'cart',     types: ['atm'] },
      { id: 'rv_park',         label: 'RV Park',       icon: 'rv',       types: ['rv_park', 'campground'] },
      { id: 'restaurant',      label: 'Restaurante',   icon: 'fork',     types: ['restaurant'] },
    ];
    const UTIL_COLOR = '#D97706';  // amber — distinct from curated provider colors

    // Async wrapper around Places.searchNearby. Returns up to 12 results.
    async function searchUtilitiesNearby(center, types, lang = 'es') {
      if (!center || !types?.length) return [];
      try {
        const placesLib = await google.maps.importLibrary('places');
        const { Place, SearchNearbyRankPreference } = placesLib;
        const { places } = await Place.searchNearby({
          fields: ['displayName', 'formattedAddress', 'location', 'rating', 'userRatingCount',
                   'currentOpeningHours', 'internationalPhoneNumber', 'googleMapsURI', 'id'],
          locationRestriction: {
            center: { lat: center.lat, lng: center.lng },
            radius: 8000,  // 8km — typical "cerca tuyo" range driving
          },
          includedPrimaryTypes: types,
          maxResultCount: 12,
          rankPreference: SearchNearbyRankPreference.DISTANCE,
          language: lang,
          region: 'us',
        });
        return (places || []).map(p => {
          const loc = p.location;
          const lat = typeof loc?.lat === 'function' ? loc.lat() : loc?.lat;
          const lng = typeof loc?.lng === 'function' ? loc.lng() : loc?.lng;
          return {
            id: p.id || `nearby-${lat}-${lng}`,
            name: p.displayName || '',
            address: p.formattedAddress || '',
            lat, lng,
            rating: p.rating || null,
            ratingCount: p.userRatingCount || null,
            openNow: p.currentOpeningHours?.openNow ?? null,
            phone: p.internationalPhoneNumber || '',
            mapsUrl: p.googleMapsURI || '',
          };
        });
      } catch (e) {
        console.warn('searchUtilitiesNearby failed:', e);
        return [];
      }
    }

    // === MAP SCREEN ============================================
    function MapScreen({ trip, places, openDetail, userLocation, requestLocation, goto, filters, clearFilters }) {
      const [activeCat, setActiveCat] = useState('all');
      const [search, setSearch] = useState('');
      const initialCenter = useMemo(() => tripCenter(trip), [trip]);
      const [center, setCenter] = useState(initialCenter);

      // Nearby utilities state
      const [utilSheetOpen, setUtilSheetOpen] = useState(false);
      const [activeUtility, setActiveUtility] = useState(null);  // utility id currently selected
      const [nearbyResults, setNearbyResults] = useState([]);    // place results
      const [nearbyLoading, setNearbyLoading] = useState(false);
      const [activeNearby, setActiveNearby] = useState(null);    // tapped nearby place

      const ref = userLocation || initialCenter;

      const filtered = useMemo(() => {
        let f = places.map(p => ({
          ...p,
          _dist: placeDistanceLabel(p, ref),
          _distKm: p.lat != null ? haversineKm(ref.lat, ref.lng, p.lat, p.lng) : 999,
        }));
        if (activeCat !== 'all') f = f.filter(p => p.type === activeCat);
        if (search) {
          const q = search.toLowerCase();
          f = f.filter(p =>
            (p.name || '').toLowerCase().includes(q) ||
            (p.city || '').toLowerCase().includes(q)
          );
        }
        if (filters) {
          if (filters.types && filters.types.length) f = f.filter(p => filters.types.includes(p.type));
          if (filters.maxDistKm && filters.maxDistKm < 9999) f = f.filter(p => p._distKm <= filters.maxDistKm);
        }
        return f.sort((a, b) => a._distKm - b._distKm);
      }, [places, activeCat, search, ref.lat, ref.lng, filters]);

      const nearby = filtered.slice(0, 8);
      // Only show provider types that actually have at least one provider with coords.
      // Avoids displaying ghost categories inherited from cloned trips (e.g. winery/truffle in the Mundial).
      const providerTypes = useMemo(() => {
        const present = new Set(places.filter(p => p.lat != null).map(p => p.type));
        return (trip?.meta?.providerTypes || []).filter(t => present.has(t.key));
      }, [trip, places]);
      const hasFilters = !!filters && (filters.types?.length > 0 || (filters.maxDistKm && filters.maxDistKm < 9999));

      // Trigger nearby search whenever the active utility changes
      const onSelectUtility = useCallback(async (utility) => {
        setActiveUtility(utility?.id || null);
        if (!utility) { setNearbyResults([]); return; }
        setNearbyLoading(true);
        const results = await searchUtilitiesNearby(ref, utility.types);
        setNearbyResults(results);
        setNearbyLoading(false);
      }, [ref.lat, ref.lng]);

      return (
        <div style={{ position: 'absolute', inset: 0, background: P.surfaceDim }}>
          <GoogleMap
            pins={filtered}
            center={center}
            zoom={11}
            userLocation={userLocation}
            onPinTap={openDetail}
            nearbyPins={nearbyResults}
            onNearbyPinTap={setActiveNearby}
          />

          {/* Top bar */}
          <div className="em-safe-top" style={{
            position: 'absolute', top: 0, left: 16, right: 16, zIndex: 100,
            display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: P.surface, padding: '10px 14px', borderRadius: 14,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)', pointerEvents: 'auto',
            }}>
              <Icon name="search" size={18} color={P.textMuted}/>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscá lugares, comida, partidos…"
                style={{
                  flex: 1, border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 15, color: P.text, minWidth: 0,
                }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{
                  background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', color: P.textMuted,
                }}>
                  <Icon name="x" size={16} stroke={2.4}/>
                </button>
              )}
              <button onClick={() => goto('filters')} style={{
                background: hasFilters ? P.primary : P.surfaceDim,
                color: hasFilters ? '#fff' : P.primary,
                border: 'none', borderRadius: 10,
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', position: 'relative',
              }}>
                <Icon name="filter" size={16} stroke={2.4}/>
                {hasFilters && (
                  <div style={{
                    position: 'absolute', top: -3, right: -3,
                    width: 12, height: 12, borderRadius: '50%',
                    background: P.bad, border: '2px solid white',
                  }}/>
                )}
              </button>
            </div>
            {hasFilters && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: P.surface, padding: '8px 14px', borderRadius: 12,
                fontSize: 12, color: P.textMuted, pointerEvents: 'auto',
              }}>
                <span>
                  {filters.types?.length > 0 && `${filters.types.length} categoría${filters.types.length === 1 ? '' : 's'}`}
                  {filters.maxDistKm && filters.maxDistKm < 9999 && ` · hasta ${filters.maxDistKm} km`}
                </span>
                <button onClick={clearFilters} style={{
                  background: 'transparent', border: 'none', color: P.primary,
                  fontWeight: 700, fontSize: 12, cursor: 'pointer',
                }}>Limpiar</button>
              </div>
            )}
          </div>

          {/* Categories — horizontal scroll, providerTypes from trip meta */}
          <div style={{
            position: 'absolute', top: hasFilters ? 168 : 120, left: 0, right: 0, zIndex: 90,
            overflowX: 'auto', padding: '0 16px', pointerEvents: 'auto',
            transition: 'top 0.18s ease',
          }}>
            <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
              <button onClick={() => setActiveCat('all')} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999,
                flexShrink: 0, background: activeCat === 'all' ? P.text : P.surface,
                color: activeCat === 'all' ? '#fff' : P.text, border: 'none',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}>Todo · {filtered.length}</button>
              {providerTypes.map(t => (
                <CatChip key={t.key} type={t}
                         active={activeCat === t.key}
                         onClick={() => setActiveCat(activeCat === t.key ? 'all' : t.key)}/>
              ))}
            </div>
          </div>

          {/* Floating action buttons (right side) */}
          <div style={{
            position: 'absolute', right: 16, bottom: 240, zIndex: 80,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {/* Nearby utilities button */}
            <button onClick={() => setUtilSheetOpen(s => !s)} style={{
              width: 48, height: 48, borderRadius: 14,
              background: utilSheetOpen || activeUtility ? UTIL_COLOR : P.surface,
              border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: utilSheetOpen || activeUtility ? '#fff' : UTIL_COLOR,
              cursor: 'pointer', position: 'relative',
            }}>
              <Icon name="search" size={20} stroke={2.4}
                    color={utilSheetOpen || activeUtility ? '#fff' : UTIL_COLOR}/>
              {activeUtility && (
                <div style={{
                  position: 'absolute', top: -3, right: -3,
                  width: 14, height: 14, borderRadius: '50%',
                  background: P.bad, border: '2px solid white',
                  fontSize: 9, color: '#fff', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{nearbyResults.length}</div>
              )}
            </button>
            {/* Geolocate */}
            <button onClick={requestLocation} style={{
              width: 48, height: 48, borderRadius: 14, background: P.surface,
              border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: userLocation ? P.good : P.primary, cursor: 'pointer',
            }}>
              <Icon name="crosshair" size={20} stroke={2.4} color={userLocation ? P.good : P.primary}/>
            </button>
          </div>

          {/* Utilities sheet */}
          {utilSheetOpen && (
            <UtilitiesSheet
              utilities={UTILITIES}
              active={activeUtility}
              loading={nearbyLoading}
              resultsCount={nearbyResults.length}
              onSelect={(u) => onSelectUtility(u)}
              onClose={() => setUtilSheetOpen(false)}
              onClear={() => { setActiveUtility(null); setNearbyResults([]); setActiveNearby(null); }}
            />
          )}

          {/* Active nearby detail (small bottom card) */}
          {activeNearby && !utilSheetOpen && (
            <NearbyDetail place={activeNearby} userRef={ref}
                          onClose={() => setActiveNearby(null)}/>
          )}

          {/* Nearby sheet (curated places, hidden when utilities are open) */}
          {!utilSheetOpen && !activeNearby && (
            <NearbySheet places={nearby} openDetail={openDetail} userLocation={userLocation}/>
          )}

          <BottomNav active="map" goto={goto}/>
        </div>
      );
    }

    // === UTILITIES SHEET =======================================
    function UtilitiesSheet({ utilities, active, loading, resultsCount, onSelect, onClose, onClear }) {
      return (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 80, zIndex: 75,
          background: P.surface, borderRadius: '20px 20px 0 0',
          padding: '12px 16px 16px',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.16)',
        }}>
          <div style={{ width: 36, height: 4, background: P.border, borderRadius: 99, margin: '0 auto 12px' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: P.text, letterSpacing: -0.2 }}>
                Buscar cerca tuyo
              </div>
              <div style={{ fontSize: 11, color: P.textMuted, marginTop: 2 }}>
                Hasta 8 km a la redonda · datos de Google
              </div>
            </div>
            <button onClick={onClose} style={{
              background: P.surfaceDim, border: 'none', borderRadius: 10,
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: P.text, cursor: 'pointer',
            }}>
              <Icon name="x" size={16} stroke={2.4}/>
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {utilities.map(u => {
              const isActive = active === u.id;
              return (
                <button key={u.id}
                        onClick={() => isActive ? onSelect(null) : onSelect(u)}
                        style={{
                          padding: '12px 6px', borderRadius: 12, border: 'none',
                          background: isActive ? UTIL_COLOR : P.surfaceDim,
                          color: isActive ? '#fff' : P.text,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                  <Icon name={u.icon} size={22} stroke={2.2}/>
                  <span style={{ fontSize: 11.5, fontWeight: 600 }}>{u.label}</span>
                </button>
              );
            })}
          </div>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, color: P.textMuted, fontSize: 13 }}>
              <div className="em-spin" style={{
                width: 14, height: 14, borderRadius: '50%',
                border: '2px solid rgba(217,119,6,0.2)', borderTopColor: UTIL_COLOR,
              }}/>
              Buscando…
            </div>
          )}
          {!loading && active && resultsCount === 0 && (
            <div style={{ marginTop: 14, padding: 12, background: P.surfaceDim, borderRadius: 10,
                          fontSize: 13, color: P.textMuted, textAlign: 'center' }}>
              No encontré nada cerca. Probá otra categoría.
            </div>
          )}
          {!loading && active && resultsCount > 0 && (
            <div style={{
              marginTop: 14, padding: '10px 14px',
              background: `${UTIL_COLOR}15`, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: P.text }}>
                {resultsCount} resultado{resultsCount === 1 ? '' : 's'} en el mapa
              </span>
              <button onClick={onClear} style={{
                background: 'transparent', border: 'none',
                color: UTIL_COLOR, fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}>Limpiar</button>
            </div>
          )}
        </div>
      );
    }

    // === NEARBY UTILITY DETAIL (mini bottom card on tap) =======
    function NearbyDetail({ place, userRef, onClose }) {
      const dist = userRef ? haversineKm(userRef.lat, userRef.lng, place.lat, place.lng) : null;
      const distLabel = dist == null ? null : dist < 1 ? `${Math.round(dist*1000)} m` : `${dist.toFixed(1)} km`;
      const mapsLink = place.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
      const dirLink = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&travelmode=driving`;
      return (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 80, zIndex: 75,
          background: P.surface, borderRadius: '20px 20px 0 0',
          padding: '12px 16px 16px',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.16)',
        }}>
          <div style={{ width: 36, height: 4, background: P.border, borderRadius: 99, margin: '0 auto 12px' }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: P.text, letterSpacing: -0.3, lineHeight: 1.25 }}>
                {place.name}
              </div>
              <div style={{ fontSize: 12, color: P.textMuted, marginTop: 3, lineHeight: 1.3 }}>
                {place.address}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 12, color: P.textMuted, flexWrap: 'wrap' }}>
                {place.rating && <span>★ {place.rating.toFixed(1)}{place.ratingCount ? ` (${place.ratingCount})` : ''}</span>}
                {distLabel && <span>{distLabel}</span>}
                {place.openNow != null && (
                  <span style={{ color: place.openNow ? P.good : P.bad, fontWeight: 600 }}>
                    {place.openNow ? 'Abierto' : 'Cerrado'}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: P.surfaceDim, border: 'none', borderRadius: 10,
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: P.text, cursor: 'pointer', flexShrink: 0,
            }}>
              <Icon name="x" size={16} stroke={2.4}/>
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={dirLink} target="_blank" rel="noopener" style={{
              flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: 12, borderRadius: 12, background: P.primary, color: '#fff',
              textDecoration: 'none', fontSize: 13.5, fontWeight: 700,
            }}>
              <Icon name="pin" size={15} stroke={2.4} color="#fff"/>
              Cómo llegar
            </a>
            {place.phone && (
              <a href={`tel:${place.phone.replace(/[^+0-9]/g, '')}`} style={{
                flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: 12, borderRadius: 12, background: P.surfaceDim, color: P.text,
                textDecoration: 'none', fontSize: 13.5, fontWeight: 700,
              }}>
                <Icon name="phone" size={15} stroke={2.4}/>
                Llamar
              </a>
            )}
          </div>
        </div>
      );
    }

    function CatChip({ type, active, onClick }) {
      return (
        <button onClick={onClick} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 12px', borderRadius: 999, flexShrink: 0,
          background: active ? type.color : P.surface,
          color: active ? '#fff' : P.text,
          border: active ? 'none' : `1px solid ${P.border}`,
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          letterSpacing: -0.1, transition: 'all 0.15s',
        }}>
          <Icon name={TYPE_ICON[type.key] || 'pin'} size={14} stroke={2.4}/>
          {type.label}
        </button>
      );
    }

    function NearbySheet({ places, openDetail, userLocation }) {
      return (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 80, zIndex: 70 }}>
          <div style={{
            background: P.surface, borderRadius: '20px 20px 0 0',
            padding: '12px 16px 14px', boxShadow: '0 -8px 24px rgba(0,0,0,0.12)',
          }}>
            <div style={{ width: 36, height: 4, background: P.border, borderRadius: 99, margin: '0 auto 12px' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: P.text, letterSpacing: -0.2 }}>
                {userLocation ? 'Cerca tuyo' : 'Lugares destacados'}
              </span>
              <span style={{ fontSize: 12, color: P.textMuted }}>{places.length} lugar{places.length === 1 ? '' : 'es'}</span>
            </div>
            <div style={{
              display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4,
              marginLeft: -16, paddingLeft: 16, marginRight: -16, paddingRight: 16,
            }}>
              {places.length === 0 && (
                <div style={{ padding: '20px 8px', fontSize: 13, color: P.textMuted, fontStyle: 'italic' }}>
                  Sin lugares con esos filtros.
                </div>
              )}
              {places.map(p => <NearbyCard key={p.id} place={p} onClick={() => openDetail(p)}/>)}
            </div>
          </div>
        </div>
      );
    }

    function NearbyCard({ place, onClick }) {
      return (
        <button onClick={onClick} style={{
          flexShrink: 0, width: 200, textAlign: 'left',
          background: P.surfaceDim, borderRadius: 14, padding: 0,
          border: 'none', cursor: 'pointer', overflow: 'hidden',
        }}>
          <div style={{
            height: 70, position: 'relative',
            background: `linear-gradient(135deg, ${place.color}33 0%, ${place.color}11 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 8, left: 8, background: place.color, color: '#fff',
              padding: '4px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
              textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Icon name={place.icon} size={10} stroke={2.6} color="#fff"/>
              {place.typeLabel}
            </div>
          </div>
          <div style={{ padding: '10px 12px' }}>
            <div style={{
              fontSize: 14, fontWeight: 700, color: P.text, letterSpacing: -0.2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {place.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: P.textMuted, marginTop: 3 }}>
              {place._dist && <span>{place._dist}</span>}
              {place.city && <><span>·</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.city}</span></>}
            </div>
          </div>
        </button>
      );
    }

    // === DETAIL SCREEN =========================================
    // Includes a background lookup to Google Places to refresh hours/openNow,
    // cached in sessionStorage so we don't re-fetch within the same session.
    function usePlaceLiveDetails(place) {
      const [extra, setExtra] = useState(null);
      useEffect(() => {
        if (!place?.name) return;
        const cacheKey = `em-pdtl-${place.id}`;
        try {
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) { setExtra(JSON.parse(cached)); return; }
        } catch {}
        let cancelled = false;
        (async () => {
          try {
            const placesLib = await google.maps.importLibrary('places');
            const PlaceClass = placesLib.Place;
            const query = [place.name, place.city].filter(Boolean).join(' ');
            const { places } = await PlaceClass.searchByText({
              textQuery: query,
              fields: ['displayName', 'regularOpeningHours', 'currentOpeningHours', 'rating', 'userRatingCount'],
              language: 'es',
              maxResultCount: 1,
              ...(place.lat != null && place.lng != null
                ? { locationBias: { center: { lat: place.lat, lng: place.lng }, radius: 1500 } }
                : {})
            });
            if (cancelled) return;
            const found = places?.[0];
            if (!found) return;
            const live = {
              hoursToday: found.regularOpeningHours?.weekdayDescriptions || [],
              openNow: found.currentOpeningHours?.openNow ?? null,
              rating: found.rating || null,
              ratingCount: found.userRatingCount || null,
            };
            try { sessionStorage.setItem(cacheKey, JSON.stringify(live)); } catch {}
            setExtra(live);
          } catch (e) {
            // Silently fail — fall back to whatever is in the DB
          }
        })();
        return () => { cancelled = true; };
      }, [place?.id]);
      return extra;
    }

    function DetailScreen({ place, goBack, onRoute, isFav, toggleFav, userLocation, trip }) {
      const live = usePlaceLiveDetails(place);
      const dist = place.lat != null && userLocation ? haversineKm(userLocation.lat, userLocation.lng, place.lat, place.lng) : null;
      const distLabel = dist == null ? null : dist < 1 ? `${Math.round(dist*1000)} m` : `${dist.toFixed(1)} km`;
      const tel = formatPhone(place.phone);
      const mapsLink = place.mapUrl || (place.lat != null ? `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}` : null);
      // Today's hours — prefer live data, fall back to stored
      const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;  // Mon-based for Google's format
      const hoursToday = live?.hoursToday?.[todayIdx] || place.hours || null;
      const rating = live?.rating || place.rating;
      const ratingCount = live?.ratingCount;

      return (
        <div style={{ position: 'absolute', inset: 0, background: P.surfaceDim, overflow: 'auto', paddingBottom: 100 }}>
          {/* Hero */}
          <div style={{
            position: 'relative',
            background: `linear-gradient(135deg, ${place.color} 0%, ${place.color}cc 100%)`,
            color: '#fff', padding: '60px 20px 30px',
          }}>
            <button onClick={goBack} style={{
              position: 'absolute', top: 50, left: 14, zIndex: 10,
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)', color: '#fff',
            }}>
              <Icon name="chevron-l" size={20} stroke={2.4}/>
            </button>
            <button onClick={toggleFav} style={{
              position: 'absolute', top: 50, right: 14, zIndex: 10,
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)', color: '#fff',
            }}>
              <Icon name="heart" size={20} stroke={2.4} fill={isFav}/>
            </button>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
              padding: '5px 12px', borderRadius: 99,
              fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
              marginBottom: 14,
            }}>
              <Icon name={place.icon} size={12} stroke={2.6} color="#fff"/>
              {place.typeLabel}
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1.1 }}>
              {place.name}
            </h1>
            {(rating || place.michelin > 0) && (
              <div style={{ marginTop: 10, display: 'flex', gap: 12, alignItems: 'center', fontSize: 14 }}>
                {rating && (
                  <span>★ {Number(rating).toFixed(1)}{ratingCount ? ` · ${ratingCount} reseñas` : ''}</span>
                )}
                {place.michelin > 0 && <span>{'★'.repeat(place.michelin)} Michelin</span>}
              </div>
            )}
            {live?.openNow != null && (
              <div style={{
                marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
                background: live.openNow ? 'rgba(14, 159, 110, 0.25)' : 'rgba(220, 38, 38, 0.25)',
                padding: '4px 10px', borderRadius: 99,
                fontSize: 12, fontWeight: 700, letterSpacing: 0.3,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: live.openNow ? P.good : P.bad,
                }}/>
                {live.openNow ? 'Abierto ahora' : 'Cerrado ahora'}
              </div>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: '18px 16px' }}>
            {/* Action buttons row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <button onClick={onRoute} style={{ ...detailActionBtn, background: P.primary, color: '#fff' }}>
                <Icon name="pin" size={16} stroke={2.4} color="#fff"/>
                Cómo llegar
              </button>
              {tel && (
                <a href={`tel:${tel.replace(/[^+0-9]/g, '')}`} style={detailActionBtn}>
                  <Icon name="phone" size={16} stroke={2.4}/>
                  Llamar
                </a>
              )}
              {place.web && (
                <a href={place.web.startsWith('http') ? place.web : `https://${place.web}`}
                   target="_blank" rel="noopener" style={detailActionBtn}>
                  <Icon name="share" size={16} stroke={2.4}/>
                  Web
                </a>
              )}
            </div>

            {/* Description */}
            {place.desc && (
              <div style={{ background: P.surface, borderRadius: 14, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 14.5, lineHeight: 1.55, color: P.text }}>
                  {place.desc}
                </div>
              </div>
            )}

            {/* Info rows */}
            <div style={{ background: P.surface, borderRadius: 14, padding: '4px 16px', marginBottom: 14 }}>
              {place.city &&     <InfoRow icon="pin"   label="Dirección" value={place.city}/>}
              {hoursToday &&     <InfoRow icon="clock" label="Horarios hoy" value={hoursToday}/>}
              {place.price &&    <InfoRow icon="cart"  label="Precio"    value={place.price}/>}
              {tel &&            <InfoRow icon="phone" label="Teléfono"  value={tel}/>}
              {distLabel &&      <InfoRow icon="walk"  label="Distancia desde tu posición" value={distLabel} last/>}
            </div>

            {/* Live full week hours (when available) */}
            {live?.hoursToday?.length > 1 && (
              <div style={{ background: P.surface, borderRadius: 14, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 11.5, color: P.textMuted, letterSpacing: 0.3, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
                  Toda la semana
                </div>
                {live.hoursToday.map((line, i) => (
                  <div key={i} style={{
                    fontSize: 13, padding: '4px 0',
                    color: i === todayIdx ? P.primary : P.text,
                    fontWeight: i === todayIdx ? 700 : 400,
                  }}>{line}</div>
                ))}
              </div>
            )}

            {/* Tags */}
            {place.tags && place.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {place.tags.map((t, i) => (
                  <span key={i} style={{
                    background: P.surface, padding: '6px 12px', borderRadius: 99,
                    fontSize: 12, fontWeight: 600, color: P.textMuted,
                  }}>{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    const detailActionBtn = {
      flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      background: P.surface, color: P.primary, textDecoration: 'none',
      padding: '12px', borderRadius: 12, fontSize: 13.5, fontWeight: 700,
      border: 'none', cursor: 'pointer',
    };

    function InfoRow({ icon, label, value, last }) {
      return (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '14px 0',
          borderBottom: last ? 'none' : `1px solid ${P.border}`,
        }}>
          <div style={{ flexShrink: 0, marginTop: 1 }}>
            <Icon name={icon} size={16} color={P.textMuted} stroke={2}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, color: P.textMuted, letterSpacing: 0.2, textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 14, color: P.text, marginTop: 2, wordBreak: 'break-word' }}>{value}</div>
          </div>
        </div>
      );
    }

    // === ITINERARY SCREEN ======================================
    function ItineraryScreen({ trip, openDetail, goto, places, matches, initialDay }) {
      const itinerary = trip?.itinerary || [];
      const [selectedDay, setSelectedDay] = useState(() => {
        if (typeof initialDay === 'number' && initialDay >= 0 && initialDay < itinerary.length) {
          return initialDay;
        }
        return 0;
      });
      const day = itinerary[selectedDay];
      const slots = day?.slots || [];

      // Build a place lookup for slot.title fuzzy match
      const placesByName = useMemo(() => {
        const m = {};
        places.forEach(p => { if (p.name) m[p.name.toLowerCase().trim()] = p; });
        return m;
      }, [places]);
      // Read slot title/description from the client layer when present, fall back
      // to internal. Filter out slots explicitly hidden from clients.
      const slotTitle = (slot) =>
        slot.client?.title?.trim() || slot.internal?.title?.trim() || slot.title || '';
      const slotDescription = (slot) =>
        slot.client?.description?.trim() || slot.internal?.description?.trim() || slot.description || '';
      const slotIsVisible = (slot) =>
        slot.client?.visible !== false;  // defaults to true if undefined
      const slotPlace = (slot) => {
        if (slot.providerId) return places.find(p => p.id === slot.providerId) || null;
        const title = slotTitle(slot);
        if (title) {
          const k = title.toLowerCase().trim();
          if (placesByName[k]) return placesByName[k];
          // Loose contains-match
          return places.find(p => p.name && (k.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(k))) || null;
        }
        return null;
      };

      // Matches happening on the currently selected day
      const todayMatches = useMemo(() => {
        if (!day?.date || !matches?.length) return [];
        return matches.filter(m => m.match_date === day.date);
      }, [day?.date, matches]);

      return (
        <div style={{ position: 'absolute', inset: 0, background: P.surfaceDim, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div className="em-safe-top" style={{
            background: P.surface, paddingLeft: 16, paddingRight: 16, paddingBottom: 12,
            borderBottom: `1px solid ${P.border}`,
          }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.6, marginTop: 8 }}>Mi viaje</h2>
            <div style={{ fontSize: 13, color: P.textMuted, marginTop: 2 }}>
              {itinerary.length} día{itinerary.length === 1 ? '' : 's'} · {trip?.providers?.length || 0} paradas
            </div>
          </div>

          {/* Day chips */}
          <div style={{ overflowX: 'auto', padding: '12px 16px', background: P.surface, borderBottom: `1px solid ${P.border}` }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {itinerary.map((d, i) => {
                // Solo marcar con puntito rojo los días con partido de Argentina (highlight=true)
                const hasMatch = matches?.some(m => m.match_date === d.date && m.highlight);
                return (
                  <button key={d.id || i} onClick={() => setSelectedDay(i)} style={{
                    flexShrink: 0, padding: '8px 14px', borderRadius: 99,
                    background: i === selectedDay ? P.primary : P.surfaceDim,
                    color: i === selectedDay ? '#fff' : P.text,
                    border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                    minWidth: 64, position: 'relative',
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, opacity: 0.7 }}>
                      {(d.weekday || '').slice(0,3).toUpperCase()}
                    </span>
                    <span>{d.date ? d.date.slice(8) : `D${i+1}`}</span>
                    {hasMatch && (
                      <span style={{
                        position: 'absolute', top: 4, right: 6,
                        width: 6, height: 6, borderRadius: '50%',
                        background: i === selectedDay ? '#fff' : P.bad,
                      }}/>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px 100px' }}>
            {day && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: P.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  {day.weekday} · {day.date}
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.4, marginTop: 4, color: P.text }}>
                  {day.title || 'Día sin título'}
                </h3>
              </div>
            )}

            {/* Matches happening today — widget */}
            {todayMatches.length > 0 && (
              <div style={{
                background: `linear-gradient(135deg, ${P.primary} 0%, ${P.primaryDeep} 100%)`,
                borderRadius: 14, padding: '14px 14px 12px', marginBottom: 16,
                color: '#fff',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10,
                  opacity: 0.85,
                }}>
                  <Icon name="soccer" size={13} stroke={2.4} color="#fff"/>
                  PARTIDOS DEL MUNDIAL ESTE DÍA
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {todayMatches.map(m => (
                    <DayMatchRow key={m.id} match={m} highlighted={m.highlight}/>
                  ))}
                </div>
              </div>
            )}

            {(() => {
              const visibleSlots = slots.filter(slotIsVisible);
              if (visibleSlots.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: 40, color: P.textMuted, fontStyle: 'italic' }}>
                    Sin actividades para este día.
                  </div>
                );
              }
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {visibleSlots.map((slot, idx) => {
                    const place = slotPlace(slot);
                    const title = slotTitle(slot);
                    const description = slotDescription(slot);
                    return (
                      <button key={slot.id || idx}
                        onClick={() => place && openDetail(place)}
                        disabled={!place}
                        style={{
                          background: P.surface, border: 'none', borderRadius: 14,
                          padding: '14px 16px', textAlign: 'left',
                          display: 'flex', alignItems: 'flex-start', gap: 12,
                          cursor: place ? 'pointer' : 'default',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      }}>
                        <div style={{
                          flexShrink: 0,
                          width: 50, padding: '6px 0',
                          textAlign: 'center',
                          fontSize: 13, fontWeight: 700, color: P.primary,
                        }}>
                          {slot.timeStart || slot.time || '—'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 14.5, fontWeight: 600, color: P.text,
                            lineHeight: 1.3,
                          }}>
                            {title || 'Sin título'}
                          </div>
                          {place && place.name !== title && (
                            <div style={{ fontSize: 12, color: P.textMuted, marginTop: 2 }}>
                              {place.name}
                            </div>
                          )}
                          {description && (
                            <div style={{ fontSize: 12.5, color: P.textMuted, marginTop: 4, lineHeight: 1.4 }}>
                              {description}
                            </div>
                          )}
                        </div>
                        {place && (
                          <Icon name="chevron-r" size={16} color={P.textDim}/>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          <BottomNav active="trip" goto={goto}/>
        </div>
      );
    }

    // Compact row for the "matches today" widget inside ItineraryScreen
    function DayMatchRow({ match, highlighted }) {
      const flagHome = TEAM_FLAGS[match.team_home] || '';
      const flagAway = TEAM_FLAGS[match.team_away] || '';
      return (
        <div style={{
          background: highlighted ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
          borderRadius: 10, padding: '8px 12px',
          display: 'flex', alignItems: 'center', gap: 10,
          border: highlighted ? '1px solid rgba(255,255,255,0.3)' : 'none',
        }}>
          <div style={{
            fontSize: 13, fontWeight: 800, letterSpacing: -0.3,
            minWidth: 42, fontFamily: '"Inter Tight"',
          }}>
            {matchTimeShort(match.match_time)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: -0.2,
                          display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              {flagHome && <span style={{ fontSize: 15 }}>{flagHome}</span>}
              <span>{match.team_home}</span>
              <span style={{ opacity: 0.5, margin: '0 2px' }}>vs</span>
              {flagAway && <span style={{ fontSize: 15 }}>{flagAway}</span>}
              <span>{match.team_away}</span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>
              {match.city} · {match.stadium}
            </div>
          </div>
          {highlighted && (
            <div style={{
              background: '#fff', color: P.primary,
              padding: '2px 8px', borderRadius: 99,
              fontSize: 9.5, fontWeight: 800, letterSpacing: 0.5,
            }}>
              TU PARTIDO
            </div>
          )}
        </div>
      );
    }


    // === CALENDAR SCREEN (Mundial — todos los partidos desde DB) =====
    function CalendarScreen({ goto, onMatchTap, matches }) {
      const [filter, setFilter] = useState('mine');  // 'mine' | 'all' | 'group' | 'r32' | 'r16' | 'qf' | 'sf' | 'final'
      const filtered = useMemo(() => {
        if (!matches) return [];
        if (filter === 'mine') return matches.filter(m => m.highlight);
        if (filter === 'all')  return matches;
        return matches.filter(m => m.stage === filter);
      }, [matches, filter]);

      // Group matches by date for the section headers
      const byDate = useMemo(() => {
        const groups = {};
        filtered.forEach(m => {
          (groups[m.match_date] = groups[m.match_date] || []).push(m);
        });
        return Object.entries(groups).map(([date, ms]) => ({ date, matches: ms }));
      }, [filtered]);

      const filters = [
        { id: 'mine',  label: 'Mis partidos', count: matches.filter(m => m.highlight).length },
        { id: 'all',   label: 'Todos',        count: matches.length },
        { id: 'group', label: 'Grupos',       count: matches.filter(m => m.stage === 'group').length },
        { id: 'r32',   label: 'R32',          count: matches.filter(m => m.stage === 'r32').length },
        { id: 'r16',   label: 'Octavos',      count: matches.filter(m => m.stage === 'r16').length },
        { id: 'qf',    label: 'Cuartos',      count: matches.filter(m => m.stage === 'qf').length },
        { id: 'sf',    label: 'Semis',        count: matches.filter(m => m.stage === 'sf').length },
        { id: 'final', label: 'Final',        count: matches.filter(m => m.stage === 'final').length },
      ].filter(f => f.count > 0 || f.id === 'mine' || f.id === 'all');

      return (
        <div style={{ position: 'absolute', inset: 0, background: P.surfaceDim, display: 'flex', flexDirection: 'column' }}>
          <div className="em-safe-top" style={{
            background: `linear-gradient(180deg, ${P.primary} 0%, ${P.primaryDeep} 100%)`,
            color: '#fff', padding: '60px 20px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Icon name="flag-ar" size={18}/>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5 }}>
                MUNDIAL USA · CAN · MEX 2026
              </span>
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.8 }}>
              Calendario completo
            </h2>
            <p style={{ fontSize: 13, opacity: 0.78, marginTop: 4, lineHeight: 1.4 }}>
              {matches.length} partido{matches.length === 1 ? '' : 's'} cargado{matches.length === 1 ? '' : 's'} · Datos en vivo
            </p>
          </div>

          {/* Filter chips */}
          <div style={{ overflowX: 'auto', padding: '12px 16px', background: P.surface, borderBottom: `1px solid ${P.border}` }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {filters.map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  flexShrink: 0, padding: '7px 12px', borderRadius: 99,
                  background: filter === f.id ? P.primary : P.surfaceDim,
                  color: filter === f.id ? '#fff' : P.text,
                  border: 'none', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  letterSpacing: -0.1,
                }}>
                  {f.label}{f.count > 0 && filter !== f.id ? ` · ${f.count}` : ''}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 100px' }}>
            {matches.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: P.textMuted, fontStyle: 'italic' }}>
                Cargando partidos…
              </div>
            )}
            {byDate.length === 0 && matches.length > 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: P.textMuted, fontStyle: 'italic' }}>
                Sin partidos en esta categoría.
              </div>
            )}
            {byDate.map(({ date, matches: ms }) => (
              <div key={date} style={{ marginBottom: 18 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: P.textMuted, letterSpacing: 1,
                  textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4,
                }}>
                  {formatDateHeading(date)}
                </div>
                {ms.map(m => <MatchCard key={m.id} match={m} onClick={() => onMatchTap?.(m)}/>)}
              </div>
            ))}
          </div>

          <BottomNav active="cal" goto={goto}/>
        </div>
      );
    }

    function formatDateHeading(dateStr) {
      // '2026-06-16' → 'Martes 16 de junio'
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const wd = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][date.getDay()];
      const mo = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][m-1];
      return `${wd} ${d} de ${mo}`;
    }

    function MatchCard({ match, onClick }) {
      const isHighlight = match.highlight;
      const stage = STAGE_SHORT[match.stage] || match.stage;
      const groupLabel = match.group_code ? `Grupo ${match.group_code}` : stage;
      const isTbd = match.team_home === 'TBD' && match.team_away === 'TBD';
      return (
        <button onClick={onClick} style={{
          width: '100%', display: 'block', textAlign: 'left',
          background: P.surface, border: 'none', borderRadius: 14,
          padding: 14, marginBottom: 8, cursor: 'pointer',
          boxShadow: isHighlight ? `0 0 0 2px ${P.primary}40` : '0 1px 3px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: isHighlight ? P.primary : P.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {groupLabel}{match.match_number ? ` · #${match.match_number}` : ''}
            </div>
            <div style={{ fontSize: 11, color: P.textMuted }}>{match.stadium}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Team code={match.team_home}/>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, flexShrink: 0, minWidth: 60 }}>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.4, color: P.text, fontFamily: '"Inter Tight"' }}>
                {matchTimeShort(match.match_time)}
              </div>
              {match.status === 'final' && match.home_score != null
                ? <div style={{ fontSize: 14, fontWeight: 700, color: P.primary }}>{match.home_score} - {match.away_score}</div>
                : <div style={{ fontSize: 11, color: P.textDim, letterSpacing: 0.3 }}>vs</div>
              }
            </div>
            <Team code={match.team_away} align="end"/>
          </div>
          {/* Bracket description for playoff matches with TBD teams */}
          {isTbd && match.notes && (
            <div style={{
              fontSize: 11.5, color: P.textMuted, textAlign: 'center', marginTop: 10,
              padding: '6px 10px', background: P.surfaceDim, borderRadius: 8,
              fontStyle: 'italic',
            }}>
              {match.notes}
            </div>
          )}
          <div style={{ fontSize: 11.5, color: P.textMuted, textAlign: 'center', marginTop: 8 }}>
            {match.city}{match.country !== 'US' ? `, ${match.country}` : ''}
          </div>
        </button>
      );
    }

    function Team({ code, align = 'start' }) {
      const flag = TEAM_FLAGS[code] || '';
      const isTbd = code === 'TBD' || !code;
      return (
        <div style={{ flex: 1, textAlign: align === 'end' ? 'right' : 'left', minWidth: 0 }}>
          {flag && (
            <div style={{
              fontSize: 26, lineHeight: 1, marginBottom: 4,
              // Emojis on macOS Safari can look fuzzy if scaled — keep crisp
              fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
            }}>
              {flag}
            </div>
          )}
          <div style={{
            fontSize: 16, fontWeight: 800, color: isTbd ? P.textDim : P.text, letterSpacing: -0.3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{isTbd ? '—' : code}</div>
          <div style={{
            fontSize: 11, color: P.textMuted, marginTop: 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{teamLabel(code)}</div>
        </div>
      );
    }

    // === LOADING + ERROR =======================================
    function LoadingScreen() {
      return (
        <div style={{
          position: 'fixed', inset: 0,
          background: P.primary, color: '#fff',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 16,
        }}>
          <div className="em-spin" style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.25)', borderTopColor: '#fff',
          }}/>
          <div style={{ fontSize: 13, opacity: 0.7, letterSpacing: 1.5, fontWeight: 600 }}>
            CARGANDO TU VIAJE
          </div>
        </div>
      );
    }
    function ErrorScreen({ error, onRetry }) {
      return (
        <div style={{
          position: 'fixed', inset: 0,
          background: P.bg, color: '#fff',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 16, padding: 32, textAlign: 'center',
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>No se pudo cargar el viaje</h2>
          <p style={{ fontSize: 14, opacity: 0.7, maxWidth: 280 }}>{error}</p>
          {onRetry && (
            <button onClick={onRetry} style={{
              marginTop: 12, padding: '12px 24px', background: '#fff', color: P.primary,
              border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>Reintentar</button>
          )}
        </div>
      );
    }

    // === FILTERS SCREEN ========================================
    function FiltersScreen({ trip, initialFilters, goBack, onApply }) {
      const providerTypes = trip?.meta?.providerTypes || [];
      const [types, setTypes] = useState(initialFilters?.types || []);
      const [maxDist, setMaxDist] = useState(initialFilters?.maxDistKm ?? 9999);

      const toggle = (k) => setTypes(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k]);
      const clear = () => { setTypes([]); setMaxDist(9999); };
      const apply = () => {
        const hasAny = types.length > 0 || maxDist < 9999;
        onApply(hasAny ? { types, maxDistKm: maxDist } : null);
      };

      return (
        <div style={{ position: 'absolute', inset: 0, background: P.surfaceDim, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div className="em-safe-top" style={{
            paddingLeft: 16, paddingRight: 16, paddingBottom: 14,
            background: P.bg, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid rgba(255,255,255,0.08)`,
          }}>
            <button onClick={goBack} style={{
              background: 'transparent', border: 'none', padding: 8, marginLeft: -8,
              color: '#fff', cursor: 'pointer',
            }}>
              <Icon name="x" size={22} stroke={2.4}/>
            </button>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Filtros</div>
            <button onClick={clear} style={{
              background: 'transparent', border: 'none', padding: 8, marginRight: -8,
              color: P.accent, fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}>Limpiar</button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 120px' }}>
            <FilterSection title="Categorías">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {providerTypes.map(t => {
                  const isOn = types.includes(t.key);
                  return (
                    <button key={t.key} onClick={() => toggle(t.key)} style={{
                      padding: '14px 8px', borderRadius: 14, border: 'none',
                      background: isOn ? t.color : P.surface,
                      color: isOn ? '#fff' : P.text,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      <Icon name={TYPE_ICON[t.key] || 'pin'} size={22} stroke={2.2}/>
                      <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: -0.1 }}>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </FilterSection>

            <FilterSection title="Distancia máxima">
              <div style={{ background: P.surface, padding: 16, borderRadius: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: P.textMuted }}>Hasta</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: P.primary }}>
                    {maxDist >= 9999 ? 'Sin límite' : `${maxDist} km`}
                  </span>
                </div>
                <input type="range" min={5} max={500} step={5}
                  value={maxDist > 500 ? 500 : maxDist}
                  onChange={(e) => {
                    const v = +e.target.value;
                    setMaxDist(v >= 500 ? 9999 : v);
                  }}
                  style={{ width: '100%', accentColor: P.primary }}/>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: P.textDim, marginTop: 4 }}>
                  <span>5 km</span><span>Sin límite</span>
                </div>
              </div>
            </FilterSection>
          </div>

          {/* Apply button */}
          <div className="em-safe-bottom" style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '16px 16px 12px', background: P.surfaceDim,
            borderTop: `1px solid ${P.border}`,
          }}>
            <button onClick={apply} style={{
              width: '100%', background: P.primary, color: '#fff', border: 'none',
              padding: '16px', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>
              Aplicar filtros{types.length ? ` · ${types.length}` : ''}
            </button>
          </div>
        </div>
      );
    }

    function FilterSection({ title, children }) {
      return (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: P.textMuted, marginBottom: 10 }}>
            {title}
          </div>
          {children}
        </div>
      );
    }

    // === ROUTE SCREEN ==========================================
    // Resolves real Directions from Google API. Origin defaults to userLocation
    // if available, otherwise to the trip's basecamp coords.
    function RouteScreen({ dest, userLocation, trip, goBack }) {
      const [mode, setMode] = useState('DRIVING');  // DRIVING | WALKING
      const [route, setRoute] = useState(null);     // { duration, distance, polyline, error }
      const [loading, setLoading] = useState(true);
      const containerRef = useRef(null);
      const mapRef = useRef(null);
      const overlaysRef = useRef([]);

      // Origin resolution: userLocation > basecamp coords > Kansas City
      const origin = useMemo(() => {
        if (userLocation) return { ...userLocation, label: 'Tu ubicación' };
        const bc = trip?.meta?.basecamp?.coords;
        if (bc?.lat && bc?.lon) return { lat: bc.lat, lng: bc.lon, label: trip?.meta?.basecamp?.label || 'Basecamp' };
        return { lat: 39.0489, lng: -94.4839, label: 'Kansas City' };
      }, [userLocation, trip?.meta?.basecamp]);

      // Fetch route whenever mode changes (or dest/origin)
      // Strategy: try localStorage cache first (offline-friendly), fall back to live API.
      useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setRoute(null);
        (async () => {
          // 1. Cache hit — instant render even offline
          const cache = loadDirectionsCache();
          const key = dirCacheKey(origin, { lat: dest.lat, lng: dest.lng }, mode);
          if (cache[key]) {
            if (cancelled) return;
            setRoute({
              duration_min: cache[key].duration_min,
              distance_km: cache[key].distance_km,
              polyline: cache[key].polyline,
              cached: true,
              error: null,
            });
            setLoading(false);
            // Continue to refresh in background if older than 24h
            if (Date.now() - (cache[key].fetched_at || 0) < 24 * 3600 * 1000) return;
          }
          // 2. Live fetch (may fail offline — that's OK if we have cache)
          try {
            const { DirectionsService } = await google.maps.importLibrary('routes');
            const svc = new DirectionsService();
            const result = await svc.route({
              origin: { lat: origin.lat, lng: origin.lng },
              destination: { lat: dest.lat, lng: dest.lng },
              travelMode: google.maps.TravelMode[mode],
            });
            if (cancelled) return;
            const leg = result.routes[0]?.legs[0];
            if (!leg) throw new Error('Sin ruta');
            const fresh = {
              duration_min: Math.round(leg.duration.value / 60),
              distance_km: Math.round(leg.distance.value / 100) / 10,
              polyline: result.routes[0].overview_polyline,
              cached: false,
              error: null,
            };
            setRoute(fresh);
            setLoading(false);
            // Update cache
            cache[key] = { ...fresh, fetched_at: Date.now() };
            saveDirectionsCache(cache);
          } catch (e) {
            if (cancelled) return;
            // If we already loaded from cache, keep it. Otherwise error.
            if (!cache[key]) {
              setRoute({ error: 'Sin señal · no se pudo calcular la ruta. Probá abrir en Google Maps.' });
            }
            setLoading(false);
          }
        })();
        return () => { cancelled = true; };
      }, [origin.lat, origin.lng, dest.lat, dest.lng, mode]);

      // Init + render map
      useEffect(() => {
        let cancelled = false;
        (async () => {
          const { Map } = await google.maps.importLibrary('maps');
          if (cancelled || !containerRef.current) return;
          mapRef.current = new Map(containerRef.current, {
            center: origin, zoom: 11,
            disableDefaultUI: true, gestureHandling: 'greedy', clickableIcons: false,
            styles: LIGHT_MAP_STYLES,
          });
        })();
        return () => { cancelled = true; };
      }, []);

      // Update overlays when route changes
      useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        overlaysRef.current.forEach(o => o.setMap(null));
        overlaysRef.current = [];
        // Origin pin (blue dot)
        const oMarker = new google.maps.Marker({
          map, position: origin,
          icon: {
            url: svgUserPinDataUrl(),
            scaledSize: new google.maps.Size(28, 28),
            anchor: new google.maps.Point(14, 14),
          },
          zIndex: 1000, title: origin.label,
        });
        overlaysRef.current.push(oMarker);
        // Destination pin
        const dMarker = new google.maps.Marker({
          map, position: { lat: dest.lat, lng: dest.lng },
          icon: {
            url: svgPinDataUrl(dest.color, dest.icon, true),
            scaledSize: new google.maps.Size(44, 55),
            anchor: new google.maps.Point(22, 55),
          },
          zIndex: 1001, title: dest.name,
        });
        overlaysRef.current.push(dMarker);
        // Polyline (only if we have a route)
        if (route?.polyline) {
          const decoded = decodePolyline(route.polyline);
          const poly = new google.maps.Polyline({
            path: decoded, map,
            geodesic: false,
            strokeColor: P.primary, strokeOpacity: 0.85, strokeWeight: 5,
          });
          overlaysRef.current.push(poly);
          const bounds = new google.maps.LatLngBounds();
          decoded.forEach(pt => bounds.extend(pt));
          bounds.extend(origin);
          bounds.extend({ lat: dest.lat, lng: dest.lng });
          map.fitBounds(bounds, { top: 80, right: 60, bottom: 280, left: 60 });
        } else {
          const bounds = new google.maps.LatLngBounds();
          bounds.extend(origin);
          bounds.extend({ lat: dest.lat, lng: dest.lng });
          map.fitBounds(bounds, { top: 80, right: 60, bottom: 280, left: 60 });
        }
      }, [route?.polyline, origin.lat, origin.lng, dest.lat, dest.lng]);

      const mapsExternalLink = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}&travelmode=${mode.toLowerCase()}`;

      return (
        <div style={{ position: 'absolute', inset: 0, background: P.surfaceDim }}>
          <div ref={containerRef} style={{ position: 'absolute', inset: 0, background: '#E8ECF2' }}/>

          {/* Top bar */}
          <div className="em-safe-top" style={{
            position: 'absolute', top: 0, left: 16, right: 16, zIndex: 100,
            display: 'flex', gap: 10, alignItems: 'center', pointerEvents: 'none',
          }}>
            <button onClick={goBack} style={{
              background: P.surface, border: 'none', borderRadius: 12,
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)', cursor: 'pointer', color: P.text,
              pointerEvents: 'auto',
            }}>
              <Icon name="chevron-l" size={20} stroke={2.4}/>
            </button>
            <div style={{
              flex: 1, background: P.surface, padding: '10px 14px', borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              fontSize: 14, fontWeight: 600, color: P.text,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              pointerEvents: 'auto',
            }}>
              <div style={{ fontSize: 10, color: P.textMuted, letterSpacing: 0.4, textTransform: 'uppercase' }}>Hacia</div>
              {dest.name}
            </div>
          </div>

          {/* Bottom sheet — route details + actions */}
          <div className="em-safe-bottom" style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            background: P.surface, borderRadius: '22px 22px 0 0',
            boxShadow: '0 -8px 28px rgba(0,0,0,0.16)',
            padding: '14px 18px 14px',
          }}>
            {/* Mode toggle */}
            <div style={{
              display: 'flex', gap: 6, background: P.surfaceDim, padding: 4, borderRadius: 12,
              marginBottom: 14,
            }}>
              {[
                { id: 'DRIVING', label: 'En auto',  icon: 'car' },
                { id: 'WALKING', label: 'A pie',    icon: 'walk' },
              ].map(m => (
                <button key={m.id} onClick={() => setMode(m.id)} style={{
                  flex: 1, padding: '10px 12px', borderRadius: 10, border: 'none',
                  background: mode === m.id ? P.surface : 'transparent',
                  color: mode === m.id ? P.primary : P.textMuted,
                  fontSize: 13, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  cursor: 'pointer',
                  boxShadow: mode === m.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}>
                  <Icon name={m.icon} size={15} stroke={2.4}/>
                  {m.label}
                </button>
              ))}
            </div>

            {/* Duration + distance prominent */}
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                <div className="em-spin" style={{
                  width: 16, height: 16, borderRadius: '50%',
                  border: '2.5px solid rgba(30,63,184,0.2)', borderTopColor: P.primary,
                }}/>
                <span style={{ fontSize: 14, color: P.textMuted }}>Calculando ruta…</span>
              </div>
            ) : route?.error ? (
              <div style={{ padding: '8px 0', color: P.textMuted, fontSize: 13 }}>
                ⚠ {route.error}. Probá abrir en Google Maps directamente.
              </div>
            ) : route ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: P.text, letterSpacing: -1, fontFamily: '"Inter Tight"' }}>
                  {formatDuration(route.duration_min)}
                </div>
                <div style={{ fontSize: 15, color: P.textMuted }}>· {route.distance_km} km</div>
              </div>
            ) : null}

            <a href={mapsExternalLink} target="_blank" rel="noopener" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              width: '100%', padding: 14, borderRadius: 12,
              background: P.primary, color: '#fff', textDecoration: 'none',
              fontSize: 14, fontWeight: 700,
            }}>
              <Icon name="arrow-right" size={16} stroke={2.4}/>
              Abrir en Google Maps
            </a>
          </div>
        </div>
      );
    }

    // Format duration like "1h 25m" or "12m"
    function formatDuration(min) {
      if (!Number.isFinite(min) || min < 1) return '—';
      const h = Math.floor(min / 60);
      const m = min % 60;
      if (h === 0) return `${m}m`;
      if (m === 0) return `${h}h`;
      return `${h}h ${m}m`;
    }

    // Decode Google's polyline encoded format
    function decodePolyline(encoded) {
      if (!encoded) return [];
      const points = [];
      let index = 0, lat = 0, lng = 0;
      while (index < encoded.length) {
        let b, shift = 0, result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lat += ((result & 1) ? ~(result >> 1) : (result >> 1));
        shift = 0; result = 0;
        do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lng += ((result & 1) ? ~(result >> 1) : (result >> 1));
        points.push({ lat: lat / 1e5, lng: lng / 1e5 });
      }
      return points;
    }

    // === APP ROOT ==============================================
    function App() {
      // Parse URL params for preview mode (used by the operator app's
      // "Previsualizar como cliente" button). When ?preview=<trip-id> matches
      // this app's TRIP_ID, bypass the access code. When ?day=N is present,
      // open directly on the itinerary screen with that day selected (1-indexed).
      const previewParams = useMemo(() => {
        try {
          const params = new URLSearchParams(window.location.search);
          const preview = params.get('preview');
          const dayParam = parseInt(params.get('day') || '0', 10);
          return {
            isPreview: !!preview && preview === TRIP_ID,
            initialDay: dayParam > 0 ? dayParam - 1 : null,
          };
        } catch { return { isPreview: false, initialDay: null }; }
      }, []);

      const [unlocked, setUnlocked] = useState(() => {
        if (previewParams.isPreview) return true;
        try { return localStorage.getItem('em-unlocked') === '1'; } catch { return false; }
      });
      const [screen, setScreen] = useState(() =>
        previewParams.initialDay !== null ? 'trip' : 'splash'
      );
      const [activePlace, setActivePlace] = useState(null);
      const [routeDest, setRouteDest] = useState(null);
      const [filters, setFilters] = useState(null);  // { types: [], maxDistKm: 50 } | null
      const { data: trip, loading, error } = useTrip(TRIP_ID);
      const matches = useWorldCupMatches();
      const [userLocation, requestLocation] = useUserLocation();
      const [favs, setFavs] = useLocalStorage(`em-${TRIP_ID}-favs`, []);

      // Transform providers into "places" once per trip change
      const places = useMemo(() => {
        if (!trip) return [];
        const providerTypes = trip.meta?.providerTypes || [];
        return (trip.providers || []).map(p => providerToPlace(p, providerTypes)).filter(Boolean);
      }, [trip]);

      // Prefetch driving polylines from basecamp to each place in background.
      // Best-effort, silent. Means Route screen has real routes even offline.
      const prefetchOrigin = useMemo(() => {
        if (userLocation) return userLocation;
        const bc = trip?.meta?.basecamp?.coords;
        if (bc?.lat && bc?.lon) return { lat: bc.lat, lng: bc.lon };
        return null;
      }, [userLocation, trip?.meta?.basecamp]);
      useDirectionsPrefetch(trip, places, prefetchOrigin);

      const openDetail = useCallback((p) => {
        setActivePlace(p);
        setScreen('detail');
      }, []);
      const openRoute = useCallback((p) => {
        setRouteDest(p);
        setScreen('route');
      }, []);
      const toggleFav = useCallback((id) => {
        setFavs(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
      }, [setFavs]);

      // Gate first
      if (!unlocked) return <AccessGate onUnlock={() => setUnlocked(true)}/>;
      if (loading) return <LoadingScreen/>;
      if (error)   return <ErrorScreen error={error} onRetry={() => location.reload()}/>;

      const goto = (s) => setScreen(s);

      // Render the actual screen, then overlay a preview banner if in preview mode.
      let screenEl;
      switch (screen) {
        case 'splash':
          screenEl = <SplashScreen onContinue={() => setScreen('map')} trip={trip}/>;
          break;
        case 'map':
          screenEl = <MapScreen trip={trip} places={places} openDetail={openDetail}
                            userLocation={userLocation} requestLocation={requestLocation} goto={goto}
                            filters={filters} clearFilters={() => setFilters(null)}/>;
          break;
        case 'filters':
          screenEl = <FiltersScreen trip={trip} initialFilters={filters}
                                goBack={() => setScreen('map')}
                                onApply={(f) => { setFilters(f); setScreen('map'); }}/>;
          break;
        case 'detail':
          screenEl = activePlace
            ? <DetailScreen place={activePlace} trip={trip}
                            goBack={() => setScreen('map')}
                            onRoute={() => openRoute(activePlace)}
                            isFav={favs.includes(activePlace.id)}
                            toggleFav={() => toggleFav(activePlace.id)}
                            userLocation={userLocation}/>
            : <MapScreen trip={trip} places={places} openDetail={openDetail}
                         userLocation={userLocation} requestLocation={requestLocation} goto={goto}
                         filters={filters} clearFilters={() => setFilters(null)}/>;
          break;
        case 'route':
          screenEl = routeDest
            ? <RouteScreen dest={routeDest} userLocation={userLocation} trip={trip}
                           goBack={() => setScreen('detail')}/>
            : <MapScreen trip={trip} places={places} openDetail={openDetail}
                         userLocation={userLocation} requestLocation={requestLocation} goto={goto}
                         filters={filters} clearFilters={() => setFilters(null)}/>;
          break;
        case 'trip':
          screenEl = <ItineraryScreen trip={trip} places={places} openDetail={openDetail} goto={goto} matches={matches} initialDay={previewParams.initialDay}/>;
          break;
        case 'cal':
          screenEl = <CalendarScreen goto={goto} matches={matches}/>;
          break;
        default:
          screenEl = <MapScreen trip={trip} places={places} openDetail={openDetail}
                            userLocation={userLocation} requestLocation={requestLocation} goto={goto}
                            filters={filters} clearFilters={() => setFilters(null)}/>;
      }

      if (previewParams.isPreview) {
        return (
          <>
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
              background: P.warn, color: '#fff', padding: '6px 14px',
              fontSize: 11, fontWeight: 700, textAlign: 'center',
              letterSpacing: '0.04em', textTransform: 'uppercase',
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}>
              Vista previa · modo operador
            </div>
            <div style={{ paddingTop: 28 }}>{screenEl}</div>
          </>
        );
      }
      return screenEl;
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
  