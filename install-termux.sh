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

# Update package list
echo "[1/8] Update package list..."
pkg update -y > /dev/null 2>&1 || true

# Install Node.js (LTS) kalau belum ada
if ! command -v node &> /dev/null; then
  echo "[2/8] Install Node.js..."
  pkg install nodejs-lts -y
else
  echo "[2/8] Node.js sudah ada: $(node --version)"
fi

# Install git kalau belum
if ! command -v git &> /dev/null; then
  echo "[3/8] Install git..."
  pkg install git -y
else
  echo "[3/8] Git sudah ada"
fi

# Install OpenSSL kalau belum (dibutuhkan Prisma)
if ! command -v openssl &> /dev/null; then
  echo "[3.5/8] Install OpenSSL..."
  pkg install openssl-tool -y > /dev/null 2>&1 || pkg install openssl -y
else
  echo "[3.5/8] OpenSSL sudah ada: $(openssl version | head -1)"
fi

# ===== Hapus node_modules lama kalau ada Prisma 7 (incompatible) =====
echo ""
echo "[4/8] Cek versi Prisma yang ada..."
if [ -d "node_modules/prisma" ]; then
  OLD_PRISMA_VER=$(node -p "require('./node_modules/prisma/package.json').version" 2>/dev/null || echo "0")
  echo "    Prisma terpasang: v$OLD_PRISMA_VER"
  if [[ "$OLD_PRISMA_VER" == 7.* ]]; then
    echo "    [!] Prisma 7.x terdeteksi — TIDAK KOMPATIBEL dengan project ini"
    echo "    [!] Hapus node_modules untuk reinstall dengan Prisma 6..."
    rm -rf node_modules package-lock.json bun.lock 2>/dev/null
    echo "    ✓ Dihapus"
  else
    echo "    ✓ Versi Prisma 6.x (kompatibel)"
  fi
else
  echo "    Prisma belum terpasang"
fi

# Install dependencies
# Pakai --no-audit --no-fund untuk hemat bandwidth di HP
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
  NEW_PRISMA_VER=$(node -p "require('./node_modules/prisma/package.json').version" 2>/dev/null || echo "0")
  echo "    Setelah downgrade: v$NEW_PRISMA_VER"
fi
if [[ "$NEW_PRISMA_VER" == 6.* ]]; then
  echo "    ✓ Prisma 6.x confirmed"
else
  echo "    [!] WARNING: Prisma version tidak expected ($NEW_PRISMA_VER)"
  echo "    Mungkin perlu manual: npm install prisma@6.11.1 @prisma/client@6.11.1 --save-exact"
fi

# Setup environment file
echo ""
echo "[7/8] Setup environment & database..."
if [ ! -f .env ]; then
  cp .env.example .env
  PROJECT_DIR="$(pwd)"
  sed -i "s|file:./db/custom.db|file:$PROJECT_DIR/db/custom.db|g" .env
  echo "    .env dibuat dengan DATABASE_URL=file:$PROJECT_DIR/db/custom.db"
else
  echo "    .env sudah ada, lewati"
fi

# Generate Prisma client
# Pakai PRISMA_CLIENT_ENGINE_TYPE=library untuk fix "binary not available" di android
echo "    Generate Prisma client..."
PRISMA_CLIENT_ENGINE_TYPE=library npx prisma generate 2>&1 | tail -5

# Init database
echo "    Init database SQLite..."
npx prisma db push 2>&1 | tail -3

echo ""
echo "============================================"
echo "  ✓ Install selesai!"
echo "============================================"
echo ""
echo "Cara menjalankan:"
echo "  bash start-termux.sh"
echo ""
echo "Tips Penting Termux:"
echo "  - Server otomatis pakai --webpack (Turbopack tidak support Android)"
echo "  - Watchpack pakai polling (fix EACCES permission denied)"
echo "  - Prisma 6.x dipakai (Prisma 7 incompatible, otomatis didowngrade)"
echo "  - Wake lock aktif (HP tidak sleep saat app jalan)"
echo ""
echo "Akses:"
echo "  - HP sendiri: http://localhost:3000"
echo "  - Device lain di WiFi: http://[IP-HP-Anda]:3000"
echo "  - Cek IP: ketik 'ifconfig' di Termux"
