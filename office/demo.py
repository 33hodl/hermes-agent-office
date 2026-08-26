"""Demo event source — a scripted, zero-setup office day.

Works with `--demo` (the default). Emits the same normalized event stream as
the live Hermes adapter so the office renders identically either way.
"""

from __future__ import annotations

import random
import threading
import time
from typing import Any, Dict, Iterator, List, Optional

from .events import STEPS, TOOL_LABELS

AGENT_NAMES = [
    "Aria", "Bento", "Coco", "Dash", "Echo", "Fig", "Gizmo", "Hazel",
    "Ivo", "Juno", "Kip", "Lumen", "Miso", "Nova", "Olive", "Pixel",
    "Quill", "Rune", "Sage", "Taro", "Uma", "Vega", "Wren", "Xyla",
    "Yara", "Zeke",
]

DEMO_ROLES = ["telegram", "discord", "cron", "desktop", "cli", "whatsapp"]

DEMO_TASKS = [
    ("Find the cheapest verified flights to Tokyo next month", ["web_search", "web_extract", "web_search"]),
    ("Draft the weekly sales summary from the CSV", ["read_file", "execute_code", "write_file"]),
    ("Research competitors' pricing pages", ["web_search", "web_extract", "web_extract"]),
    ("Fix the flaky login test", ["read_file", "terminal", "patch", "terminal"]),
    ("Summarize yesterday's session into a briefing", ["session_search", "write_file"]),
    ("Monitor the Stripe balance and alert if low", ["terminal", "execute_code"]),
    ("Turn the meeting notes into action items", ["read_file", "write_file"]),
    ("Check the deployment health endpoint", ["terminal", "web_extract"]),
    ("Back up the knowledge base to git", ["terminal", "terminal"]),
    ("Find tweets about Hermes Agent and draft replies", ["x_search", "x_search", "write_file"]),
]

IDLE_LINES = [
    "Waiting at desk for your next prompt",
    "Filing yesterday's notes",
    "Sharpening its pencils",
    "Reading the company newsletter",
    "Getting a coffee",
    "Talking shop by the water cooler",
]


class DemoSource:
    """Generates a lively office day on a loop, deterministically when seeded."""

    name = "demo"

    def __init__(self, seed: Optional[int] = None, interval: float = 0.35):
        self.seed = seed
        self.interval = interval
        self._rng = random.Random(seed)
        self._name_pool: List[str] = []
        self._name_pool_i = 0
        self._stop = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._events: List[Dict[str, Any]] = []
        self._lock = threading.Lock()
        self._next_id = 1
        self._agent_state: Dict[str, Dict[str, Any]] = {}

    # -- lifecycle -----------------------------------------------------------

    def start(self):
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self):
        self._stop.set()

    # -- public API -----------------------------------------------------------

    def events_after(self, since_id: int) -> List[Dict[str, Any]]:
        with self._lock:
            return [e for e in self._events if e["id"] > since_id]

    def latest_id(self) -> int:
        with self._lock:
            return self._events[-1]["id"] if self._events else 0

    def wait_ready(self, timeout: float = 10.0) -> bool:
        t0 = time.time()
        while time.time() - t0 < timeout:
            with self._lock:
                if self._events:
                    return True
            time.sleep(0.1)
        return False

    # -- internals -------------------------------------------------------------

    def _emit(self, **fields) -> Dict[str, Any]:
        ev = {"id": self._next_id, "ts": time.time()}
        self._next_id += 1
        ev.update(fields)
        with self._lock:
            self._events.append(ev)
        return ev

    def _tokens(self, n_in: int, n_out: int) -> Dict[str, int]:
        return {"input": n_in, "output": n_out}

    def set_name_pool(self, names: List[str]) -> None:
        self._name_pool = [n for n in names if n]
        # evict current agents so fresh ones spawn with the new names
        for name in list(self._agent_state.keys()):
            self._emit(type="agent_leave", agent=name,
                       session=self._agent_state[name].get("session", ""),
                       role=self._agent_state[name].get("role", ""),
                       text="Reassigned to a new role")
        self._agent_state.clear()

    def _new_agent(self) -> str:
        if self._name_pool:
            name = self._name_pool[self._name_pool_i % len(self._name_pool)]
            self._name_pool_i += 1
        else:
            name = self._rng.choice(AGENT_NAMES)
        role = self._rng.choice(DEMO_ROLES)
        session = f"demo-{name.lower()}-{self._rng.randint(100, 999)}"
        self._agent_state[name] = {"role": role, "session": session,
                                   "task": "", "tools": []}
        self._emit(type="agent_enter", agent=name, role=role, session=session,
                   model="deepseek/deepseek-v4-flash-0731")
        return name

    def _run(self):
        # opening scene: a few agents stroll in
        opening = ["Aria", "Bento", "Coco", "Dash"]
        for name in opening:
            self._new_agent()
            time.sleep(self.interval * 2)
        time.sleep(self.interval * 4)

        while not self._stop.is_set():
            # spawn a new agent occasionally
            if self._rng.random() < 0.12 and len(self._agent_state) < 8:
                self._new_agent()
                time.sleep(self.interval * 2)
            if not self._agent_state:
                # everyone left (name pool swap) — refill with new names
                for _ in range(4):
                    self._new_agent()
                    time.sleep(self.interval * 2)
                continue

            name = self._rng.choice(list(self._agent_state.keys()))
            st = self._agent_state[name]

            # idle wander sometimes
            if self._rng.random() < 0.25:
                self._emit(type="idle", agent=name, session=st["session"], text=self._rng.choice(IDLE_LINES))
                time.sleep(self.interval * self._rng.randint(4, 10))
                continue

            task, tools = self._rng.choice(DEMO_TASKS)
            st["task"] = task
            st["tools"] = list(dict.fromkeys(st["tools"] + tools))
            self._emit(type="thinking", agent=name, session=st["session"], text="Understanding the request…", task=task)
            time.sleep(self.interval * self._rng.randint(2, 4))
            self._emit(type="thinking", agent=name, session=st["session"], text="Planning the approach…")
            time.sleep(self.interval * self._rng.randint(2, 4))

            for tool in tools:
                self._emit(type="tool_call", agent=name, session=st["session"], tool=tool, task=task,
                           tokens=self._tokens(self._rng.randint(200, 2400),
                                               self._rng.randint(120, 1500)))
                time.sleep(self.interval * self._rng.randint(3, 8))
                if self._rng.random() < 0.5:
                    self._emit(type="status", agent=name, session=st["session"],
                               text=f"Got results from {tool} — working through them",
                               task=task)
                    time.sleep(self.interval * self._rng.randint(2, 5))

            self._emit(type="thinking", agent=name, session=st["session"], text="Writing up the deliverable…")
            time.sleep(self.interval * self._rng.randint(2, 4))

            outcome = self._rng.choice([
                f"Done — {task.lower()}. Full write-up in the delivery.",
                f"{task} complete. Key findings and next steps in the mail.",
                f"Finished {task.lower()}. See the summary in your mailbox.",
            ])
            self._emit(type="delivery", agent=name, session=st["session"], title=task,
                       content=f"{outcome}\n\n— {name} ({st['role']} agent)",
                       task=task,
                       tokens=self._tokens(self._rng.randint(300, 2600),
                                           self._rng.randint(400, 3200)))
            time.sleep(self.interval * self._rng.randint(6, 12))
            self._emit(type="idle", agent=name, session=st["session"], text=self._rng.choice(IDLE_LINES))
            time.sleep(self.interval * self._rng.randint(3, 6))
