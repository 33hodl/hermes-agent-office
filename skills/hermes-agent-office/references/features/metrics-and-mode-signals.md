---
id: metrics-and-signals
feature: metrics row, LIVE dot, source badge, mode note
---
# Feature: Metrics & mode signals

**Description:** The top strip shows live counters (working agents, tokens in /
out, deliveries) and the mode: a `LIVE` dot when the event stream is connected,
`demo · in-browser` when running the client-side demo feed, and a source badge
naming the data source.

**How to reach:** always visible: `#metrics`, `#live-dot`, `#live-label`,
`#source-badge`, `#mode-note`, `#brand-mark`, version badge `.ver-badge`.

**Key UI elements:** `.metric` / `.metric-value` / `.metric-label`
(ids `#m-working`, `#m-input`, `#m-output`, `#m-deliveries`).

**Behaviour:** the dot is *computed* from the stream state (`live` /
`reconnecting…`) — never hardcoded "LIVE" (GROKSTREET law: computed LIVE dot,
honest scoreboard). Token totals sum event token counts. `mode-note` explains
demo vs live vs visitor mode. The version badge is injected at boot so a user
can confirm they are on the latest build.

**How to verify:** `officectl status --json` returns `modeLabel` and
`rosterCount`; `officectl health` returns `source.name` + `version`. Assert the
dot label matches the actual stream state.

**Related features:** live mode, task-bar, welcome-and-tour.
