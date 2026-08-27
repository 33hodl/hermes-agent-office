#!/usr/bin/env bash
# Hermes Agent Office — one-command install (macOS / Linux / WSL)
set -e
DIR="${1:-$HOME/hermes-agent-office}"
if [ -d "$DIR/.git" ]; then
  echo "→ Updating existing install at $DIR"
  git -C "$DIR" pull --quiet
else
  echo "→ Cloning Hermes Agent Office into $DIR"
  git clone --quiet https://github.com/33hodl/hermes-agent-office.git "$DIR"
fi
echo "→ Starting the office (demo mode)"
cd "$DIR"
PORT="${PORT:-8741}"
if command -v python3 >/dev/null 2>&1; then
  python3 -m office.server --demo --port "$PORT" &
  sleep 1
  echo ""
  echo "✅ Your office is live at http://127.0.0.1:$PORT"
  echo "   Watch the demo, or run with your real agents:"
  echo "   python3 -m office.server --db ~/.hermes/state.db --port $PORT"
  echo "   (stop with: pkill -f office.server)"
else
  echo "❌ python3 not found — install it first, then re-run this script."
  exit 1
fi
