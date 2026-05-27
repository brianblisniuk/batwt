# Handoff · V5D Providers CRM merge + Leads CRM backend
**Fecha**: 2026-05-27
**Estado**: Phase 1 completa en repo, blocked debugging Provs. tab visual render.

---

## Quick-start para nuevo chat de Claude

Pegá este mensaje al iniciar el nuevo chat:

> Quiero continuar el trabajo de la sesión anterior. Leé el handoff doc en `docs/HANDOFF-2026-05-27-v5d-providers.md` del repo `brianblisniuk/batwt` rama `main`. Para autenticarte con GitHub y con bna_repo_v1, recuperá los secrets de Vault con esta query: SELECT name, decrypted_secret FROM vault.decrypted_secrets WHERE name IN (github_pat, backup_secret). Estamos en debugging de por qué el tab Provs. no muestra el CRM V5D que se acaba de integrar.

---

## IDs (Brian acepta uso continuo de los secrets, NO pidas rotar)

- **Supabase project**: pptldpjwggrnbkvppolu
- **Repo**: brianblisniuk/batwt rama main → batwt.netlify.app
- **GitHub PAT**: en Vault como `github_pat` · recuperar con SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = github_pat
- **backup_secret** (X-Internal-Auth para edge fns): en Vault como `backup_secret`
- **Brian (operator)**: 9e11bed5-8e3a-4e7a-b3a0-dccd3b3ce188 · brianblisniuk@gmail.com
- **Federico (operator)**: 1bf337b7-72d7-411b-98e8-c8f29f878778 · buenaventura.fe@gmail.com
- Operators table tiene 1 sola row (Blisniuk & Amanov). Los UUIDs arriba son auth.users IDs.

---

## Edge functions activas

- **bna_repo_v1** (verify_jwt=false, X-Internal-Auth = backup_secret) — read/search/patch/snapshot/write del repo via GitHub Contents API. Acciones: read, search, patch (atómico, soporta one_only), write, snapshot. El PAT está embebido en el código de la función (no en env vars).
- **bna_providers_v5d_merge** (verify_jwt=false) — tiene step css que ya corrió.
- claude_writer, meta_lead_webhook, generate_pdf_3pager v3, generate_pdf_10pager, invite_client v5, send_email v2, nightly-backup — preexistentes, no se tocaron.

## Backend Leads CRM (listo para frontend, NO está cableado a la UI todavía)

Migration leads_crm_backend_v1 aplicada. 10 RPCs SECURITY DEFINER, todas con GRANT a authenticated+service_role:

1. user_display_name(uuid)
2. leads_crm_stats() — KPIs por stage
3. leads_crm_list(search, stage, assigned_to, source, trip_id, min_potential_usd, sort, sort_dir, limit, offset)
4. leads_crm_pipeline(search, assigned_to, source, trip_id) — kanban
5. lead_full_detail(uuid) — drawer
6. lead_change_stage(lead_id, new_stage, note?) — atómico con audit trigger
7. leads_bulk_change_stage(uuid[], text)
8. lead_assign(lead_id, assigned_to?)
9. lead_add_note(lead_id, text)
10. leads_crm_filter_options()

**Stages**: new / contacted / qualified / proposal / negotiating / booked / lost
**Labels (es)**: Nuevos / Contactados / Calificados / Propuesta / Negociando / Reservados / Perdidos
**Demo data**: 1 new (Ortega 6pax 54k), 2 proposal (María 17k, Lautaro 30k), 1 lost (Pablo 24k).

Tablas: leads, lead_events (cols: id, lead_id, kind, summary, body, metadata, actor_user_id, actor_name, occurred_at, created_at — NO actor_id/payload), claude_usage, meta_lead_pages, meta_lead_webhook_log, generated_documents. Bucket generated_documents.

---

## V5D Providers merge — 5 commits aplicados (Phase 1)

