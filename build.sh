#!/bin/sh
set -e
cd "$(dirname "$0")"
rm -rf dist && mkdir -p dist
npx esbuild src/main.js --bundle --minify --format=iife --target=es2020 --outfile=dist/game.js --log-level=warning
cp index.html dist/
cp -r public/* dist/
rm -rf dist/fonts
rm -rf dist/sprites
