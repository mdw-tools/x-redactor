#!/bin/sh
# Builds the zip to upload to the Chrome Web Store: dist/x-redactor-<version>.zip
set -eu
cd "$(dirname "$0")/.."

node --test test/

version=$(node -p 'require("./manifest.json").version')
out="dist/x-redactor-$version.zip"
mkdir -p dist
rm -f "$out"
zip -qr "$out" manifest.json icons src -x '*.DS_Store'
echo "Built $out"
