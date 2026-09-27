---
id: theme-switcher
feature: room switcher (built-in + custom)
---
# Feature: Theme / room switcher

**Description:** Switches the office between themed "rooms". Each theme carries
its own geometry (desks, stations, plants, entrance), palette, renderer and
agent cast. Agents are renamed to the theme's cast on switch and re-homed to the
new desks.

**How to reach:** click a button in `#theme-switcher`, or
`node scripts/officectl.js theme <name>`.

**Key UI elements:** `#theme-switcher`, `.theme-btn[data-theme-name="<id>"]`,
active button carries class `active`. Custom rooms get a button appended.

**Built-in rooms and their renderers:** `office` → office renderer; `nous` →
**office renderer with a dark neon palette** (see the warning below); `dunder`
→ dunder renderer; `batman` → office renderer (dark fx, window art); `starwars`
→ voxel renderer (procedural cubes). Cast per room is `agentNames` in
`web/app.js`.

> ⚠️ **Do not "fix" the nous renderer.** `web/nous-renderer.js` (a holographic
> data-plane renderer) is *unreferenced on purpose*: commit `2cde84b` switched
> the nous theme to `renderer: 'office'` during the "office-first rendering (no
> more floating on scenery)" overhaul and kept the dark palette. `officectl
> verify` therefore reports `renderer=office` for the nous room — that is the
> expected value, not a regression. Note the README still describes nous as a
> "holographic data plane"; the shipped room is a dark office (open question for
> the owner, recorded 2026-09-27).

**Behaviour:** `applyTheme(id)` renames existing agents cyclically to the room's
cast, re-applies looks (`relookAgents`), resets `window.__castCounter`, calls
`eng.rehome()` (fresh desk assignment — desks are never double-booked), sets the
accent CSS var + brand emoji, persists `office-theme`, and in demo mode posts
the cast to `/api/demo/names` so newly entering agents use it.

**How to verify:** switch, then wait until every agent is seated; assert each
agent's name is in that room's cast (`officectl verify --rooms batman`).

**Related features:** agent-lifecycle (desk assignment), custom-office-creator,
qa-hooks.
