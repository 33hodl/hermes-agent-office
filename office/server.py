"""Hermes Agent Office — local web server.

Zero dependencies: Python 3.10+ standard library only. Serves the office
frontend and a live event stream (SSE) fed by either the demo generator or
the real Hermes state.db watcher.

Usage:
    python -m office.server --demo             # demo mode (default)
    python -m office.server --db ~/.hermes/state.db
    python -m office.server --demo --port 8741
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import queue
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, List, Optional

from . import __version__
from .demo import DemoSource
from .events import OfficeStore
from .hermes_db import HermesDBSource
from . import art as office_art

WEB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "web")

SSE_KEEPALIVE = 15.0


class OfficeApp:
    """Wires a source -> store -> subscribers."""

    def __init__(self, source: Any):
        self.source = source
        self.store = OfficeStore()
        self._subscribers: List[queue.Queue] = []
        self._lock = threading.Lock()
        self._last_ingested = 0

    def start(self):
        self.source.start()

    def stop(self):
        try:
            self.source.stop()
        except Exception:
            pass

    def catch_up(self) -> None:
        """Ingest everything the source has produced so far (bounded)."""
        for _ in range(100):
            events = self.source.events_after(self._last_ingested)
            if not events:
                break
            self._last_ingested = events[-1]["id"]
            self.ingest(events)

    def poll(self) -> None:
        events = self.source.events_after(self._last_ingested)
        if events:
            self._last_ingested = events[-1]["id"]
            self.ingest(events)

    def ingest(self, events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        applied = []
        with self._lock:
            for ev in events:
                out = self.store.apply(ev)
                if out:
                    applied.append(out)
            subs = list(self._subscribers)
        for q in subs:
            try:
                q.put(applied)
            except Exception:
                pass
        return applied

    def subscribe(self, q: queue.Queue) -> None:
        with self._lock:
            self._subscribers.append(q)

    def unsubscribe(self, q: queue.Queue) -> None:
        with self._lock:
            if q in self._subscribers:
                self._subscribers.remove(q)


class OfficeHandler(BaseHTTPRequestHandler):
    app: OfficeApp = None  # type: ignore[assignment]
    server_version = f"HermesOffice/{__version__}"

    # -- helpers ---------------------------------------------------------

    def _json(self, obj: Any, status: int = 200):
        body = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _file(self, rel: str):
        rel = os.path.normpath(rel.lstrip("/"))
        path = os.path.join(WEB_DIR, rel)
        if not path.startswith(WEB_DIR) or not os.path.isfile(path):
            self.send_error(404, "not found")
            return
        ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
        with open(path, "rb") as fh:
            body = fh.read()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)

    # -- routes -----------------------------------------------------------

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/" or path == "/index.html":
            return self._file("index.html")
        if path == "/api/health":
            health = getattr(self.app.source, "health", lambda: {})()
            health["name"] = getattr(self.app.source, "name", "unknown")
            return self._json({"ok": True, "version": __version__, "source": health})
        if path == "/api/state":
            return self._json(self.app.store.snapshot())
        if path == "/api/events/poll":
            try:
                since = int(self.path.split("since=")[1].split("&")[0])
            except Exception:
                since = 0
            batch = self.app.source.events_after(since)
            if batch:
                self.app.ingest(batch)
            return self._json({"since": since, "events": batch})
        if path == "/api/events":
            return self._sse()
        return self._file(path)

    def do_POST(self):
        path = self.path.split("?")[0]
        if path == "/api/art":
            try:
                length = int(self.headers.get("Content-Length", 0))
                payload = json.loads(self.rfile.read(length) or b"{}")
            except Exception:
                payload = {}
            prompt = (payload.get("prompt") or "").strip()[:1500]
            if not prompt:
                return self._json({"ok": False, "error": "empty prompt"}, 400)
            out = office_art.cache_path_for(prompt)
            if os.path.exists(out):
                return self._json({"ok": True, "url": office_art.cache_url_for(prompt), "cached": True})
            ok, msg = office_art.generate_backdrop(prompt, out)
            if ok:
                return self._json({"ok": True, "url": office_art.cache_url_for(prompt), "cached": False})
            return self._json({"ok": False, "error": msg}, 502)
        if path == "/api/demo/burst":
            src = self.app.source
            if hasattr(src, "burst_task"):
                src.burst_task()
                return self._json({"ok": True})
            return self._json({"ok": False, "error": "burst not supported in live mode — run demo mode"}, 400)
        if path == "/api/demo/names":
            try:
                length = int(self.headers.get("Content-Length", 0))
                payload = json.loads(self.rfile.read(length) or b"{}")
            except Exception:
                payload = {}
            names = [str(n).strip()[:24] for n in payload.get("names", []) if str(n).strip()]
            src = self.app.source
            if hasattr(src, "set_name_pool"):
                src.set_name_pool(names)
            return self._json({"ok": True, "names": len(names)})
        if path == "/api/deliveries/read":
            try:
                length = int(self.headers.get("Content-Length", 0))
                payload = json.loads(self.rfile.read(length) or b"{}")
            except Exception:
                payload = {}
            ids = set(payload.get("ids", []))
            for d in self.app.store.deliveries:
                if d["id"] in ids:
                    d["read"] = True
            return self._json({"ok": True, "unread": sum(
                1 for d in self.app.store.deliveries if not d["read"])})
        self.send_error(404)

    # -- SSE --------------------------------------------------------------

    def _sse(self):
        try:
            since = int(self.path.split("since=")[1].split("&")[0])
        except Exception:
            since = 0
        # visitor / polling mode: close after `limit` events or after idle
        try:
            limit = int(self.path.split("limit=")[1].split("&")[0])
        except Exception:
            limit = 0
        try:
            idle_ms = float(self.path.split("idle=")[1].split("&")[0])
        except Exception:
            idle_ms = 0

        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.end_headers()

        q: queue.Queue = queue.Queue()
        self.app.subscribe(q)

        # replay anything missed since the client's last event
        missed = self.app.source.events_after(since)
        if missed:
            self.app.ingest(missed)

        try:
            last = since
            sent = 0
            idle_deadline = (time.time() + idle_ms / 1000.0) if idle_ms > 0 else None
            while True:
                if idle_deadline and time.time() > idle_deadline:
                    break
                try:
                    batch = q.get(timeout=SSE_KEEPALIVE)
                except queue.Empty:
                    self.wfile.write(b": keepalive\n\n".encode())
                    self.wfile.flush()
                    continue
                for ev in batch:
                    if ev["id"] <= last:
                        continue
                    last = ev["id"]
                    sent += 1
                    payload = json.dumps(ev)
                    self.wfile.write(f"data: {payload}\n\n".encode())
                    if limit and sent >= limit:
                        self.wfile.flush()
                        return
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass
        finally:
            self.app.unsubscribe(q)
            try:
                self.wfile.flush()
            except Exception:
                pass

    def log_message(self, fmt: str, *args):
        # keep the console quiet; logs live in STATUS/terminal only
        pass


class VisitorSource:
    """Polls a REMOTE office instance and forwards its agents as visitors.

    Lets you watch other people's bots (and let them watch yours): run
    `--visit https://someone.example:8741` and their agents wander in as
    guests. Read-only client of the remote office's public event stream.
    """

    name = "visitor"

    def __init__(self, remote: str, poll_interval: float = 2.0):
        self.remote = remote.rstrip("/")
        self.poll_interval = poll_interval
        self._events = []
        self._lock = threading.Lock()
        self._next_id = 1
        self._last_remote_id = 0
        self._stop = threading.Event()
        self._thread = None
        self._last_error = ""

    def start(self):
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self):
        self._stop.set()

    def health(self):
        return {"ok": not self._last_error, "remote": self.remote, "error": self._last_error or None}

    def events_after(self, since_id):
        with self._lock:
            return [e for e in self._events if e["id"] > since_id]

    def latest_id(self):
        with self._lock:
            return self._events[-1]["id"] if self._events else 0

    def wait_ready(self, timeout=15.0):
        t0 = time.time()
        while time.time() - t0 < timeout:
            if not self._last_error and self._events:
                return True
            if self._stop.is_set():
                return False
            time.sleep(0.2)
        return bool(self._events)

    def _emit(self, **fields):
        ev = {"id": self._next_id, "ts": time.time(), "visitor": True}
        self._next_id += 1
        ev.update(fields)
        with self._lock:
            self._events.append(ev)

    def _run(self):
        import urllib.request as urlreq
        while not self._stop.is_set():
            try:
                url = f"{self.remote}/api/events/poll?since={self._last_remote_id}"
                with urlreq.urlopen(url, timeout=8) as r:
                    payload = json.loads(r.read().decode("utf-8", "replace"))
                for ev in payload.get("events", []):
                    if ev.get("id", 0) <= self._last_remote_id:
                        continue
                    self._last_remote_id = ev["id"]
                    self._emit(type=ev.get("type", "status"), agent=ev.get("agent", "Guest"),
                               session=ev.get("session", ""), role=ev.get("role", "guest"),
                               tool=ev.get("tool"), text=ev.get("text"),
                               task=ev.get("task"), title=ev.get("title"),
                               content=ev.get("content"), tokens=ev.get("tokens") or {})
                self._last_error = ""
            except Exception as exc:
                self._last_error = str(exc)[:200]
            self._stop.wait(self.poll_interval)


def main(argv: Optional[List[str]] = None) -> int:
    ap = argparse.ArgumentParser(prog="hermes-office", description=__doc__)
    ap.add_argument("--demo", action="store_true", help="demo mode (default)")
    ap.add_argument("--db", metavar="PATH", help="path to Hermes state.db (live mode)")
    ap.add_argument("--port", type=int, default=8741)
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--seed", type=int, default=None, help="demo RNG seed")
    ap.add_argument("--visit", metavar="URL", help="watch another office instance's agents as visitors")
    ap.add_argument("--interval", type=float, default=0.35, help="demo event interval")
    ap.add_argument("--poll", type=float, default=1.0, help="db poll interval (s)")
    ap.add_argument("--version", action="version", version=f"hermes-office {__version__}")
    args = ap.parse_args(argv)

    if args.db:
        source = HermesDBSource(db_path=args.db, poll_interval=args.poll)
    elif args.visit:
        source = VisitorSource(remote=args.visit, poll_interval=args.poll)
    else:
        source = DemoSource(seed=args.seed, interval=args.interval)

    app = OfficeApp(source)
    app.start()
    app.catch_up()

    def _pump():
        while True:
            try:
                app.poll()
            except Exception:
                pass
            time.sleep(0.25)

    threading.Thread(target=_pump, daemon=True).start()

    handler = OfficeHandler
    handler.app = app
    httpd = ThreadingHTTPServer((args.host, args.port), handler)
    mode = "live" if args.db else ("visit" if args.visit else "demo")
    print(f"Hermes Agent Office v{__version__} ({mode} mode)")
    print(f"  → http://{args.host}:{args.port}")
    if args.db:
        print(f"  → watching {args.db}")
    elif args.visit:
        print(f"  → watching visitors from {args.visit}")
    else:
        print("  → synthetic demo feed (use --db ~/.hermes/state.db for live)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        app.stop()
        httpd.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
