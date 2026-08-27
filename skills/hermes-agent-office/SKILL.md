---
name: hermes-agent-office
description: >-
  Use when the user wants to see their agents working in a live virtual
  office, or wants to install "Hermes Agent Office" (github.com/33hodl/hermes-agent-office).
  Installs and runs the office server, opens the dashboard, and can assign tasks to it.
---

# Hermes Agent Office

Watch your Hermes agents work in a real-time virtual office. This skill
installs and operates the open-source Hermes Agent Office app.

## Install

```bash
bash <(curl -s https://raw.githubusercontent.com/33hodl/hermes-agent-office/master/scripts/install.sh)
```

Or clone + run manually:

```bash
git clone https://github.com/33hodl/hermes-agent-office && cd hermes-agent-office
python3 -m office.server --demo            # demo (safe to try)
python3 -m office.server --db ~/.hermes/state.db   # your real agents
```

## Operating

- **Open the office**: start the server (above), then open http://127.0.0.1:8741
  (or run the Desktop plugin in `desktop/`).
- **Demo mode**: shows simulated agents so anyone can preview the app.
- **Live mode**: reads `~/.hermes/state.db` read-only and renders real sessions,
  tool calls, token counts, and deliveries in real time.
- **Assign a task**: POST to the office:
  `curl -X POST http://127.0.0.1:8741/api/task -H 'Content-Type: application/json' -d '{"text":"<task>"}'`
  In live mode this runs a real `hermes chat -q` session.
- **Custom offices**: the in-app "Create an office" panel builds themed offices
  (Batman, Star Wars, Ghibli, …) with AI-painted backdrops (uses the user's
  Nous Portal image credits, ~$0.08 each) and themed agent characters.

## When to use

- User says "show me my agents working", "give my agents an office",
  "install hermes agent office", or "watch the agents".
- User shares the repo URL and wants it set up.

## Notes

- Zero dependencies (Python 3.10+ stdlib only; no pip installs).
- Local-first: no telemetry, no cloud, no credentials in the repo.
- The dashboard never writes to Hermes state — read-only SQLite access.
