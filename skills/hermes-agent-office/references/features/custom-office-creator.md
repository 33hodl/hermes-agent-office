---
id: custom-office-creator
feature: "✨ Create an office" (custom themed offices)
---
# Feature: Custom office creator

**Description:** Builds a themed office from any franchise (Batman, Star Wars,
Ghibli, …): AI-painted backdrop + window art + themed cast and palettes.
Generation uses the user's Nous Portal image credits (~$0.08 per office).

**How to reach:** the `#creator-root` panel (open from the welcome hint /
create button) → pick a franchise or type names → build. Rendered by
`web/creator.js` + `web/creator-html.js`; art comes from `POST /api/art`
(`office/art.py`), and the finished theme is registered via `applyCustomTheme`
and persisted in `localStorage['office-custom-themes']` (survives reload via
`restoreCustomThemes()`).

**Key UI elements:** `#creator-root`, `#creator-names`, `.creator-build`,
`.creator-ghost` (ghost/style variants).

**Agent-side rule:** this is the only feature that **spends money** — never
trigger a build during verification. Use the built-in rooms for `verify`; test
the creator with an explicit user request only.

**How to verify:** existing custom themes appear as extra `.theme-btn` buttons
after reload (their `data-theme-name` starts with `custom-`); `officectl themes`
lists them. Art endpoint health: `POST /api/art` with `--dry-run` first.

**Related features:** theme-switcher, immutable art assets under `web/assets/`.
