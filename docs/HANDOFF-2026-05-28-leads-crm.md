# B&A Operator App — Handoff 2026-05-28
**Estado:** Phase 1 (Providers V5D) + Phase 2 (Leads CRM frontend) shippeadas. Pendiente validación visual.

---

## TL;DR para nuevo chat de Claude

```
Leé docs/HANDOFF-2026-05-28-leads-crm.md del repo brianblisniuk/batwt rama main.
Para auth recuperá secrets de Vault:
SELECT name, decrypted_secret FROM vault.decrypted_secrets
WHERE name IN ('github_pat','backup_secret');
```

Eso es todo. Las MCPs (Supabase, Canva, Figma, Expedia, Booking, Semrush, Ahrefs, WordPress, Gmail, Google Calendar, Google Drive) ya están conectadas a nivel cuenta y aparecen automáticas.

---

## Infraestructura

- **Supabase project_id:** `pptldpjwggrnbkvppolu`
- **Repos:**
  - `brianblisniuk/batwt` rama `main` → batwt.netlify.app (B&A operator app, ~772 KB index.html, Alpine.js + Supabase realtime)
  - `brianblisniuk/batwt` rama `app-mundial` → expedicionmundial.netlify.app (PWA personal, React UMD, mismo backend)
- **Operators (auth.users):**
  - Brian: `9e11bed5-8e3a-4e7a-b3a0-dccd3b3ce188` / brianblisniuk@gmail.com
  - Federico: `1bf337b7-72d7-411b-98e8-c8f29f878778` / buenaventura.fe@gmail.com

## Secrets en Vault (no exponer en commits)

| name | uso |
|---|---|
| `github_pat` | Personal Access Token de brianblisniuk para repo batwt |
| `backup_secret` | X-Internal-Auth header para edge functions (`ada620a38b3357464597d04feb7f2f5ba9c1f230d3c2bdacb820c4a76e7df544`) |
| `anthropic_api_key` | preexistente |
| `resend_api_key` | preexistente |

## Edge functions desplegadas

- **bna_repo_v1** (verify_jwt=false) — lectura/búsqueda/parche del repo via GitHub API. PAT embebido. Acciones via POST + `x-internal-auth` header: `read`, `search`, `patch`, `write`, `snapshot`.
- **bna_providers_v5d_merge** (verify_jwt=false) — deprecada, usar bna_repo_v1
- Preexistentes: claude_writer, meta_lead_webhook, generate_pdf_3pager v3, generate_pdf_10pager, invite_client v5, send_email v2, nightly-backup

**⚠️ pg_net es async:** después de `net.http_post` esperar 12-20s antes de leer `net._http_response`.
**⚠️ Field `delta` engaña:** mezcla bytes GitHub vs char.length JS. Usar `applied[].bytes_delta` para deltas reales.

---

## Commits cronológicos (todo en main)

| SHA | Phase | Qué |
|---|---|---|
| a30202c4 | 1 | Snapshot defensivo pre-providers-crm |
| b4d9ef9e | 1 | CSS V5D (.v5d- prefix, +18,636 b) |
| 84b72c64 | 1 | Alpine state vars Providers (+801 b) |
| 9ab72766 | 1 | 17 métodos JS Providers (+10,920 b) |
| c5ead0d8 | 1 | HTML markup Providers section (+17,515 b) |
| af407d06 | — | Handoff doc inicial |
| 6e7c5208 | 2 | Alpine state + 17 métodos para Leads CRM (+9,137 b) |
| c5c7cf18 | 2 | HTML Leads (sidebar nav + mobile tile + section, +17,888 b) |

**Archivo actual `index.html`:** ~772,108 chars (puede variar por encoding UTF-8 chars como `·` `días` etc.)

---

## Backend Leads CRM (migration `leads_crm_backend_v1`)

10 RPCs SECURITY DEFINER, GRANT a `authenticated` + `service_role`:

