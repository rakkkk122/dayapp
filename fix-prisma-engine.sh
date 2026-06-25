#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# FIX-PRISMA-ENGINE.SH — Fix error architecture mismatch
# ============================================================
# Untuk error:
#   "libquery_engine-debian-openssl-1.1.x.so.node is for EM_X86_64 (62) instead of EM_AARCH64 (183)"
#   "The Prisma engines do not seem to be compatible with your system"
#
# Penyebab: Prisma auto-detect Android sebagai "linux" lalu download
#           binary x86_64 (debian). Padahal HP Android adalah ARM64.
#
# Solusi: Pakai engine "library" (WASM) yang TIDAK butuh native binary.
#         Hapus semua binary .so.node lama dulu, lalu regenerate.
#
# Cara pakai: bash fix-prisma-engine.sh
# ============================================================
set -e

echo "============================================"
echo "  Fix Prisma Engine Architecture Mismatch"
echo "============================================"
echo ""

# 1. Cek architecture HP
echo "[1/6] Cek system architecture..."
ARCH=$(uname -m 2>/dev/null || echo "unknown")
echo "    Architecture: $ARCH"
if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
  echo "    ✓ ARM64 terdeteksi (HP Android umum)"
elif [[ "$ARCH" == "x86_64" || "$ARCH" == "x64" ]]; then
  echo "    [!] x86_64 terdeteksi — script ini untuk ARM64"
  echo "    Kalau Anda pakai emulator x86, ini tidak masalah"
else
  echo "    [?] Architecture tidak dikenali: $ARCH"
fi

# 2. Hapus SEMUA binary Prisma lama (yang salah architecture)
echo ""
echo "[2/6] Hapus SEMUA binary Prisma lama (yang salah architecture)..."
echo "    File yang dihapus:"
# List dulu file binary yang ada supaya user lihat
find node_modules/.prisma/client -name "*.so.node" 2>/dev/null | head -5 || echo "    (tidak ada binary)"
find node_modules/@prisma/engines -name "*.so.node" 2>/dev/null | head -5 || echo "    (tidak ada binary engine)"

# Hapus semua
rm -rf node_modules/.prisma 2>/dev/null || true
rm -rf node_modules/@prisma/engines 2>/dev/null || true
rm -rf node_modules/@prisma/client/node_modules 2>/dev/null || true
# Hapus juga cache Next.js yang mungkin cache binary lama
rm -rf .next/cache 2>/dev/null || true
echo "    ✓ Semua binary Prisma lama dihapus"

# 3. Set env vars untuk force library engine
echo ""
echo "[3/6] Set env vars untuk force library engine (WASM)..."
export PRISMA_CLIENT_ENGINE_TYPE=library
# Tambahan: bypass detection yang salah
export PRISMA_FORCE_PANIC_ACTION=js
# Mirror cepat untuk download
export PRISMA_ENGINES_MIRROR=https://binaries.prisma.sh

# 4. Verify schema.prisma sudah pakai engineType = "library"
echo ""
echo "[4/6] Verify schema.prisma..."
if grep -q 'engineType.*=.*"library"' prisma/schema.prisma; then
  echo "    ✓ schema.prisma sudah pakai engineType = \"library\""
else
  echo "    [!] schema.prisma belum pakai engineType = \"library\""
  echo "    Tambahkan baris berikut di generator block prisma/schema.prisma:"
  echo ""
  echo '    generator client {'
  echo '      provider  = "prisma-client-js"'
  echo '      engineType = "library"   // <-- TAMBAHKAN INI'
  echo '    }'
  echo ""
  echo "    Lalu jalankan ulang script ini."
  exit 1
fi

# 5. Generate ulang Prisma client dengan engine library
echo ""
echo "[5/6] Generate Prisma client dengan engine library (WASM)..."
echo "    Ini akan download library engine, BUKAN native binary"
echo "    Library engine ~10MB, working di semua architecture"
echo ""

npx prisma generate --force-reset 2>&1 | tail -20

# 6. Verify tidak ada .so.node lagi
echo ""
echo "[6/6] Verify binary .so.node sudah hilang..."
SO_FILES=$(find node_modules/.prisma -name "*.so.node" 2>/dev/null | head -3)
if [ -z "$SO_FILES" ]; then
  echo "    ✓ Tidak ada file .so.node (native binary) — engine library aktif!"
  echo ""
  echo "    File yang ada di .prisma/client:"
  ls node_modules/.prisma/client/ 2>/dev/null | head -10
else
  echo "    [!] Masih ada file .so.node:"
  echo "$SO_FILES"
  echo ""
  echo "    Hapus manual dan coba lagi:"
  echo "    rm -rf node_modules/.prisma"
  echo "    PRISMA_CLIENT_ENGINE_TYPE=library npx prisma generate --force-reset"
fi

# 7. Test Prisma bisa dipakai
echo ""
echo "============================================"
echo "  Test Prisma..."
echo "============================================"
node -e "
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$connect()
  .then(() => {
    console.log('    ✓ Berhasil connect ke database!');
    console.log('    ✓ Engine: library (WASM, no native binary)');
    return p.task.findMany({ take: 1 });
  })
  .then((tasks) => {
    console.log('    ✓ Query tasks berhasil, count:', tasks.length);
    return p.\$disconnect();
  })
  .then(() => {
    console.log('');
    console.log('============================================');
    console.log('  ✓ FIX BERHASIL!');
    console.log('============================================');
    console.log('');
    console.log('Sekarang jalankan app:');
    console.log('  bash start-termux.sh');
    console.log('');
    console.log('Lalu buka browser: http://localhost:3000');
    process.exit(0);
  })
  .catch((e) => {
    console.log('');
    console.log('    [!] GAGAL:', e.message);
    console.log('');
    console.log('Coba manual:');
    console.log('  rm -rf node_modules/.prisma');
    console.log('  PRISMA_CLIENT_ENGINE_TYPE=library npx prisma generate');
    console.log('  bash start-termux.sh');
    process.exit(1);
  });
"
