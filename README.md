# Polyshot

First-person zombie survival roguelite set in an undead frontier town. three.js, bundled with esbuild.

- **Play:** the built game is in `docs/` and is served by GitHub Pages (Settings -> Pages -> Deploy from a branch -> `main` / `docs`).
- **Build:** `npm install`, then `./build.sh`. Output goes to `dist/`; copy it over `docs/` to publish.
- **Multiplayer:** outside Claude the game connects players directly with WebRTC (PeerJS public broker, `src/peernet.js`). One player opens a lobby and shares the code; no account needed.
- **Art and content:** `art-tools/` holds the Python generators for creatures, icons and the weapon/upgrade/enemy data. `tools/assets.py` packs them.
