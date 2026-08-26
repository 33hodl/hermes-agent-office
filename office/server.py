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
        if path == "/api/events":
            return self._sse()
        return self._file(path)

    def do_POST(self):
        path = self.path.split("?")[0]
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
            while True:
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
                    payload = json.dumps(ev)
                    self.wfile.write(f"data: {payload}\n\n".encode())
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass
        finally:
            self.app.unsubscribe(q)

    def log_message(self, fmt: str, *args):
        # keep the console quiet; logs live in STATUS/terminal only
        pass


def main(argv: Optional[List[str]] = None) -> int:
    ap = argparse.ArgumentParser(prog="hermes-office", description=__doc__)
    ap.add_argument("--demo", action="store_true", help="demo mode (default)")
    ap.add_argument("--db", metavar="PATH", help="path to Hermes state.db (live mode)")
    ap.add_argument("--port", type=int, default=8741)
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--seed", type=int, default=None, help="demo RNG seed")
    ap.add_argument("--interval", type=float, default=0.35, help="demo event interval")
    ap.add_argument("--poll", type=float, default=1.0, help="db poll interval (s)")
    ap.add_argument("--version", action="version", version=f"hermes-office {__version__}")
    args = ap.parse_args(argv)

    if args.db:
        source = HermesDBSource(db_path=args.db, poll_interval=args.poll)
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
    mode = "live" if args.db else "demo"
    print(f"Hermes Agent Office v{__version__} ({mode} mode)")
    print(f"  → http://{args.host}:{args.port}")
    if args.db:
        print(f"  → watching {args.db}")
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
