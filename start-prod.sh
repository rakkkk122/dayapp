#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Daily Life Manager — Run production server
# ============================================================
# Cara pakai: bash start-prod.sh
# Harus sudah di-build dulu: bash build-termux.sh
# ============================================================

if [ ! -d ".next/standalone" ]; then
  echo "[!] Build belum ada."
  echo "    Jalankan dulu: bash build-termux.sh"
  exit 1
fi

if [ ! -f "db/custom.db" ]; then
  echo "[!] Database belum ada, membuat..."
  npx prisma db push
fi

echo "============================================"
echo "  Daily Life Manager (Production)"
echo "============================================"
echo ""
echo "Server mulai di http://localhost:3000"
echo "Tekan Ctrl+C untuk berhenti"
echo ""

# Wake lock
if command -v termux-wake-lock &> /dev/null; then
  termux-wake-lock 2>/dev/null || true
  echo "[i] Wake lock aktif"
fi

trap 'echo ""; echo "Berhenti..."; termux-wake-release 2>/dev/null || true; exit 0' INT

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3000}"

echo "[i] Akses dari device lain di WiFi: http://[IP-HP-Anda]:$PORT"
echo ""

NODE_ENV=production node .next/standalone/server.js
