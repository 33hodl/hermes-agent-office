# Integrating Hermes Agent Office with hermes-agent

This document is the adoption path for adding the office to the official
`NousResearch/hermes-agent` repository — or for any user who wants to hook
their own Hermes gateway into it.

## Option A — Gateway event hook (recommended, ~30 lines)

The office is a pure consumer of a normalized event stream. The cleanest
integration is a small hook on the gateway that forwards real agent activity
to the office's HTTP endpoint as it happens.

Paste this into your Hermes gateway config (or as a tiny plugin):

```python
# gateway → office forwarder (add to hermes-agent gateway plugins/)
import json, threading, urllib.request

OFFICE_URL = "http://127.0.0.1:8741"   # where the office server runs

def _post(event: dict) -> None:
    try:
        req = urllib.request.Request(
            OFFICE_URL + "/api/events/ingest",
            data=json.dumps(event).encode(),
            headers={"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req, timeout=3)
    except Exception:
        pass  # office offline — never block the gateway

def on_agent_event(ev: dict) -> None:
    """Hook point: called on every gateway agent event (tool calls,
    session updates, deliveries). Map to office events:"""
    mapping = {
        "tool_call": {"type": "tool_call", "tool": ev.get("tool")},
        "session_update": {"type": "status", "text": ev.get("text")},
    }
    office_ev = mapping.get(ev.get("type"))
    if not office_ev:
        return
    office_ev.update({
        "agent": ev.get("agent") or ev.get("session_id", "agent"),
        "session": ev.get("session_id", ""),
        "role": ev.get("role", "telegram"),
        "task": ev.get("task", ""),
        "tokens": ev.get("tokens") or {},
    })
    threading.Thread(target=_post, args=(office_ev,), daemon=True).start()
```

The office exposes `/api/events/ingest` (POST, accepts the normalized event
schema; see `office/events.py`) so any external producer — the gateway, a
plugin, a CI pipeline — can feed it.

## Option B — Ship as a bundled add-on

Structure that maps naturally onto the official repo:

```
hermes-agent/
  office/            ← the office package (server + sources)
  web/               ← the dashboard (static, zero deps)
  desktop/plugins/office/   ← the Desktop pane plugin
```

The dashboard is dependency-free (Python stdlib + vanilla JS), so it can be
sold as `pip install hermes-agent[office]` with zero new runtime deps.

## Option C — Docs/catalog mention

At minimum, a catalog entry in the official docs ("Community: watch your
agents work — Hermes Agent Office") pointing at
`github.com/33hodl/hermes-agent-office` with the two-command quickstart.

## Install for users (without touching hermes-agent)

```bash
bash <(curl -s https://raw.githubusercontent.com/33hodl/hermes-agent-office/master/scripts/install.sh)
```

or, inside any Hermes session: paste the repo URL and say "install this" —
a bundled skill (`skills/hermes-agent-office/SKILL.md`) walks the agent
through clone → run → open.

## What the office needs from a host

- Python 3.10+ (stdlib only — no pip deps)
- Read access to the Hermes `state.db` (or a forwarded event stream)
- One open localhost port (default 8741)
- Zero telemetry, zero cloud, zero credentials — safe to ship by default
