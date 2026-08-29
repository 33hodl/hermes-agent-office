"""Real Hermes activity source — watches the Hermes session store (state.db).

Hermes persists every session and message in a SQLite database (normally
`~/.hermes/state.db`). We open it READ-ONLY and poll for new messages. This
is safe against a running Hermes: SQLite allows concurrent readers (WAL or
rollback journal), we never write, and we only issue simple indexed queries.

Mapping: sessions -> agents, messages -> office events.
"""

from __future__ import annotations

import json
import os
import sqlite3
import threading
import time
from typing import Any, Dict, List, Optional

from .events import tool_label

# messages we ship verbatim into the office; oversized tool payloads are capped
MAX_TOOL_CALLS = 8
MAX_CONTENT = 4000

ROLE_LABELS = {
    "telegram": "Telegram", "discord": "Discord", "slack": "Slack",
    "whatsapp": "WhatsApp", "signal": "Signal", "email": "Email",
    "matrix": "Matrix", "cron": "Cron", "cli": "CLI", "desktop": "Desktop",
    "api": "API", "webhook": "Webhook", "feishu": "Feishu",
    "wechat": "WeChat", "sms": "SMS", "bot-chat": "Bot Chat",
    "unknown": "Agent",
}


def default_db_path() -> str:
    home = os.environ.get("HERMES_HOME") or os.path.expanduser("~/.hermes")
    return os.path.join(home, "state.db")


def _role_label(source: str) -> str:
    return ROLE_LABELS.get((source or "unknown").lower(), (source or "Agent").title())


