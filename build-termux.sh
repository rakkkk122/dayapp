#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Daily Life Manager — Production build untuk Termux
# ============================================================
# Build aplikasi untuk production (lebih cepat & ringan dari dev mode)
# Cara pakai: bash build-termux.sh
# Setelah build, jalankan dengan: bash start-prod.sh
# ============================================================
set -e

echo "============================================"
echo "  Daily Life Manager — Production Build"
echo "============================================"
echo ""

if [ ! -d "node_modules" ]; then
  echo "[!] Dependencies belum diinstall. Jalankan: bash install-termux.sh"
  exit 1
fi

# Set env vars untuk Termux compatibility
export WATCHPACK_POLLING=true
export CHOKIDAR_USEPOLLING=true
export NEXT_TELEMETRY_DISABLED=1

echo "[1/4] Generate Prisma client (penting sebelum build)..."
npx prisma generate

echo "[2/4] Push schema ke database (kalau ada perubahan)..."
npx prisma db push

echo "[3/4] Build aplikasi (mungkin butuh 5-15 menit di HP)..."
echo "      Build pakai webpack (Turbopack tidak support android/arm64)"
NEXT_TELEMETRY_DISABLED=1 npx next build --webpack

echo "[4/4] Build selesai!"
echo ""
echo "============================================"
echo "  ✓ Production build siap!"
echo "============================================"
echo ""
echo "Cara menjalankan (mode production):"
echo "  bash start-prod.sh"
echo ""
echo "Keuntungan mode production:"
echo "  - Lebih cepat (no hot reload, code optimized)"
echo "  - Lebih hemat RAM/baterai"
echo "  - Cocok untuk pemakaian harian"
echo "  - Tidak ada error Watchpack (tidak ada file watcher)"
