"""Backdrop art generation for custom offices — Nous Portal image model.

Reads the Hermes Nous credential (auth.json) on the user's own machine and
calls the inference API to paint an office backdrop from a prompt. Falls
back cleanly (palette-only theme) when no credential or API is available.

Every successful generation is appended to spend.log (repo root) with an
estimated cost so the project budget stays transparent.
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
import subprocess
import time
from typing import Dict, Optional, Tuple

MODEL = "google/gemini-3-pro-image"
ESTIMATE_PER_IMAGE_USD = 0.08  # conservative estimate; actual billing varies

DEFAULT_AUTH_CANDIDATES = [
    os.path.expanduser("~/.hermes/auth.json"),
    "/home/hermes/.hermes/auth.json",
    os.path.expanduser("~/.hermes/profiles/*/auth.json"),
    "/home/hermes/.hermes/profiles/*/auth.json",
]
import glob


def find_auth() -> Optional[Dict]:
    for pat in DEFAULT_AUTH_CANDIDATES:
        for path in glob.glob(pat):
            try:
                data = json.load(open(path))
                nous = (data.get("providers") or {}).get("nous") or {}
                if nous.get("access_token"):
                    return nous
            except Exception:
                continue
    return None


def _spend_log(entry: str) -> None:
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    path = os.path.join(repo_root, "spend.log")
    try:
        with open(path, "a") as fh:
            fh.write(entry + "\n")
    except Exception:
        pass


def generate_backdrop(prompt: str, out_path: str,
                      estimate: float = ESTIMATE_PER_IMAGE_USD) -> Tuple[bool, str]:
    """Generate a backdrop image from a prompt. Returns (ok, message)."""
    auth = find_auth()
    if not auth:
        return False, "no Nous credential found — using palette theme"

    token = auth["access_token"]
    base = auth.get("inference_base_url", "https://inference-api.nousresearch.com/v1")
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": [{"type": "text", "text": prompt}]}],
        "n": 1,
    }
    try:
        r = subprocess.run(
            ["curl", "-s", "-o", "/tmp/office_art_resp.json", "-w", "%{http_code}",
             "-H", f"Authorization: Bearer {token}",
             "-H", "Content-Type: application/json",
             "-X", "POST", base + "/chat/completions",
             "-d", json.dumps(payload)],
            capture_output=True, text=True, timeout=300)
        if r.stdout.strip() != "200":
            return False, f"API error {r.stdout}"
        resp = json.load(open("/tmp/office_art_resp.json"))
        if "error" in resp:
            return False, f"API error: {str(resp['error'])[:200]}"
        msg = resp["choices"][0]["message"]
        imgs = msg.get("images") or []
        if not imgs:
            return False, "model returned no image"
        url = imgs[0]["image_url"]["url"]
        if url.startswith("data:"):
            with open(out_path, "wb") as fh:
                fh.write(base64.b64decode(url.split(",", 1)[1]))
        else:
            subprocess.run(["curl", "-s", "-o", out_path, url], timeout=120)
        if not os.path.exists(out_path) or os.path.getsize(out_path) < 1000:
            return False, "image save failed"
        _spend_log(f"2026-08-26  custom theme art ({MODEL})  ~${estimate:.2f} est  "
                   f"{os.path.basename(out_path)}")
        return True, "ok"
    except Exception as exc:
        return False, f"error: {exc}"


def cache_path_for(prompt: str) -> str:
    h = hashlib.sha1(prompt.encode()).hexdigest()[:16]
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    d = os.path.join(repo_root, "web", "assets")
    os.makedirs(d, exist_ok=True)
    return os.path.join(d, f"custom-{h}.png")


def cache_url_for(prompt: str) -> str:
    return "/assets/" + os.path.basename(cache_path_for(prompt))
