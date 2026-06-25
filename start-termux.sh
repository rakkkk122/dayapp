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

# ===== DIAGNOSA AWAL =====
echo ""
echo "===== DIAGNOSA ====="
echo "Node.js : $(node --version 2>/dev/null || echo 'tidak ditemukan')"
echo "Arch    : $(uname -m 2>/dev/null || echo '?')"
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

# ===== FIX PRISMA ARCHITECTURE MISMATCH =====
# Error: "libquery_engine-*.so.node is for EM_X86_64 instead of EM_AARCH64"
# Solusi: pakai engine "library" (WASM), hapus binary native lama

echo "[i] Setup Prisma engine library (fix architecture mismatch)..."

# Cek versi Prisma — kalau 7.x, downgrade ke 6.x
PRISMA_VER_NUM=$(node -p "require('./node_modules/prisma/package.json').version" 2>/dev/null || echo "0")
if [[ "$PRISMA_VER_NUM" == 7.* ]]; then
  echo "    [!] Prisma 7.x terdeteksi, downgrade ke 6.11.1..."
  npm install prisma@6.11.1 @prisma/client@6.11.1 --save-exact --no-audit --no-fund 2>&1 | tail -3
fi

# Set env vars untuk Prisma library engine (PENTING)
export PRISMA_CLIENT_ENGINE_TYPE=library
export PRISMA_ENGINES_MIRROR=https://binaries.prisma.sh

# Cek apakah ada binary .so.node lama (yang salah arch)
SO_COUNT=$(find node_modules/.prisma -name "*.so.node" 2>/dev/null | wc -l)
if [ "$SO_COUNT" -gt 0 ]; then
  echo "    [!] Ditemukan $SO_COUNT native binary lama (salah arch)"
  echo "    Hapus dan regenerate dengan engine library..."
  rm -rf node_modules/.prisma 2>/dev/null
  rm -rf node_modules/@prisma/engines 2>/dev/null
  npx prisma generate --force-reset 2>&1 | tail -5
else
  # Cek apakah Prisma client sudah ter-generate sama sekali
  if [ ! -d "node_modules/.prisma/client" ]; then
    echo "    [i] Prisma client belum ada, generate..."
    npx prisma generate 2>&1 | tail -5
  else
    echo "    ✓ Prisma client sudah ter-generate (library engine)"
  fi
fi

# Verify tidak ada binary .so.node lagi
SO_AFTER=$(find node_modules/.prisma -name "*.so.node" 2>/dev/null | wc -l)
if [ "$SO_AFTER" -gt 0 ]; then
  echo "    [!] WARNING: masih ada $SO_AFTER file .so.node"
  echo "    Coba jalankan: bash fix-prisma-engine.sh"
fi

# ===== CLEAN .next CACHE (fix chunk JS error) =====
echo ""
echo "[i] Bersihkan .next cache (fix error chunk JS)..."
rm -rf .next/cache 2>/dev/null || true

# ===== FIX WATCHPACK EACCES =====
export WATCHPACK_POLLING=true
export CHOKIDAR_USEPOLLING=true
export NEXT_TELEMETRY_DISABLED=1

# ===== WAKE LOCK =====
if command -v termux-wake-lock &> /dev/null; then
  termux-wake-lock 2>/dev/null || true
  echo "[i] Wake lock aktif (HP tidak akan sleep)"
fi

trap 'echo ""; echo "Berhenti..."; termux-wake-release 2>/dev/null || true; exit 0' INT

echo ""
echo "============================================"
echo "  Daily Life Manager"
echo "============================================"
echo ""
echo "[i] Mode: dev (webpack, engine library)"

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
echo "Buka URL di atas di browser. Kalau masih error:"
echo "  - Clear browser cache (Chrome → History → Clear data)"
echo "  - Atau pakai incognito mode"
echo "  - Atau jalankan: bash fix-prisma-engine.sh"
echo ""

# Start dev server dengan webpack
npx next dev --webpack -H "$HOST" -p "$PORT"