class HermesDBSource:
    """Polls the Hermes state.db and emits normalized office events."""

    name = "hermes"

    def __init__(self, db_path: Optional[str] = None, poll_interval: float = 1.0):
        self.db_path = db_path or default_db_path()
        self.poll_interval = poll_interval
        self._events: List[Dict[str, Any]] = []
        self._lock = threading.Lock()
        self._next_id = 1
        self._last_msg_id = 0
        self._stop = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._session_meta: Dict[str, Dict[str, Any]] = {}
        self._session_last_event: Dict[str, float] = {}
        self._known_sessions: set = set()

    # -- lifecycle -----------------------------------------------------------

    def start(self):
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self):
        self._stop.set()

    def health(self) -> Dict[str, Any]:
        ok = os.path.exists(self.db_path)
        return {
            "ok": ok,
            "db": self.db_path,
            "exists": ok,
            "poll_interval": self.poll_interval,
            "last_message_id": self._last_msg_id,
            "events": len(self._events),
        }

    # -- public API -----------------------------------------------------------

    def events_after(self, since_id: int) -> List[Dict[str, Any]]:
        with self._lock:
            return [e for e in self._events if e["id"] > since_id]

    def latest_id(self) -> int:
        with self._lock:
            return self._events[-1]["id"] if self._events else 0

    def wait_ready(self, timeout: float = 15.0) -> bool:
        t0 = time.time()
        while time.time() - t0 < timeout:
            if self.health()["exists"]:
                return True
            time.sleep(0.2)
        return False

    # -- internals -------------------------------------------------------------

    def _emit(self, **fields) -> None:
        ev = {"id": self._next_id, "ts": time.time()}
        self._next_id += 1
        ev.update(fields)
        with self._lock:
            self._events.append(ev)

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(f"file:{self.db_path}?mode=ro", uri=True)
        conn.execute("PRAGMA query_only = ON")
        return conn

    def _run(self) -> None:
        if not os.path.exists(self.db_path):
            self._emit(type="status", agent="Hermes",
                       text=f"No Hermes state.db found at {self.db_path} — is Hermes installed?")
            return
        while not self._stop.is_set():
            try:
                self._poll()
            except sqlite3.Error as exc:
                self._emit(type="status", agent="Hermes",
                           text=f"Could not read session store: {exc}")
            except Exception as exc:  # never kill the poller
                self._emit(type="status", agent="Hermes", text=f"Watcher error: {exc}")
            self._stop.wait(self.poll_interval)

    def _poll(self) -> None:
        conn = self._connect()
        try:
            cur = conn.cursor()
            cur.execute(
                """SELECT m.id, m.session_id, m.role, m.content, m.tool_calls,
                          m.tool_name, m.timestamp, m.reasoning_content,
                          s.source, s.display_name, s.model, s.title,
                          s.started_at, s.end_reason, s.message_count,
                          s.input_tokens, s.output_tokens
                   FROM messages m
                   JOIN sessions s ON s.id = m.session_id
                   WHERE m.id > ? AND m.active = 1
                   ORDER BY m.id ASC
                   LIMIT 400""",
                (self._last_msg_id,),
            )
            rows = cur.fetchall()
            for row in rows:
                self._handle_row(row)
            if rows:
                self._last_msg_id = rows[-1][0]
            self._emit_idles_for_stale_sessions()
        finally:
            conn.close()

    def _session_info(self, session_id: str, source: str, display_name: str,
                      model: str, title: str) -> Dict[str, Any]:
        if session_id not in self._session_meta:
            self._session_meta[session_id] = {
                "source": source or "unknown",
                "display_name": display_name or "",
                "model": model or "",
                "title": title or "",
                "tokens": {"input": 0, "output": 0},
            }
        return self._session_meta[session_id]

    def _token_delta(self, info: Dict[str, Any], row) -> Dict[str, int]:
        """Return token counts not yet emitted for this session, then mark them."""
        # SELECT order: ..., message_count(14), input_tokens(15), output_tokens(16)
        try:
            total_in = row[15] or 0
            total_out = row[16] or 0
        except Exception:
            return {}
        prev = info["tokens"]
        if total_in <= prev["input"] and total_out <= prev["output"]:
            return {}
        delta = {
            "input": max(0, total_in - prev["input"]),
            "output": max(0, total_out - prev["output"]),
        }
        prev["input"] = total_in
        prev["output"] = total_out
        return delta

    def _agent_name(self, session_id: str, info: Dict[str, Any]) -> str:
        return info["display_name"] or info["title"] or _role_label(info["source"])

    def _handle_row(self, row) -> None:
        (msg_id, session_id, role, content, tool_calls, tool_name,
         timestamp, reasoning, source, display_name, model, title,
         started_at, end_reason, message_count, in_tok, out_tok) = row

        info = self._session_info(session_id, source, display_name, model, title)
        toks = self._token_delta(info, row)
        name = self._agent_name(session_id, info)
        role_label = _role_label(info["source"])

        if session_id not in self._known_sessions:
            self._known_sessions.add(session_id)
            self._emit(type="agent_enter", agent=name, session=session_id,
                       role=role_label, model=info["model"] or "hermes")

        # user message = a new task arrives
        if role == "user" and content:
            excerpt = content.strip().replace("\n", " ")[:140]
            self._emit(type="status", agent=name, session=session_id,
                       role=role_label, text=f"New task: {excerpt}",
                       task=excerpt, tokens=toks)

        # assistant message with tool calls = agent at the tools station
        elif role == "assistant" and tool_calls:
            try:
                calls = json.loads(tool_calls) if isinstance(tool_calls, str) else tool_calls
            except (json.JSONDecodeError, TypeError):
                calls = []
            if isinstance(calls, dict):
                calls = [calls]
            for call in calls[:MAX_TOOL_CALLS]:
                tname = (call.get("function", {}).get("name") or
                         call.get("name") or tool_name or "tool")
                args = call.get("function", {}).get("arguments") or call.get("arguments") or ""
                if isinstance(args, str):
                    args = args[:160]
                self._emit(type="tool_call", agent=name, session=session_id,
                           role=role_label, tool=tname,
                           text=f"{tool_label(tname)}", args=str(args)[:160],
                           tokens=toks)

        # tool result row
        elif role == "tool":
            snippet = (content or "").strip().replace("\n", " ")[:110]
            self._emit(type="status", agent=name, session=session_id,
                       role=role_label,
                       text=f"Reviewing {tool_name or 'tool'} output"
                            + (f": {snippet}" if snippet else ""))

        # assistant final text = the deliverable
        elif role == "assistant" and content:
            snippet = content.strip().replace("\n", " ")[:140]
            self._emit(type="delivery", agent=name, session=session_id,
                       role=role_label, title=(info["title"] or "Deliverable"),
                       content=content[:MAX_CONTENT],
                       text=snippet or "Delivered a response",
                       tokens=toks)

        # session ended -> agent heads home
        if end_reason:
            self._emit(type="agent_leave", agent=name, session=session_id,
                       role=role_label, text=f"Session ended ({end_reason})")

        self._session_last_event[session_id] = timestamp or time.time()

    def _emit_idles_for_stale_sessions(self) -> None:
        """Agents that haven't produced a message in a while sit at their desk."""
        now = time.time()
        for session_id, last in list(self._session_last_event.items()):
            if now - last > 45 and session_id in self._known_sessions:
                info = self._session_meta.get(session_id, {})
                name = self._agent_name(session_id, info)
                self._emit(type="idle", agent=name, session=session_id,
                           role=_role_label(info.get("source", "unknown")),
                           text="Waiting at desk for your next prompt")
                self._session_last_event.pop(session_id, None)
