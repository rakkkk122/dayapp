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
echo "[1/7] Update package list..."
pkg update -y > /dev/null 2>&1 || true

# Install Node.js (LTS) kalau belum ada
if ! command -v node &> /dev/null; then
  echo "[2/7] Install Node.js..."
  pkg install nodejs-lts -y
else
  echo "[2/7] Node.js sudah ada: $(node --version)"
fi

# Install git kalau belum
if ! command -v git &> /dev/null; then
  echo "[3/7] Install git..."
  pkg install git -y
else
  echo "[3/7] Git sudah ada"
fi

# ===== FIX: Hapus node_modules lama kalau ada (reset install bersih) =====
if [ -d "node_modules/@prisma" ] && [ ! -f "node_modules/@prisma/client/runtime/library.js" ]; then
  echo "[4/7] Prisma client rusak/tdk lengkap, hapus node_modules untuk install ulang..."
  rm -rf node_modules
fi

# Install dependencies
# Penting: --build-from-source memaksa compile native modules dari source
# karena prebuilt binary kadang tidak tersedia untuk android-arm64
echo "[4/7] Install dependencies (mungkin butuh 5-15 menit)..."
npm install --build-from-source 2>&1 | tail -10 || npm install 2>&1 | tail -10

# Setup environment file
if [ ! -f .env ]; then
  echo "[5/7] Buat file .env dari template..."
  cp .env.example .env
  # Set path absolut untuk Termux
  PROJECT_DIR="$(pwd)"
  sed -i "s|file:./db/custom.db|file:$PROJECT_DIR/db/custom.db|g" .env
  echo "    .env dibuat dengan DATABASE_URL=file:$PROJECT_DIR/db/custom.db"
else
  echo "[5/7] .env sudah ada, lewati"
fi

# ===== FIX: Generate Prisma client secara eksplisit =====
# Ini penting karena:
# 1. postinstall hook npm kadang tidak jalan di Termux
# 2. Binary target harus linux-arm64 untuk Android, bukan x86_64
echo "[6/7] Generate Prisma client untuk android-arm64..."
npx prisma generate 2>&1 | tail -10

# Init database
echo "[7/7] Init database SQLite..."
npx prisma db push

echo ""
echo "============================================"
echo "  ✓ Install selesai!"
echo "============================================"
echo ""
echo "Cara menjalankan:"
echo "  bash start-termux.sh"
echo ""
echo "Tips Penting:"
echo "  - Server otomatis pakai --webpack (Turbopack tidak support Android)"
echo "  - Watchpack pakai polling (fix error EACCES permission denied)"
echo "  - Wake lock aktif (HP tidak sleep saat app jalan)"
echo ""
echo "Akses:"
echo "  - HP sendiri: http://localhost:3000"
echo "  - Device lain di WiFi: http://[IP-HP-Anda]:3000"
echo "  - Cek IP: ketik 'ifconfig' di Termux"
