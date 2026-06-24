#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Daily Life Manager — Start script untuk Termux Android
# ============================================================
# Cara pakai: bash start-termux.sh
# ============================================================

# Cek apakah node_modules ada
if [ ! -d "node_modules" ]; then
  echo "[!] Dependencies belum diinstall."
  echo "    Jalankan dulu: bash install-termux.sh"
  exit 1
fi

# Cek apakah .env ada
if [ ! -f ".env" ]; then
  echo "[!] File .env belum ada."
  echo "    Jalankan dulu: bash install-termux.sh"
  exit 1
fi

# Cek apakah database ada
if [ ! -f "db/custom.db" ]; then
  echo "[!] Database belum ada, membuat..."
  npx prisma db push
fi

# ===== FIX TERMUX-SPECIFIC ISSUES =====

# 1. Pastikan Prisma client ter-generate (penting kalau node_modules baru diinstall)
#    Tanpa ini, error: "@prisma/client did not initialize yet"
echo "[i] Memastikan Prisma client ter-generate..."
npx prisma generate 2>&1 | tail -3

# 2. Set env vars untuk fix Watchpack EACCES errors
#    Termux tidak bisa watch folder sistem Android (/data, /), jadi pakai polling.
#    Polling sedikit lebih lambat tapi bekerja di mana saja.
export WATCHPACK_POLLING=true
export CHOKIDAR_USEPOLLING=true
export NEXT_TELEMETRY_DISABLED=1

# 3. Wake lock supaya Termux tidak dibunuh Android saat screen off
if command -v termux-wake-lock &> /dev/null; then
  termux-wake-lock 2>/dev/null || true
  echo "[i] Wake lock aktif (HP tidak akan sleep)"
fi

# Trap Ctrl+C untuk release wake lock
trap 'echo ""; echo "Berhenti..."; termux-wake-release 2>/dev/null || true; exit 0' INT

echo ""
echo "============================================"
echo "  Daily Life Manager"
echo "============================================"
echo ""
echo "[i] Mode: dev (dengan --webpack untuk Termux)"
echo "[i] Turbopack dimatikan (tidak support android/arm64)"

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3000}"

if [ "$1" == "--local" ]; then
  # Hanya localhost
  HOST="127.0.0.1"
  echo "[i] Bind ke localhost only"
else
  echo "[i] Akses dari device lain di WiFi: http://[IP-HP-Anda]:$PORT"
  echo "[i] Untuk localhost only: bash start-termux.sh --local"
fi
echo ""
echo "Server mulai di http://localhost:$PORT"
echo "Tekan Ctrl+C untuk berhenti"
echo ""

# 4. Pakai --webpack flag (Turbopack tidak punya native binding di android/arm64)
#    Env vars WATCHPACK_POLLING dan CHOKIDAR_USEPOLLING sudah di-set di atas
npx next dev --webpack -H "$HOST" -p "$PORT"
