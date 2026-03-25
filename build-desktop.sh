#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Stark Industries Chat — Desktop Build Script
# Çalıştır: bash build-desktop.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STARK INDUSTRIES CHAT — DESKTOP BUILD"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd desktop

echo ""
echo "▶ Installing dependencies..."
npm install

echo ""
echo "▶ Building for Windows (x64)..."
npm run build:win

echo ""
echo "▶ Building for Linux (x64)..."
npm run build:linux

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  BUILD COMPLETE — Files in desktop/release/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ls -lh release/*.exe release/*.AppImage 2>/dev/null || true

echo ""
echo "▶ Restarting backend to serve new release files..."
cd ..
docker compose restart backend

echo ""
echo "✓ Done! Download page: https://stark.net.tr/download"
