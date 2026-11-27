# Polyshot test kit

Headless play-tests and scans used while building the game. `bash tests/setup.sh` (from the repo root) puts the source
in /home/claude/dmh-web, this kit in /home/claude/dmh-test and a test build in /tmp/fldist.

- `python3 shot_fl.py X.json`: opens the game with `?test`, runs the JS steps (`{js}`, `{wait}`, `{shot}`), saves shots to
  `out/`. `__sim(n)` advances frames; `window.__dmhHold` freezes the camera. Needs Chrome at /usr/bin/google-chrome.
- Regressions: `dg0.json` (expects `[55,[],[]]`), `fl/wt.json` (weapon checks).
- Scans: `fl/run2.py 6` (Descent floats), `vs/run.py` and `vs/frun.py 6` (village walk/clip/float), `vs/sweep.py`.
- Hitboxes: `hb/run2.py 24` (ray grids against every enemy and boss model).
- Rebuild the test bundle after source edits (from /home/claude/dmh-web):
  `npx esbuild src/main.js --bundle --format=iife --target=es2020 --outfile=/tmp/fldist/game.js --log-level=warning`
