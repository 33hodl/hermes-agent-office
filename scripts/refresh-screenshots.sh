#!/usr/bin/env bash
# Regenerate all showcase screenshots + the demo GIF.
# Requires: python3, node, playwright (npm i playwright && npx playwright install chromium), ffmpeg
# Usage: bash scripts/refresh-screenshots.sh
set -e
cd "$(dirname "$0")/.."
echo "→ Starting demo server on :8741"
python3 -m office.server --demo --seed 42 --port 8741 &
SRV=$!
trap "kill $SRV 2>/dev/null || true" EXIT
sleep 2
echo "→ Capturing themes, GIF frames and custom offices (node)"
node scripts/capture.js
echo "→ Encoding GIF + montage (ffmpeg)"
ffmpeg -y -loglevel error -i /tmp/gif-frames/f%03d.png \
  -vf "fps=12,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4" \
  docs/screenshots/demo.gif
ffmpeg -y -loglevel error -i docs/screenshots/office.png -i docs/screenshots/nous.png -i docs/screenshots/dunder.png \
  -filter_complex "[0:v]scale=640:-1[a];[1:v]scale=640:-1[b];[2:v]scale=640:-1[c];[a][b][c]hstack=3" \
  docs/screenshots/montage.png
echo "✅ Screenshots + GIF refreshed. Commit them:  git add docs/screenshots && git commit"
