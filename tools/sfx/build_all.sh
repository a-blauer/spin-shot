#!/bin/sh
# Rebuild every sound effect (not the gunshots: those are public/audio/guns and src/gunsound.js) and the trim table.
cd "$(dirname "$0")" && rm -f /tmp/sfx_manifest.json && python3 sounds_a.py && python3 sounds_b.py && python3 sounds_c.py && python3 check.py && python3 calib.py
