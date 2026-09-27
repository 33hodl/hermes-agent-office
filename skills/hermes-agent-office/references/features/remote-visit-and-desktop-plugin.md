---
id: remote-visit-and-desktop-plugin
feature: visitor mode + Hermes Desktop pane
---
# Feature: Remote visit & desktop plugin

**Description:** Two ways to run the office outside a single browser tab:
**visitor mode** (`--visit URL`) polls another office instance's public event
stream and shows *their* agents as visitors in yours; the **desktop plugin**
docks the office as a live pane inside the Hermes Desktop app.

**How to reach:**
- visitor: `python3 -m office.server --visit https://host:8741` (client of
  `/api/events/poll?since=N`; read-only, `/api/health` reports
  `{ok: not last_error, remote, error}`).
- desktop: copy `desktop/` to `<hermes home>/desktop-plugins/hermes-office/`,
  run the server, then Command palette → *Reload desktop plugins*. The pane
  embeds `http://127.0.0.1:8741` (`--port` to move it).

**Key UI elements:** visitor agents carry `visitor: true` in their events; the
mode note names the mode.

**How to verify:** `officectl health` on the visiting server → `source.name ==
"visitor"` and `source.ok == true`; kill the remote and assert `source.error` is
reported (never a silent fake "live").

**Related features:** metrics-and-mode-signals, theme-switcher.