| RPC | Args | Returns |
|---|---|---|
| `leads_crm_stats()` | — | TABLE 7 rows por stage |
| `leads_crm_list(...)` | 10 named params | TABLE 26 cols (con days_stale, event_count) |
| `leads_crm_pipeline(...)` | 4 named params | TABLE flat rows — agrupar en cliente por stage |
| `lead_full_detail(p_lead_id uuid)` | 1 param | jsonb `{lead, events}` |
| `lead_change_stage` / `_assign` / `_add_note` | varios | jsonb |
| `leads_bulk_change_stage(uuid[], text)` | 2 params | TABLE per-row result |
| `leads_crm_filter_options()` | — | jsonb |
| `user_display_name(uuid)` | 1 param | text |

**Stages:** new/contacted/qualified/proposal/negotiating/booked/lost
**Tablas:** `leads`, `lead_events` (cols: id, lead_id, kind, summary, body, metadata, actor_user_id, actor_name, occurred_at, created_at)
**Demo data:** 4 leads (Ortega/Nuevos · María+Lautaro/Propuesta · Pablo/Perdidos)

## Cliente Supabase en el frontend

`this._client = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_KEY)` instanciado en app() de Alpine.
Uso: `await this._client.rpc('rpc_name', { p_arg: val })`

---

## Pendiente

1. **Validar visualmente Phase 1 Providers V5D** — Brian reportó que las nuevas KPI cards/Pipeline no aparecen. Pendiente debugging con screenshot/DevTools. Hipótesis ordenadas: (a) JS error en init que aborta Alpine render, (b) HTML presente pero CSS roto, (c) CDN stale.
2. **Validar Phase 2 Leads CRM** — recién shippeado el 28/05. Checklist:
   - Nav: "Clientes" aparece en sidebar y en mobile "Más" drawer
   - Section: 7 KPI cards + view toggle Pipeline/Cards/Tabla
   - Default view: Pipeline 7 columnas con drag-drop
   - Drawer: detail + timeline + change-stage buttons + textarea para nota
3. **Mundial PWA** — sin deuda técnica (Brian logueado OK 27/05)

## Roadmap más amplio (B&A negocio)

- Llenar primera salida (24 ago 2026, 8 spots)
- Meta Ads campaign en progreso (~USD 100/sem, 3 audience stacks)
- Co-curator outreach (voces emergentes, no figuras institucionalizadas)
- Website rebuild blisniukamanov.com/v2/ via Paperclip
- Paperclip canonical doc bootstrappeada (BA-Documento-Canonico-v1.md)
- Ruta 66 motorhome trip: mes/duración/ticket TBD
- Expedición Mundial v2: generalizar para multi-trip con `trips.data_public` separation y per-trip access codes

---

## Approach técnico aprendido (importante para nuevos chats)

- **SQL dollar-quoting:** usar tags únicos (`$P2HTML$`, `$SECTION$`, `$STATE$`). Evitar `$BLOCK$` y `$sql$` (colisionan con ejemplos).
- **Anchors únicos:** patch action usa `one_only: true`. Si el anchor aparece 0 o >1 veces, falla.
- **Atomicidad:** múltiples patches en un call son atómicos. Si una falla, ninguna se aplica (422 con `failed` array).
- **JS injection:** usar `var` (no let/const/arrow para minifier safety), guardas `typeof X === 'function'` para helpers opcionales.
- **GitHub secret scanning:** bloquea PATs literales en commits. Siempre referenciar vía Vault.
- **PG dollar-quote vs E-string:** dollar-quote es verbatim (incluye newlines reales), E-strings interpretan `\n`. Mezclar con `||` cuando hace falta.

## Verificabilidad

Brian valora poder verificar lo que se reporta. Antes de afirmar "está hecho":
- Leer net._http_response y mostrar commit_sha
- Para validación visual: pedir screenshot o instrucciones específicas de DevTools
- No declarar "shippeado" como sinónimo de "funciona"
