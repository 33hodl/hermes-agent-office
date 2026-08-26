# Hermes Desktop plugin

Docks Hermes Agent Office as a live pane in the Hermes Desktop app.

## Install

1. Copy this folder to `<hermes home>/desktop-plugins/hermes-office/`
   (`~/.hermes` by default, or `~/.hermes/profiles/<name>` for a named profile).
2. Start the office server:
   ```bash
   python3 -m office.server --db ~/.hermes/state.db
   ```
3. In the app, open the command palette (⌘K / Ctrl+K) → **Reload desktop plugins**.
4. The pane appears — drag it anywhere.

## Notes

- The pane embeds the office via `http://127.0.0.1:8741` — the server must be
  running. Point it anywhere with `--port`.
- If the pane doesn't appear, check Settings → Plugins (it should be enabled).
