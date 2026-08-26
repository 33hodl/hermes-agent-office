"""Event schema and agent-state store shared by all event sources.

The office runs on a single normalized event stream. Every source (demo
generator or the live Hermes state.db watcher) emits the same event shape,
and the store derives the agent roster / deliveries / stats from it.
"""

from __future__ import annotations

import itertools
import json
import time
from typing import Any, Dict, List, Optional

# Event types ---------------------------------------------------------------

EVENT_TYPES = {
    "agent_enter",   # a Hermes session/agent walked into the office
    "agent_leave",   # session ended / agent left
    "thinking",      # agent is thinking (reasoning step)
    "tool_call",     # agent called a tool
    "status",        # generic status update
    "idle",          # agent went idle
    "delivery",      # agent dropped completed work in the mailbox
}

STEPS = ["Understand the request", "Plan the approach", "Gather context",
         "Execute the work", "Deliver"]

TOOL_LABELS = {
    "web_search": "searching the web",
    "web_extract": "reading a web page",
    "browser": "driving a browser",
    "terminal": "running terminal commands",
    "read_file": "reading files",
    "write_file": "writing files",
    "patch": "editing files",
    "search_files": "searching files",
    "execute_code": "running code",
    "delegate_task": "delegating to a subagent",
    "vision_analyze": "analyzing an image",
    "text_to_speech": "speaking",
    "memory": "remembering",
    "skill_view": "consulting a skill",
    "cronjob": "scheduling",
    "session_search": "recalling a past session",
}


def tool_label(tool: str) -> str:
    if not tool:
        return "using a tool"
    return TOOL_LABELS.get(tool, f"using {tool}")


def _clean_excerpt(text: str, limit: int = 160) -> str:
    if not text:
        return ""
    text = text.replace("\r", " ").replace("\n", " ").strip()
    if len(text) > limit:
        return text[: limit - 1] + "…"
    return text


# Agent store ---------------------------------------------------------------

class AgentState:
    """Mutable per-agent state derived from events (server-side truth)."""

    def __init__(self, agent_id: str, name: str, role: str = "", model: str = "",
                 color: str = "", session: str = ""):
        self.id = agent_id
        self.name = name
        self.role = role            # session source: telegram/discord/cron/desktop/cli
        self.model = model
        self.color = color or "#e8a48f"
        self.session = session
        self.status = "entering"    # entering|thinking|working|tool|delivering|idle
        self.activity = "Arriving at the office"
        self.task = ""
        self.steps: List[Dict[str, Any]] = []
        self.tokens = {"input": 0, "output": 0, "reasoning": 0}
        self.tools: List[str] = []
        self.entered_at = time.time()
        self.last_active = time.time()
        self.last_message = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "role": self.role,
            "model": self.model,
            "color": self.color,
            "session": self.session,
            "status": self.status,
            "activity": self.activity,
            "task": self.task,
            "steps": self.steps,
            "tokens": self.tokens,
            "tools": self.tools,
            "entered_at": self.entered_at,
            "last_active": self.last_active,
        }


class OfficeStore:
    """Derives roster + deliveries + stats from the event stream."""

    def __init__(self, max_deliveries: int = 200):
        self.agents: Dict[str, AgentState] = {}
        self.deliveries: List[Dict[str, Any]] = []
        self._max_deliveries = max_deliveries
        self._next_agent_id = itertools.count(1)
        self.stats = {"input_tokens": 0, "output_tokens": 0, "deliveries": 0}

    # -- agent helpers ------------------------------------------------------

    def _agent_id_for(self, session: str) -> str:
        if session:
            return f"session-{session}"
        return f"agent-{next(self._next_agent_id)}"

    def ensure_agent(self, name: str, session: str = "", role: str = "",
                     model: str = "") -> AgentState:
        aid = self._agent_id_for(session) if session else f"named-{name}"
        if aid not in self.agents:
            self.agents[aid] = AgentState(
                aid, name, role=role, model=model, session=session)
        return self.agents[aid]

    # -- event application ---------------------------------------------------

    def apply(self, ev: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Apply one event; returns the enriched event (or None to skip)."""
        etype = ev.get("type")
        agent = self.ensure_agent(
            ev.get("agent", "Agent"),
            session=ev.get("session", ""),
            role=ev.get("role", ""),
            model=ev.get("model", ""),
        )
        agent.last_active = ev.get("ts", time.time())
        now = agent.last_active

        if etype == "agent_enter":
            agent.status = "entering"
            agent.activity = "Arriving at the office"
        elif etype == "agent_leave":
            agent.status = "idle"
            agent.activity = "Left for the day"
        elif etype == "thinking":
            agent.status = "thinking"
            agent.activity = _clean_excerpt(ev.get("text") or "Thinking…", 80)
        elif etype == "tool_call":
            tool = ev.get("tool", "")
            agent.status = "tool"
            agent.activity = tool_label(tool)
            if tool and tool not in agent.tools:
                agent.tools.append(tool)
            if ev.get("task") and agent.task != ev.get("task"):
                agent.task = ev.get("task")
                agent.steps = [
                    {"label": s, "done": i == 0}
                    for i, s in enumerate(STEPS)
                ]
        elif etype == "status":
            agent.status = "working"
            agent.activity = _clean_excerpt(ev.get("text") or "Working…", 80)
        elif etype == "delivery":
            agent.status = "delivering"
            agent.activity = "Delivering work to the mailbox"
            delivery = {
                "id": ev.get("id", f"d{len(self.deliveries) + 1}"),
                "agent": agent.name,
                "agent_id": agent.id,
                "color": agent.color,
                "title": _clean_excerpt(ev.get("title") or agent.task or "Deliverable", 90),
                "content": _clean_excerpt(ev.get("content") or agent.last_message or "", 2000),
                "ts": now,
                "read": False,
            }
            self.deliveries.insert(0, delivery)
            self.deliveries = self.deliveries[: self._max_deliveries]
            self.stats["deliveries"] += 1
        elif etype == "idle":
            agent.status = "idle"
            agent.activity = _clean_excerpt(ev.get("text") or "Waiting at desk for your next prompt", 80)

        # token bookkeeping
        toks = ev.get("tokens") or {}
        for k in ("input", "output", "reasoning"):
            v = toks.get(k, 0)
            if v:
                agent.tokens[k] = agent.tokens.get(k, 0) + v
                self.stats[f"{k}_tokens"] = self.stats.get(f"{k}_tokens", 0) + v

        if etype == "delivery":
            # delivery event drives a per-agent step completion too
            if agent.steps and not all(s["done"] for s in agent.steps):
                agent.steps = [dict(s, done=True) for s in agent.steps]

        ev["agent_id"] = agent.id
        ev["role"] = agent.role
        return ev

    def snapshot(self) -> Dict[str, Any]:
        return {
            "agents": [a.to_dict() for a in self.agents.values()],
            "deliveries": self.deliveries,
            "stats": self.stats,
            "now": time.time(),
        }
