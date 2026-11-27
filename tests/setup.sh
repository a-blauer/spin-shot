#!/bin/bash
# Restore the Polyshot work setup in a fresh session. Run from the repo root: bash tests/setup.sh
# Layout the scripts expect: source in /home/claude/dmh-web, tests in /home/claude/dmh-test, test build in /tmp/fldist.
set -e
REPO=$(pwd)
mkdir -p /home/claude/dmh-web /home/claude/dmh-test
tar -C "$REPO" --exclude=.git --exclude=tests --exclude=node_modules -cf - . | tar -C /home/claude/dmh-web -xf -
cp -r "$REPO/tests/." /home/claude/dmh-test/ && cp "$REPO/NOTES.md" /home/claude/dmh-test/NOTES.md
cd /home/claude/dmh-web && npm install --silent && ./build.sh
mkdir -p /tmp/fldist && cp -r dist/* /tmp/fldist/
npx esbuild src/main.js --bundle --format=iife --target=es2020 --outfile=/tmp/fldist/game.js --log-level=warning
python3 -c "import playwright" 2>/dev/null || pip install --break-system-packages -q playwright
echo "ready: source /home/claude/dmh-web, tests /home/claude/dmh-test (python3 shot_fl.py dg0.json)"
