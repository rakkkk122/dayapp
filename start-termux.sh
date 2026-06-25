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

# ===== DIAGNOSA AWAL =====
echo ""
echo "===== DIAGNOSA ====="
echo "Node.js : $(node --version 2>/dev/null || echo 'tidak ditemukan')"
echo "npm     : $(npm --version 2>/dev/null || echo 'tidak ditemukan')"
NEXT_VER=$(node -p "require('./node_modules/next/package.json').version" 2>/dev/null || echo "?")
REACT_VER=$(node -p "require('./node_modules/react/package.json').version" 2>/dev/null || echo "?")
PRISMA_VER=$(node -p "require('./node_modules/prisma/package.json').version" 2>/dev/null || echo "?")
echo "Next.js : $NEXT_VER"
echo "React   : $REACT_VER"
echo "Prisma  : $PRISMA_VER"
echo "===================="
echo ""

# Cek Node.js version (Next.js 16 butuh 18.18+)
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo "0")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "[!] Node.js version terlalu lama untuk Next.js 16!"
  echo "    Next.js 16 butuh Node.js 18.18+ (recommended 20+)"
  echo "    Upgrade dengan: pkg install nodejs-lts"
  echo ""
  echo "    Atau pakai versi lama project ini (tidak disarankan)."
  exit 1
fi
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "[i] WARNING: Node.js $NODE_MAJOR.x — Next.js 16 recommended Node 20+"
  echo "    Kalau ada error client-side, upgrade: pkg install nodejs-lts"
  echo ""
fi

# ===== FIX TERMUX-SPECIFIC ISSUES =====

# 1. Pastikan Prisma client ter-generate
echo "[i] Memastikan Prisma client ter-generate..."

# Cek versi Prisma — kalau 7.x, force downgrade ke 6.x
PRISMA_VER_NUM=$(node -p "require('./node_modules/prisma/package.json').version" 2>/dev/null || echo "0")
if [[ "$PRISMA_VER_NUM" == 7.* ]]; then
  echo "    [!] Prisma 7.x terdeteksi, downgrade ke 6.11.1..."
  npm install prisma@6.11.1 @prisma/client@6.11.1 --save-exact --no-audit --no-fund 2>&1 | tail -3
fi

# Set env vars untuk Prisma
export PRISMA_CLIENT_ENGINE_TYPE=library
export PRISMA_ENGINES_MIRROR=https://binaries.prisma.sh

npx prisma generate 2>&1 | tail -3

# 2. CLEAN .next cache — fix "_interop_require_wildcard is not a function"
#    Cache lama bisa konflik dengan chunk baru setelah code change
echo ""
echo "[i] Bersihkan .next cache (fix error chunk JS)..."
rm -rf .next/cache 2>/dev/null || true
# Jangan hapus .next seluruhnya, hanya cache — supaya tidak rebuild dari nol

# 3. Set env vars untuk fix Watchpack EACCES & optimize dev
export WATCHPACK_POLLING=true
export CHOKIDAR_USEPOLLING=true
export NEXT_TELEMETRY_DISABLED=1
# Tambahan: disable source map generation untuk faster dev (kalau HP lemot)
# export GENERATE_SOURCEMAP=false

# 4. Wake lock supaya Termux tidak dibunuh Android saat screen off
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
echo "[i] SW tidak aktif di dev mode (fix cache conflict)"

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3000}"

if [ "$1" == "--local" ]; then
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
echo "[PENTING] Kalau halaman blank/berkedip:"
echo "  1. Buka Chrome → menu ⋮ → History → Clear browsing data → Cached images"
echo "  2. Atau buka URL: chrome://settings/siteData → cari localhost → hapus"
echo "  3. Atau pakai incognito mode untuk test"
echo ""

# 5. Pakai --webpack flag (Turbopack tidak support android/arm64)
npx next dev --webpack -H "$HOST" -p "$PORT"
