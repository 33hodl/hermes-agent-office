---
id: qa-hooks
feature: agent-facing hooks and the verification contract
---
# Feature: QA hooks (the verification contract)

**Description:** The stable, agent-facing surface of the app. These are the
handles `scripts/officectl.js` drives — **treat them as API**: renaming or
removing one breaks every verification run.

**How to reach:** browser console / any Playwright context after boot.

**Hooks (do not break):**
- `window.__eng` — the `OfficeEngine`: `.agents` (Map id → agent with
  `name`, `status`, `activity`, `x`, `y`, `home`, `moving`), `.theme`
  (config incl. `agentNames`), `.renderer` (`.name`), `.scale` (world→screen),
  `.zoom` (user zoom, 0.6–2.2).
- **Agent-art contract (one of the two, or art cannot be verified):**
  photo renderers expose `.sprites` keyed by lowercase name
  (`office`, `dunder`); procedural renderers expose `.paletteNames`
  (`voxel`). A renderer with neither fails `verify` on purpose — add a hook
  rather than letting the check pass silently.
- `window.__activeTheme` — the current theme config (drives the roster cap).
- `window.__castCounter` — cast cycling on entry (reset on theme switch).
- `localStorage`: `office-theme`, `office-custom-themes`, `office-welcome-seen`,
  `office-tour-seen`.

**Server API:** `GET /api/health` (ok, version, source{name,…}),
`GET /api/state` (snapshot: agents, deliveries, metrics, lastEventId),
`GET /api/events?since=N` (SSE), `GET /api/events/poll?since=N`,
`POST /api/task {text}`, `POST /api/events/ingest`, `POST /api/demo/burst`,
`POST /api/demo/names {names[]}`, `POST /api/deliveries/read {ids[]}`,
`POST /api/art`.

**How to verify:** `node scripts/officectl.js verify [--rooms office,batman]
[--shots] [--json]` — exits 0 when every room passes, 1 on regression, 2 on a
usage/precondition problem. Assertions: ≥6 agents, **unique names** (the office
is a cast, never a crowd), everyone seated, agent art present for every agent,
active theme == requested room, zoom in range, cast ⊆ the room's `agentNames`
(parsed live from `web/app.js`, so a cast change updates the assertions).

**Related features:** every feature above. If you add a feature, add its hook
here and a row to `README.md` — that is what keeps this map from rotting.