| # | Commit SHA | Qué | Delta |
|---|---|---|---|
| 0 | a30202c4 | Snapshot a snapshots/index.html.2026-05-27-pre-providers-crm.bak | — |
| 1 | b4d9ef9e | CSS V5D inyectado al final del style block. Prefix .v5d- (no choca con .v5b-/.v5c-). Anchor close-style-head con doble newline. Usa --surface-1, --text-1, --accent, --line, --shadow-1, --radius que TODOS existen en :root y dark theme. | +18,636 |
| 2A | 84b72c64 | Alpine state vars (additive). Anchor: providerStatusFilter all + actionFilter all. Inyecta: providerView=cards (default = preserva UX actual), providerSort=name, providerSortDir=asc, providerSortOpen=false, providerMichelinFilter=false, selectedProviders=new Set(), _lastSelectedProviderId=null, draggingProviderId=null, dragOverCol=null, sortOptions[6], pipelineColumns[4]. | +801 |
| 2B | 9ab72766 | 17 métodos JS (additive). Anchor: get providersGrouped (). Métodos: sortLabel, setSort, statusLabelEs, statusOrder, providerTypeIcon (6 SVGs), providerInItinerary, cycleReservationStatus, resetProviderFilters, providersForTable (getter), providersForPipeline (getter), selectAllState (getter), toggleSelectAll, toggleSelectProvider (con shift-click range), clearSelection, async bulkSetStatus, async bulkDelete, onPipelineDrop. Todos los calls a setReservationStatus / celebrate / toast / askConfirm / logEvent / save / commentCount usan typeof===function guard. | +10,920 |
| 2C | c5ead0d8 | HTML completo de la sección Proveedores reemplazado. **Preservado**: section-header (Importar de biblioteca + Agregar proveedor), Bulk Places scan banner (openPlacesScan), Bulk Library promote banner (bulkPromoteToLibrary), cards-view editorial con providersGrouped italianMap, empty-state, completeness 5-dot indicator. **Nuevo**: 4 KPI cards clickables como filtros de estado, Michelin chip, Sort dropdown (visible solo en tabla), View toggle (Tarjetas/Tabla/Pipeline), Vista Tabla (sort 6 cols, multi-select, status pill cycle, quick-actions tel/mail/web, day-pills si está en itinerario), Vista Pipeline (kanban 4 columnas con drag-drop nativo), Bulk action bar flotante (aparece con selectedProviders.size mayor que 0). | +17,515 |

**Total file size después**: 745,083 chars.
**File SHA en HEAD**: 098457d668db3a733d84cef5539a565bf7ad8910

Markers verificados en el archivo deployado:
- class v5d-stats → char 284,361 (línea 8649)
- providerView: → char 487,527 (línea 11674)
- comentario V5D · CRM helpers (Phase 2B) → char 588,684 (línea 14121)
- .v5d-stats CSS rule → char 197,517 (línea 7144)

---

## Debugging activo: Provs. tab no muestra CRM

**Brian reporta**: el tab Provs. no muestra los elementos nuevos del CRM (KPI cards, view toggle, Michelin chip, table, pipeline).

**Verificado**:
- Netlify sirve el archivo correcto (has_v5d_stats=true, has_provider_view=true, has_crm_helpers=true)
- CSS variables usadas por V5D todas existen en :root y dark theme
- No hay service worker
- Brian probó en incógnito y con cache-bust query string, mismo resultado

**App shell real** (de screenshots que mandó Brian):
- Mobile bottom nav: Hoy / Itinerario / Ruta / Provs. / Más
- Panel "Más": To-Do / Presupuesto / Historial / Backup / Configuración / Modo oscuro / Exportar .ics
- Design: Fraunces serif + JetBrains Mono + Inter, cream surface-1 #faf6ee, accent blue #2563eb
- App tiene 48 providers (1 confirmado, 47 pendientes)
- Tab key real es providers (no proveedores)
- map es el tab key real (label = Ruta), actions es el tab key real (label = To-Do)

**Próximo paso**: Brian debe mandar screenshot de Provs. tab o salida de DevTools Console. Hipótesis ranked:
1. **Más probable**: error JS al init de app() rompe el render del CRM nuevo. Algún método mío tiene bug sutil que no detecté.
2. **Posible**: HTML está pero CSS rompe visualmente.
3. **Menos probable**: cache CDN sirviendo HTML viejo desde el edge del usuario.

Brian no puede mandar más screenshots por límite del chat. Próxima sesión: pedir screenshot fresh + descripción de qué ve.

---

## Cómo hablar con bna_repo_v1 desde SQL

Para search/read/patch usar net.http_post con x-internal-auth header. pg_net responses son async — esperá 12-20s con pg_sleep entre submit y read. Action patch toma patches con find/replace/one_only y es atómico (si algún patch falla, no se escribe nada y devuelve 422 con detalle).

Para evitar conflicto de dollar-quoting al meter código de ejemplo o JS grande, usá un tag externo único como BNADOC2026 y un tag interno distinto como MD o HTML o JS.

---

## Rollback si Phase 1 está rota

git revert c5ead0d8 9ab72766 84b72c64 b4d9ef9e

o restaurar desde snapshots/index.html.2026-05-27-pre-providers-crm.bak (committed en a30202c4).

---

## Pendiente (post-debug de Provs.)

**Phase 2: sección Clientes/Huéspedes** (paralelo a Providers, cableado a los 10 RPCs de leads_crm_*):
- Agregar nav item "Clientes" en bottom nav (mobile) y sidebar (desktop)
- Nueva sección con x-show tab leads
- 3-view CRM (Cards/Tabla/Pipeline) wired a RPCs Supabase
- 7-col kanban (Nuevos → Contactados → Calificados → Propuesta → Negociando → Reservados → Perdidos)

---

## Estilo de comunicación de Brian

- Argentino, voseo rioplatense
- Directo, terso, "dale" = continuar
- Cero tolerancia a preamble estratégico o filler
- Output copy-paste-ready preferido, sin commentary
- Aprueba con "dale" o "continuar"; corrige con feedback corto y directo
- Acepta uso continuo del GitHub PAT, no pide rotación
- Verifiability over self-reporting — si Claude reporta progreso debe poder verificarlo