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

# ===== DETECT & FORCE ARM64 BINARY =====
# Di Termux Android, Prisma auto-detect platform salah (deteksi "linux" → ambil x86_64)
# Padahal HP Android adalah ARM64. Solusi: paksa pakai arm64 binary via env var.
ARCH=$(uname -m 2>/dev/null || echo "")
if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
  # Cari arm64 binary yang ada di .prisma/client/
  ARM64_BIN=""
  for bin in "libquery_engine-linux-arm64-openssl-3.0.x.so.node" "libquery_engine-linux-arm64-openssl-1.1.x.so.node"; do
    if [ -f "node_modules/.prisma/client/$bin" ]; then
      ARM64_BIN="$(pwd)/node_modules/.prisma/client/$bin"
      break
    fi
  done
  if [ -n "$ARM64_BIN" ]; then
    export PRISMA_QUERY_ENGINE_BINARY="$ARM64_BIN"
    echo "    [i] ARM64 detected, force engine binary: $ARM64_BIN"
  else
    echo "    [!] ARM64 detected tapi binary belum ada. Akan di-generate..."
  fi
fi

# Cek apakah ada binary .so.node lama (yang salah arch)
SO_COUNT=$(find node_modules/.prisma -name "*.so.node" 2>/dev/null | wc -l)
if [ "$SO_COUNT" -gt 0 ]; then
  # Cek apakah ada arm64 binary
  ARM64_COUNT=$(find node_modules/.prisma -name "*arm64*" 2>/dev/null | wc -l)
  if [ "$ARM64_COUNT" -gt 0 ]; then
    echo "    ✓ Prisma client sudah ada binary ARM64"
  else
    echo "    [!] Binary Prisma ada tapi TIDAK ada ARM64 — regenerate..."
    rm -rf node_modules/.prisma 2>/dev/null
    npx prisma generate --force-reset 2>&1 | tail -5
    # Set ulang env var setelah generate
    for bin in "libquery_engine-linux-arm64-openssl-3.0.x.so.node" "libquery_engine-linux-arm64-openssl-1.1.x.so.node"; do
      if [ -f "node_modules/.prisma/client/$bin" ]; then
        export PRISMA_QUERY_ENGINE_BINARY="$(pwd)/node_modules/.prisma/client/$bin"
        echo "    [i] Force engine binary: $PRISMA_QUERY_ENGINE_BINARY"
        break
      fi
    done
  fi
else
  # Cek apakah Prisma client sudah ter-generate sama sekali
  if [ ! -d "node_modules/.prisma/client" ]; then
    echo "    [i] Prisma client belum ada, generate..."
    npx prisma generate 2>&1 | tail -5
    # Set env var setelah generate
    for bin in "libquery_engine-linux-arm64-openssl-3.0.x.so.node" "libquery_engine-linux-arm64-openssl-1.1.x.so.node"; do
      if [ -f "node_modules/.prisma/client/$bin" ]; then
        export PRISMA_QUERY_ENGINE_BINARY="$(pwd)/node_modules/.prisma/client/$bin"
        echo "    [i] Force engine binary: $PRISMA_QUERY_ENGINE_BINARY"
        break
      fi
    done
  else
    echo "    ✓ Prisma client sudah ter-generate"
  fi
fi

# Cek apakah @prisma/engines package masih ada (harus ada — jangan dihapus!)
if [ ! -d "node_modules/@prisma/engines" ]; then
  echo "    [!] @prisma/engines package hilang — reinstall..."
  npm install @prisma/engines --no-audit --no-fund 2>&1 | tail -3
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
