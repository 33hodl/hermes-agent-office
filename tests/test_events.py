"""Tests for the office event store (no external deps)."""
from office.events import OfficeStore, tool_label


def test_agent_identity_stable():
    s = OfficeStore()
    for i in range(20):
        s.apply({"type": "status", "agent": "Uma", "session": "demo-uma", "text": f"t{i}"})
    assert len(s.agents) == 1


def test_delivery_ordering_and_read_flag():
    s = OfficeStore()
    s.apply({"type": "agent_enter", "agent": "A", "session": "s1"})
    s.apply({"type": "delivery", "agent": "A", "session": "s1", "title": "one", "content": "x"})
    s.apply({"type": "delivery", "agent": "A", "session": "s1", "title": "two", "content": "y"})
    assert len(s.deliveries) == 2
    assert s.deliveries[0]["title"] == "two"  # newest first
    assert all(not d["read"] for d in s.deliveries)


def test_token_accumulation():
    s = OfficeStore()
    s.apply({"type": "tool_call", "agent": "A", "session": "s1", "tool": "web_search",
             "tokens": {"input": 100, "output": 50}})
    s.apply({"type": "delivery", "agent": "A", "session": "s1", "title": "t", "content": "c",
             "tokens": {"input": 200, "output": 300}})
    snap = s.snapshot()
    assert snap["stats"]["input_tokens"] == 300
    assert snap["stats"]["output_tokens"] == 350


def test_tool_labels():
    assert tool_label("web_search") == "searching the web"
    assert tool_label("nonsense_tool") == "using nonsense_tool"


def test_steps_progress_on_task():
    s = OfficeStore()
    s.apply({"type": "tool_call", "agent": "A", "session": "s1", "tool": "terminal", "task": "fix"})
    a = list(s.agents.values())[0]
    assert a.task == "fix"
    assert a.steps[0]["done"] is True
    assert a.steps[1]["done"] is False
