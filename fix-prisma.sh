#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# FIX-PRISMA.SH — Fix khusus error Prisma di Termux
# ============================================================
# Jalankan script ini KALAU:
#   - Error: "@prisma/client did not initialize yet"
#   - Error: "prisma schema validation - get-config-wasm"
#   - Error: "the datasource property 'url' is no longer supported"
#   - Prisma 7 terpasang padahal harusnya Prisma 6
#
# Cara pakai: bash fix-prisma.sh
# ============================================================
set -e

echo "============================================"
echo "  Fix Prisma Client untuk Termux"
echo "============================================"
echo ""

# 0. Cek versi Prisma yang terpasang
echo "[0/6] Cek versi Prisma..."
if [ -f "node_modules/prisma/package.json" ]; then
  CUR_VER=$(node -p "require('./node_modules/prisma/package.json').version" 2>/dev/null || echo "0")
  echo "    Prisma terpasang: v$CUR_VER"
else
  CUR_VER="0"
  echo "    Prisma belum terpasang"
fi

# 1. Kalau Prisma 7.x terdeteksi, DOWNGRADE ke 6.11.1
if [[ "$CUR_VER" == 7.* ]]; then
  echo ""
  echo "[1/6] [!] Prisma 7.x terdeteksi — TIDAK KOMPATIBEL dengan project ini"
  echo "    Downgrade ke Prisma 6.11.1..."
  npm install prisma@6.11.1 @prisma/client@6.11.1 --save-exact --no-audit --no-fund 2>&1 | tail -5
  CUR_VER=$(node -p "require('./node_modules/prisma/package.json').version" 2>/dev/null || echo "0")
  echo "    Setelah downgrade: v$CUR_VER"
else
  echo "[1/6] Prisma version OK (bukan 7.x)"
fi

# 2. Hapus cache Prisma lama
echo ""
echo "[2/6] Bersihkan cache Prisma & Next.js..."
rm -rf node_modules/.prisma 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf .next 2>/dev/null || true
echo "    Cache dibersihkan"

# 3. Cek OpenSSL version
echo ""
echo "[3/6] Cek OpenSSL version..."
if command -v openssl &> /dev/null; then
  OPENSSL_VER=$(openssl version 2>/dev/null | head -1)
  echo "    $OPENSSL_VER"
else
  echo "    OpenSSL tidak terinstall"
  echo "    Install dengan: pkg install openssl-tool"
  echo "    Lanjut setup dulu, install nanti kalau masih error..."
fi

# 4. Generate Prisma client dengan engine library (bukan native binary)
#    Ini fix utama untuk Termux android-arm64
echo ""
echo "[4/6] Generate Prisma client dengan engine library..."
echo "    (PRISMA_CLIENT_ENGINE_TYPE=library — fix android-arm64)"

# Set env vars untuk generate
export PRISMA_CLIENT_ENGINE_TYPE=library
export PRISMA_ENGINES_MIRROR=https://binaries.prisma.sh

npx prisma generate 2>&1 | tail -15

# 5. Cek hasil generate
echo ""
echo "[5/6] Cek hasil generate Prisma client..."
if [ -d "node_modules/.prisma/client" ]; then
  echo "    ✓ Prisma client ter-generate"
  ls node_modules/.prisma/client/ 2>&1 | head -5
else
  echo "    [!] Folder .prisma/client tidak ditemukan — generate gagal"
  echo "    Coba: PRISMA_CLIENT_ENGINE_TYPE=library npx prisma generate --force-reset"
fi

# 6. Test Prisma bisa dipakai
echo ""
echo "[6/6] Test Prisma client..."
node -e "
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';
const { PrismaClient } = require('@prisma/client');
try {
  const p = new PrismaClient();
  console.log('    ✓ PrismaClient berhasil di-instantiate');
  p.\$connect().then(() => {
    console.log('    ✓ Berhasil connect ke database');
    p.\$disconnect();
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
echo "Kalau masih error:"
echo "  1. Pastikan .env ada dan DATABASE_URL benar"
echo "  2. Cek: cat .env | grep DATABASE_URL"
echo "  3. Reset total: rm -rf node_modules .next && bash install-termux.sh"
echo ""
echo "Tip: kalau di log masih muncul 'Prisma 7', hapus package-lock.json dulu:"
echo "  rm package-lock.json && npm install prisma@6.11.1 @prisma/client@6.11.1 --save-exact"
