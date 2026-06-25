#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# Daily Life Manager — Installer untuk Termux Android
# ============================================================
# Cara pakai:
#   1. Buka Termux
#   2. cd ke folder project ini
#   3. bash install-termux.sh
# ============================================================
set -e

echo "============================================"
echo "  Daily Life Manager — Termux Installer"
echo "============================================"
echo ""

# Cek apakah jalan di Termux
if [ ! -d "/data/data/com.termux" ]; then
  echo "[!] Script ini untuk Termux Android."
  echo "    Untuk Linux/Mac/Windows, gunakan: npm install && npx prisma db push"
  exit 1
fi

echo "[1/8] Update package list..."
pkg update -y > /dev/null 2>&1 || true

if ! command -v node &> /dev/null; then
  echo "[2/8] Install Node.js..."
  pkg install nodejs-lts -y
else
  echo "[2/8] Node.js sudah ada: $(node --version)"
fi

if ! command -v git &> /dev/null; then
  echo "[3/8] Install git..."
  pkg install git -y
else
  echo "[3/8] Git sudah ada"
fi

if ! command -v openssl &> /dev/null; then
  echo "[3.5/8] Install OpenSSL..."
  pkg install openssl-tool -y > /dev/null 2>&1 || pkg install openssl -y
else
  echo "[3.5/8] OpenSSL sudah ada: $(openssl version | head -1)"
fi

# Hapus node_modules lama kalau ada Prisma 7 atau binary salah arch
echo ""
echo "[4/8] Cek versi Prisma yang ada..."
if [ -d "node_modules/prisma" ]; then
  OLD_PRISMA_VER=$(node -p "require('./node_modules/prisma/package.json').version" 2>/dev/null || echo "0")
  echo "    Prisma terpasang: v$OLD_PRISMA_VER"

  if [[ "$OLD_PRISMA_VER" == 7.* ]]; then
    echo "    [!] Prisma 7.x terdeteksi — TIDAK KOMPATIBEL"
    rm -rf node_modules package-lock.json bun.lock 2>/dev/null
    echo "    ✓ Dihapus"
  else
    # Cek apakah ada binary .so.node yang salah arch
    SO_COUNT=$(find node_modules/.prisma -name "*.so.node" 2>/dev/null | wc -l)
    if [ "$SO_COUNT" -gt 0 ]; then
      echo "    [!] Ditemukan $SO_COUNT native binary (mungkin salah arch x86_64)"
      echo "    Hapus untuk regenerate dengan engine library..."
      rm -rf node_modules/.prisma node_modules/@prisma/engines 2>/dev/null
    fi
  fi
else
  echo "    Prisma belum terpasang"
fi

# Install dependencies
echo ""
echo "[5/8] Install dependencies (mungkin butuh 5-15 menit)..."
npm install --no-audit --no-fund 2>&1 | tail -10

# Verify Prisma version setelah install
NEW_PRISMA_VER=$(node -p "require('./node_modules/prisma/package.json').version" 2>/dev/null || echo "0")
echo ""
echo "[6/8] Verifikasi Prisma version..."
echo "    Installed: v$NEW_PRISMA_VER"
if [[ "$NEW_PRISMA_VER" == 7.* ]]; then
  echo "    [!] Masih Prisma 7 — force downgrade ke 6.11.1..."
  npm install prisma@6.11.1 @prisma/client@6.11.1 --save-exact --no-audit --no-fund 2>&1 | tail -5
fi

# Setup environment file
echo ""
echo "[7/8] Setup environment & database..."
if [ ! -f .env ]; then
  cp .env.example .env
  PROJECT_DIR="$(pwd)"
  sed -i "s|file:./db/custom.db|file:$PROJECT_DIR/db/custom.db|g" .env
  echo "    .env dibuat: DATABASE_URL=file:$PROJECT_DIR/db/custom.db"
else
  echo "    .env sudah ada"
fi

# Generate Prisma client dengan engine library
echo "    Generate Prisma client dengan engine library (WASM, fix arch mismatch)..."
export PRISMA_CLIENT_ENGINE_TYPE=library
export PRISMA_ENGINES_MIRROR=https://binaries.prisma.sh

# Hapus dulu binary lama kalau ada
rm -rf node_modules/.prisma 2>/dev/null || true
npx prisma generate --force-reset 2>&1 | tail -5

# Init database
echo "    Init database SQLite..."
npx prisma db push 2>&1 | tail -3

# Verify tidak ada .so.node
SO_FINAL=$(find node_modules/.prisma -name "*.so.node" 2>/dev/null | wc -l)
if [ "$SO_FINAL" -gt 0 ]; then
  echo ""
  echo "    [!] WARNING: Masih ada $SO_FINAL binary .so.node"
  echo "    Jalankan: bash fix-prisma-engine.sh"
else
  echo "    ✓ Engine library aktif (tidak ada native binary)"
fi

echo ""
echo "============================================"
echo "  ✓ Install selesai!"
echo "============================================"
echo ""
echo "Cara menjalankan:"
echo "  bash start-termux.sh"
echo ""
echo "Lalu buka browser: http://localhost:3000"
