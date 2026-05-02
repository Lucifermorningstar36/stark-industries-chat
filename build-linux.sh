#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Stark Industries Chat — Linux Desktop Build Script
# Produces: AppImage (universal) + .deb (Debian/Ubuntu)
# Run this on the VDS (Linux) or any Linux machine with Node.js 18+
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║        STARK INDUSTRIES — Linux Build Script         ║"
echo "║              AppImage + .deb packaging               ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# Check requirements
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found. Install Node.js 18+"; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo "❌ npm not found."; exit 1; }

echo "✅ Node.js $(node -v) found"
echo "✅ npm $(npm -v) found"
echo ""

cd "$FRONTEND_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Convert icon-512.svg to PNG using available tools
echo "🎨 Checking icon files..."
if [ ! -f "public/icon-512.png" ]; then
  if command -v rsvg-convert >/dev/null 2>&1; then
    echo "  Converting icon-512.svg → icon-512.png (rsvg-convert)..."
    rsvg-convert -w 512 -h 512 public/icon-512.svg -o public/icon-512.png
  elif command -v inkscape >/dev/null 2>&1; then
    echo "  Converting icon-512.svg → icon-512.png (inkscape)..."
    inkscape --export-png=public/icon-512.png --export-width=512 --export-height=512 public/icon-512.svg
  elif command -v convert >/dev/null 2>&1; then
    echo "  Converting icon-512.svg → icon-512.png (ImageMagick)..."
    convert -background none -resize 512x512 public/icon-512.svg public/icon-512.png
  else
    echo "  ⚠️  No SVG converter found (rsvg-convert/inkscape/ImageMagick)"
    echo "     Please manually place a 512x512 PNG at: public/icon-512.png"
    echo "     Build will continue but may use default Electron icon."
  fi
else
  echo "  ✅ icon-512.png already exists"
fi

# Build Vite frontend
echo ""
echo "⚡ Building Vite frontend..."
npm run build

# Build Electron Linux packages
echo ""
echo "🐧 Building Electron Linux packages..."
npx electron-builder --linux -c.extraMetadata.main=electron/main.cjs

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║              ✅ BUILD COMPLETE!                       ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Output files in: frontend/release/                  ║"
echo "║  • Stark Chat-*.AppImage  (universal Linux)          ║"
echo "║  • stark-chat_*_amd64.deb (Debian/Ubuntu)            ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "📌 Install .deb:     sudo dpkg -i release/stark-chat_*_amd64.deb"
echo "📌 Run AppImage:     chmod +x release/Stark*.AppImage && ./release/Stark*.AppImage"
echo ""
