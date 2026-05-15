# Piemonte BA × TWT — Trip Operations (V5)

App colaborativa con sync real-time vía Supabase. Stack: HTML + Alpine.js + Leaflet, sin build step.

## Deploy

- **Drag-and-drop:** subir `index.html` a https://app.netlify.com/drop
- **Git push:** con el repo conectado a Netlify, `git push` deploya automáticamente.

## Stack

- Alpine.js 3.13.5 (CDN)
- Supabase JS SDK 2.x (CDN)
- Leaflet 1.9.4 (CDN)
- Google Fonts: Fraunces, Cormorant Garamond, Inter, JetBrains Mono

## Supabase

Tablas: `trips`, `comments`, `snapshots`, `changes`. RLS habilitada, publicadas en `supabase_realtime`. Project: pptldpjwggrnbkvppolu
