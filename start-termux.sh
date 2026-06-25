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
  PRISMA_CLIENT_ENGINE_TYPE=library npx prisma db push
fi

cd "$(dirname "$0")"

# ===== DIAGNOSA AWAL =====
echo ""
echo "===== DIAGNOSA ====="
echo "Node.js : $(node --version 2>/dev/null || echo 'tidak ditemukan')"
ARCH=$(uname -m 2>/dev/null || echo "?")
echo "Arch    : $ARCH"
NEXT_VER=$(node -p "require('./node_modules/next/package.json').version" 2>/dev/null || echo "?")
PRISMA_VER=$(node -p "require('./node_modules/prisma/package.json').version" 2>/dev/null || echo "?")
echo "Next.js : $NEXT_VER"
echo "Prisma  : $PRISMA_VER"
echo "===================="
echo ""

# Cek Node.js version
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo "0")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "[!] Node.js version terlalu lama untuk Next.js 16!"
  echo "    Upgrade dengan: pkg install nodejs-lts"
  exit 1
fi

# ===== SETUP PRISMA ENGINE =====
echo "[i] Setup Prisma engine..."

# Tentukan pattern berdasarkan architecture
if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
  KEEP_PATTERN="linux-arm64"
  DELETE_PATTERN="debian"
elif [[ "$ARCH" == "x86_64" || "$ARCH" == "x64" ]]; then
  KEEP_PATTERN="debian"
  DELETE_PATTERN="linux-arm64"
else
  KEEP_PATTERN="linux-arm64"
  DELETE_PATTERN="debian"
fi

# Install system dependencies untuk Prisma binary di ARM64 (Termux Android)
# libgcc_s.so.1 = dibutuhkan untuk dlopen C++ binary
if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
  if [ ! -f "/data/data/com.termux/files/usr/lib/libgcc_s.so.1" ]; then
    echo "    [i] Install libgcc & libc++ (diperlukan Prisma binary)..."
    pkg install libgcc libc++ -y 2>&1 | tail -3 || true
  fi
  # Set LD_LIBRARY_PATH supaya Prisma binary bisa find libgcc_s.so.1
  export LD_LIBRARY_PATH="/data/data/com.termux/files/usr/lib:${LD_LIBRARY_PATH:-}"
fi

# Cek @prisma/engines package (harus ada — jangan dihapus!)
if [ ! -d "node_modules/@prisma/engines" ]; then
  echo "    [!] @prisma/engines package hilang — reinstall..."
  npm install @prisma/engines --no-audit --no-fund 2>&1 | tail -3
fi

# Cek apakah perlu regenerate
NEED_REGEN=false
if [ ! -d "node_modules/.prisma/client" ]; then
  NEED_REGEN=true
  echo "    [i] Prisma client belum ada, perlu generate"
else
  # Cek apakah ada binary dengan pattern yang benar
  KEEP_COUNT=$(find node_modules/.prisma/client -name "libquery_engine-$KEEP_PATTERN*.so.node" 2>/dev/null | wc -l)
  if [ "$KEEP_COUNT" -eq 0 ]; then
    NEED_REGEN=true
    echo "    [i] Binary dengan arch benar ($KEEP_PATTERN) tidak ada, perlu generate"
  fi
fi

if [ "$NEED_REGEN" = true ]; then
  echo "    Generate Prisma client..."
  rm -rf node_modules/.prisma 2>/dev/null
  PRISMA_CLIENT_ENGINE_TYPE=library npx prisma generate 2>&1 | tail -5
fi

# HAPUS binary salah architecture
WRONG_FILES=$(find node_modules/.prisma/client -name "libquery_engine-$DELETE_PATTERN*.so.node" 2>/dev/null)
if [ -n "$WRONG_FILES" ]; then
  echo "    [i] Hapus binary salah arch (*$DELETE_PATTERN*)..."
  echo "$WRONG_FILES" | xargs rm -f 2>/dev/null
  echo "    ✓ Binary salah arch dihapus"
fi

# Set PRISMA_QUERY_ENGINE_LIBRARY ke binary yang tersisa
FIRST_BIN=$(find node_modules/.prisma/client -name "libquery_engine-$KEEP_PATTERN*.so.node" 2>/dev/null | head -1)
if [ -n "$FIRST_BIN" ]; then
  ABS_PATH="$(pwd)/$FIRST_BIN"
  export PRISMA_QUERY_ENGINE_LIBRARY="$ABS_PATH"
  export PRISMA_CLIENT_ENGINE_TYPE=library
  echo "    ✓ Engine binary: $ABS_PATH"
else
  echo "    [!] Tidak ada binary dengan arch benar — app mungkin error"
  echo "    Jalankan: bash fix-prisma-engine.sh"
fi

# ===== CLEAN .next CACHE =====
echo ""
echo "[i] Bersihkan .next cache..."
rm -rf .next/cache 2>/dev/null || true

# ===== FIX WATCHPACK EACCES =====
export WATCHPACK_POLLING=true
export CHOKIDAR_USEPOLLING=true
export NEXT_TELEMETRY_DISABLED=1

# ===== WAKE LOCK =====
if command -v termux-wake-lock &> /dev/null; then
  termux-wake-lock 2>/dev/null || true
  echo "[i] Wake lock aktif"
fi

trap 'echo ""; echo "Berhenti..."; termux-wake-release 2>/dev/null || true; exit 0' INT

echo ""
echo "============================================"
echo "  Daily Life Manager"
echo "============================================"
echo ""
echo "[i] Mode: dev (webpack, engine $KEEP_PATTERN)"

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-3000}"

if [ "$1" == "--local" ]; then
  HOST="127.0.0.1"
  echo "[i] Bind ke localhost only"
else
  echo "[i] Akses dari device lain: http://[IP-HP-Anda]:$PORT"
fi
echo ""
echo "============================================"
echo "  Server mulai di http://localhost:$PORT"
echo "============================================"
echo ""
echo "Buka URL di atas di browser."
echo "Kalau masih error, clear browser cache atau pakai incognito."
echo ""

# Start dev server dengan webpack
npx next dev --webpack -H "$HOST" -p "$PORT"
