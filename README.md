# Expedición Mundial · USA 2026

App cliente PWA para seguir el viaje de Brian al Mundial de la FIFA 2026.
Cliente solo-lectura, sincronizado con la app de operaciones B&A vía Supabase Realtime.

**Stack**: React 18 (UMD) + esbuild bundle + Google Maps JS + Places API + Supabase JS + Service Worker (PWA installable).

## Archivos

- `index.html` — shell HTML (4 KB)
- `app.min.js` — bundle React minificado vía esbuild (~69 KB)
- `_src.jsx` — fuente JSX (no se sirve; referencia para regenerar el bundle)
- `manifest.webmanifest` — PWA manifest
- `service-worker.js` — offline cache
- Iconos PWA: `icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `favicon-32.png`
- `netlify.toml` — headers de cache, security, PWA

## Acceso

Código de acceso 4590 (hardcoded en `app.min.js`).
Lee el viaje `mundial-arg-2026` desde Supabase `pptldpjwggrnbkvppolu`.

## Datos del Mundial

Los 104 partidos viven en Supabase (tabla `wc26_matches`), no en el código.
La app los lee con realtime sync. Para editar resultados o cargar equipos
de eliminatorias, hacer UPDATE directo a la tabla.

## Deploy

Auto-deploy desde Netlify cuando se hace push a `app-mundial`.
Sitio: `expedicionmundial.netlify.app`.
