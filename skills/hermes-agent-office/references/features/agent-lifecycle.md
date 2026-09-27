---
id: agent-lifecycle
feature: agent entry, work, delivery, idle, departure
---
# Feature: Agent lifecycle

**Description:** Every agent is a client object in `window.__eng.agents` (a Map
by id) driven by the event feed. Statuses: `entering` → `working` → `idle` →
`leaving`; `moving` is true while walking.

**How to reach:** any event in the feed (`agent_enter`, `thinking`,
`tool_call`, `delivery`, `idle`, `agent_leave`) — demo feed, SSE from a live
`state.db`, or the in-browser demo used on static hosting.

**Key UI elements:** none directly — agents are drawn on the canvas `#stage`.
Their presence is mirrored in the roster and the metrics row.

**Behaviour worth knowing (regression-prone):**
- **Desk assignment:** each agent gets a `home` from the current theme's desks,
  cycling `_deskCounter` and skipping occupied desks; office/voxel renderers
  seat the agent *behind* the desk (up-left), other renderers stand on the spot.
- **Roster cap / eviction:** the live roster never exceeds the theme's cast size
  (so desks cannot double-book). When a new agent arrives at cap, the oldest is
  retired — **any status**, not idle-only (idle-only eviction let duplicates
  through during theme switches; fixed in commit `760acdc`).
- **Demo feed never respawns a name already in the office** (`web/demo-feed.js`),
  and since 2026-09-27 neither does the server pool: `DemoSource._new_agent`
  walks the cast from its cursor to the first *free* name and retires the oldest
  agent when every name is live. Locked by `tests/test_demo.py`.

**How to verify:** `officectl status --json` → every agent `atDesk: true`,
`missingSprites: []`, agent count ≥ 6 and ≤ cast size.

**Related features:** theme-switcher, roster, qa-hooks.
