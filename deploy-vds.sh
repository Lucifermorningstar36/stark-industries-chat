#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Stark Industries — VDS Deploy Script
# Kullanım: bash deploy-vds.sh <VDS_IP>
# Örnek:    bash deploy-vds.sh 123.456.789.10
# ─────────────────────────────────────────────────────────────────────────────

VDS_IP="${1:-}"
VDS_USER="${VDS_USER:-root}"
PROJECT_DIR="${2:-/root/stark-industries-chat}"

if [ -z "$VDS_IP" ]; then
  echo "❌ Kullanım: bash deploy-vds.sh <VDS_IP>"
  echo "   Örnek:   bash deploy-vds.sh 123.45.67.89"
  exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║       STARK INDUSTRIES — VDS Deploy Script           ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║  Target: $VDS_USER@$VDS_IP:$PROJECT_DIR"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

echo "🔗 Connecting to VDS..."
ssh -o ConnectTimeout=15 "$VDS_USER@$VDS_IP" << EOF
  set -e
  echo "📂 Navigating to project..."
  cd "$PROJECT_DIR"

  echo "⬇️  Pulling latest changes from GitHub..."
  git pull origin main

  echo "📦 Installing frontend dependencies..."
  cd frontend
  npm install --legacy-peer-deps

  echo "⚡ Building frontend..."
  npm run build

  echo "🐳 Rebuilding Docker containers..."
  cd ..
  docker-compose up -d --build

  echo ""
  echo "✅ Deploy complete!"
  echo "🌐 Site: https://stark.net.tr"
  echo ""
  docker ps --format 'table {{.Names}}\t{{.Status}}'
EOF

echo ""
echo "🚀 VDS deploy tamamlandı!"
