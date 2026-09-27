---
id: zoom
feature: camera zoom
---
# Feature: Zoom controls

**Description:** Zoom the canvas camera in/out or reset to 1.0.

**How to reach:** `#zoom-in`, `#zoom-out`, `#zoom-reset` in the top bar; the
engine also exposes `eng.zoomIn()`, `eng.zoomOut()`, `eng.resetZoom()`.

**Key UI elements:** `#zoom-in`, `#zoom-out`, `#zoom-reset`, container
`.zoom-controls`.

**Behaviour:** zoom is clamped to **0.6–2.2**; `eng.zoom` follows
`eng.zoomTarget` and calls `renderer.resize()` so the pre-rendered static layer
is re-scaled (not stretched). `officectl verify` asserts zoom stays in range —
a stuck or runaway zoom is a real regression that screenshots alone miss.

**How to verify:** `officectl status --json` → `zoom`.

**Related features:** qa-hooks (`eng.scale` vs `eng.zoom`).
