"""Tests for the live Hermes state.db adapter (read-only, real schema)."""
import os
import sqlite3
import tempfile
import time

from office.hermes_db import HermesDBSource

SCHEMA = """
CREATE TABLE sessions (
    id TEXT PRIMARY KEY, source TEXT NOT NULL, user_id TEXT, session_key TEXT,
    chat_id TEXT, chat_type TEXT, thread_id TEXT, display_name TEXT,
    origin_json TEXT, expiry_finalized INTEGER DEFAULT 0, model TEXT,
    model_config TEXT, system_prompt TEXT, system_prompt_hash TEXT,
    parent_session_id TEXT, started_at REAL NOT NULL, ended_at REAL,
    end_reason TEXT, message_count INTEGER DEFAULT 0,
    tool_call_count INTEGER DEFAULT 0, input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0, cache_read_tokens INTEGER DEFAULT 0,
    cache_write_tokens INTEGER DEFAULT 0, reasoning_tokens INTEGER DEFAULT 0,
    cwd TEXT, git_branch TEXT, git_repo_root TEXT, billing_provider TEXT,
    billing_base_url TEXT, billing_mode TEXT, estimated_cost_usd REAL,
    actual_cost_usd REAL, cost_status TEXT, cost_source TEXT,
    pricing_version TEXT, title TEXT, title_source TEXT, last_activity_at REAL,
    last_activity_description TEXT, last_activity_provenance TEXT,
    api_call_count INTEGER DEFAULT 0, handoff_state TEXT, handoff_platform TEXT,
    handoff_error TEXT, compression_failure_cooldown_until REAL,
    compression_failure_error TEXT, compression_fallback_streak INTEGER NOT NULL DEFAULT 0,
    compression_ineffective_count INTEGER NOT NULL DEFAULT 0,
    profile_name TEXT, rewind_count INTEGER NOT NULL DEFAULT 0,
    archived INTEGER NOT NULL DEFAULT 0, pinned INTEGER NOT NULL DEFAULT 0,
    last_read_at REAL
);
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    role TEXT NOT NULL, content TEXT, tool_call_id TEXT, tool_calls TEXT,
    tool_name TEXT, effect_disposition TEXT, timestamp REAL NOT NULL,
    token_count INTEGER, finish_reason TEXT, reasoning TEXT,
    reasoning_content TEXT, reasoning_details TEXT, codex_reasoning_items TEXT,
    codex_message_items TEXT, platform_message_id TEXT, observed INTEGER DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1, compacted INTEGER NOT NULL DEFAULT 0,
    api_content TEXT, display_kind TEXT, display_metadata TEXT
);
"""


def make_db(path):
    import json as _json
    conn = sqlite3.connect(path)
    conn.executescript(SCHEMA)
    tool_calls = _json.dumps([{"function": {"name": "web_search", "arguments": "{}"}}])
    conn.execute(
        "INSERT INTO sessions (id, source, display_name, model, started_at, title) "
        "VALUES ('s1', 'telegram', 'Nova', 'deepseek/deepseek-v4-flash-0731', 1.0, 'Office test')")
    conn.execute(
        "INSERT INTO messages (session_id, role, content, timestamp, active) "
        "VALUES ('s1', 'user', 'Find flights to Tokyo', 2.0, 1)")
    conn.execute(
        "INSERT INTO messages (session_id, role, content, tool_calls, tool_name, timestamp, active) "
        "VALUES ('s1', 'assistant', NULL, ?, 'web_search', 3.0, 1)", (tool_calls,))
    conn.execute(
        "INSERT INTO messages (session_id, role, content, tool_name, timestamp, active) "
        "VALUES ('s1', 'tool', '{\"results\": []}', 'web_search', 4.0, 1)")
    conn.execute(
        "INSERT INTO messages (session_id, role, content, timestamp, active) "
        "VALUES ('s1', 'assistant', 'Found flights: $400 round trip.', 5.0, 1)")
    conn.commit()
    conn.close()


def test_pipeline_from_real_schema():
    with tempfile.TemporaryDirectory() as td:
        db = os.path.join(td, "state.db")
        make_db(db)
        src = HermesDBSource(db_path=db, poll_interval=0.1)
        src.start()
        src.wait_ready(5)
        time.sleep(0.8)
        src.stop()
        evs = src.events_after(0)
        types = [e["type"] for e in evs]
        assert types[0] == "agent_enter"
        assert "tool_call" in types
        assert "delivery" in types
        tool_ev = next(e for e in evs if e["type"] == "tool_call")
        assert tool_ev["tool"] == "web_search"
        assert all(e["agent"] == "Nova" for e in evs)


def test_readonly_open_fails_on_write():
    with tempfile.TemporaryDirectory() as td:
        db = os.path.join(td, "state.db")
        make_db(db)
        conn = sqlite3.connect(f"file:{db}?mode=ro", uri=True)
        try:
            conn.execute("DELETE FROM messages")
            raise AssertionError("write should have failed on read-only db")
        except sqlite3.OperationalError:
            pass
        finally:
            conn.close()
