---
id: welcome-and-tour
feature: first-run welcome card + guided tour
---
# Feature: Welcome & guided tour

**Description:** On a first visit the office shows a welcome card ("👋 Welcome to
Hermes Agent Office") offering *▶ Run a sample task* or *Just watch*, then a
shaded guided tour that points at the stage, roster, task bar and mailbox.

**How to reach:** Fresh profile (no `localStorage`) → open `/`. Two flags:
`office-welcome-seen`, `office-tour-seen`.

**Key UI elements:** `#welcome`, `#welcome-close`, `#welcome-demo`,
`#tour`, `#tour-title`, `#tour-text`, `#tour-next`, `#tour-prev`,
`#tour-skip`, `.tour-shade`.

**Behaviour:** `#welcome-demo` runs a sample task, then starts the tour;
`#welcome-close` starts the tour directly; the tour auto-advances on
`#tour-next` and stops at `#tour-skip`. Both set their `localStorage` flag, so
they never reappear.

**How to drive it (agent):** the CLI clears both flags, reloads and hides the
card before interacting (`officectl open|status|verify`), so overlays never
block a verification run. To *test* first-run behaviour, load the page with a
clean profile and do not let the CLI pre-set the flags.

**Related features:** theme-switcher, task-bar, qa-hooks.
