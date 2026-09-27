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

## Verify your changes (the lever)

Drive the app through one CLI instead of writing throwaway Playwright scripts:

```bash
node scripts/officectl.js up                  # start the office, wait for health
node scripts/officectl.js verify --shots      # sweep every room, assert, exit 1 on regression
node scripts/officectl.js status --json       # agents, desks, agent art, duplicates, zoom
node scripts/officectl.js theme batman        # switch room and wait until everyone is seated
node scripts/officectl.js shot --out docs/screenshots/x.png
```

Every command takes `--json` and `--dry-run` (on anything with a side effect)
and prints a `fix:` line when it fails. Server-side commands (health/state/task/
burst/features) need no browser; browser commands need Playwright (the CLI finds
the copy that ships with Hermes, or honour `OFFICECTL_PLAYWRIGHT`).

**Feature map:** `references/features/` — one file per feature (what it does, how
to reach it, key elements, related features) plus `qa-hooks.md`, the contract the
CLI depends on (`window.__eng`, `/api/*`, the agent-art contract). Read the map
before driving the UI blind; extend it when you add a feature.

## Notes

- Zero dependencies (Python 3.10+ stdlib only; no pip installs) — including the
  control CLI, which is Node-stdlib except for the browser commands.
- Local-first: no telemetry, no cloud, no credentials in the repo.
- The dashboard never writes to Hermes state — read-only SQLite access.
- Invariants worth keeping true (asserted by `verify`, locked by `tests/`):
  one live agent per name (the office is a cast — `tests/test_demo.py`),
  every live agent has art (sprite or palette), everyone reaches a desk.
