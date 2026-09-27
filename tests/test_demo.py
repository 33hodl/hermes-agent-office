"""Regression tests for the demo source's cast.

A duplicate display name is not cosmetic: the client keys sprites, desks and
the roster by name, so a second live "Uma" means one sprite, one desk claim and
a roster that lies. This class of bug was fixed twice client-side (theme-switch
duplicates, then idle-only eviction) and once in the server pool
(`DemoSource._new_agent`) — these tests keep it fixed.
"""

from office.demo import AGENT_NAMES, DemoSource


def _events(src):
    return src.events_after(0)


def test_new_agent_never_duplicates_a_live_name():
    src = DemoSource(seed=7)
    src.set_name_pool(["Uma", "Xyla", "Hazel", "Dash"])
    names = [src._new_agent() for _ in range(12)]
    # a 4-name cast spawns 12 agents without ever issuing a live name twice
    assert len(set(names)) == 4
    assert len(src._agent_state) == 4
    enters = [e["agent"] for e in _events(src) if e["type"] == "agent_enter"]
    assert len(enters) == 12
    # every enter is preceded by a leave for the name it reuses
    live = set()
    for e in _events(src):
        if e["type"] == "agent_leave":
            live.discard(e["agent"])
        elif e["type"] == "agent_enter":
            assert e["agent"] not in live, f"{e['agent']} entered while already live"
            live.add(e["agent"])
    assert len(live) <= 4


def test_exhausted_cast_retires_the_oldest_before_reusing():
    src = DemoSource(seed=3)
    src.set_name_pool(["Uma", "Xyla"])
    assert src._new_agent() == "Uma"
    assert src._new_agent() == "Xyla"
    third = src._new_agent()  # cast is full: oldest must be retired first
    leaves = [e for e in _events(src) if e["type"] == "agent_leave"]
    assert [e["agent"] for e in leaves] == ["Uma"]
    assert third == "Uma"
    assert sorted(src._agent_state) == ["Uma", "Xyla"]


def test_pool_rotation_follows_the_cursor():
    src = DemoSource(seed=5)
    src.set_name_pool(["Uma", "Xyla", "Hazel"])
    assert [src._new_agent() for _ in range(3)] == ["Uma", "Xyla", "Hazel"]


def test_unpooled_names_are_unique_and_from_the_known_cast():
    src = DemoSource(seed=11)
    names = [src._new_agent() for _ in range(10)]
    assert len(set(names)) == 10
    assert all(n in AGENT_NAMES for n in names)
