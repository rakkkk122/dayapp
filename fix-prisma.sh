#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# FIX-PRISMA.SH — Fix khusus error "Prisma client did not initialize"
# ============================================================
# Jalankan script ini KALAU:
#   - App jalan tapi API return 500 error
#   - Log menampilkan: "@prisma/client did not initialize yet"
#   - Setelah install/jalankan pertama kali
#
# Cara pakai: bash fix-prisma.sh
# ============================================================
set -e

echo "============================================"
echo "  Fix Prisma Client untuk Termux"
echo "============================================"
echo ""

# 1. Hapus cache Prisma lama
echo "[1/5] Hapus cache Prisma lama..."
rm -rf node_modules/.prisma 2>/dev/null || true
rm -rf node_modules/@prisma/client/node_modules 2>/dev/null || true
rm -rf .next 2>/dev/null || true
echo "    Cache dibersihkan"

# 2. Cek OpenSSL version di Termux
echo ""
echo "[2/5] Cek OpenSSL version..."
if command -v openssl &> /dev/null; then
  OPENSSL_VER=$(openssl version 2>/dev/null | head -1)
  echo "    $OPENSSL_VER"
else
  echo "    OpenSSL tidak terinstall, install dulu..."
  pkg install openssl -y
fi

# 3. Force regenerate Prisma client dengan binary target yang benar
echo ""
echo "[3/5] Generate Prisma client dengan binary target linux-arm64..."
npx prisma generate 2>&1 | tail -15

# 4. Cek apakah binary engine sudah ada
echo ""
echo "[4/5] Cek binary Prisma engine..."
ENGINE_DIR="node_modules/@prisma/engines"
if [ -d "$ENGINE_DIR" ]; then
  echo "    Engine ditemukan:"
  ls -la $ENGINE_DIR/*.so.node 2>/dev/null | head -5 || echo "    (binary engine belum ada, ada masalah)"
else
  echo "    [!] Folder engine tidak ada — mungkin perlu npm install ulang"
fi

# 5. Test Prisma bisa dipakai
echo ""
echo "[5/5] Test Prisma client..."
node -e "
const { PrismaClient } = require('@prisma/client');
try {
  const p = new PrismaClient();
  console.log('    ✓ PrismaClient berhasil di-instantiate');
  p.\$connect().then(() => {
    console.log('    ✓ Berhasil connect ke database');
    process.exit(0);
  }).catch(e => {
    console.log('    [!] Gagal connect:', e.message);
    process.exit(1);
  });
} catch (e) {
  console.log('    [!] Gagal instantiate:', e.message);
  process.exit(1);
}
"

echo ""
echo "============================================"
echo "  Selesai!"
echo "============================================"
echo ""
echo "Sekarang jalankan app:"
echo "  bash start-termux.sh"
echo ""
echo "Kalau masih error, coba reset total:"
echo "  rm -rf node_modules .next"
echo "  bash install-termux.sh"
