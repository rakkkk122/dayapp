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

# 2. Hapus cache Prisma client yang salah architecture
#    PENTING: JANGAN hapus node_modules/@prisma/engines — itu package npm!
#    Hanya hapus node_modules/.prisma (cache generated client)
echo ""
echo "[2/6] Hapus cache Prisma client yang salah architecture..."
echo "    File binary yang akan dihapus:"
find node_modules/.prisma/client -name "*.so.node" 2>/dev/null | head -5 || echo "    (tidak ada binary di .prisma)"

# Hanya hapus .prisma (cache), JANGAN hapus @prisma/engines (npm package)
rm -rf node_modules/.prisma 2>/dev/null || true
# Hapus juga cache Next.js yang mungkin cache binary lama
rm -rf .next/cache 2>/dev/null || true
echo "    ✓ Cache Prisma client dihapus"

# Cek apakah @prisma/engines package masih ada (harus ada)
if [ ! -d "node_modules/@prisma/engines" ]; then
  echo "    [!] @prisma/engines package hilang — reinstall..."
  npm install @prisma/engines --no-audit --no-fund 2>&1 | tail -3
fi

# 3. Set env vars untuk force library engine + ARM64 binary
echo ""
echo "[3/6] Set env vars untuk force ARM64 binary..."

# Deteksi architecture
ARCH=$(uname -m 2>/dev/null || echo "unknown")
echo "    Architecture: $ARCH"

export PRISMA_CLIENT_ENGINE_TYPE=library
export PRISMA_ENGINES_MIRROR=https://binaries.prisma.sh

# Cek apakah @prisma/engines package ada (harus ada — jangan dihapus!)
if [ ! -d "node_modules/@prisma/engines" ]; then
  echo "    [!] @prisma/engines package hilang — reinstall..."
  npm install @prisma/engines --no-audit --no-fund 2>&1 | tail -3
fi

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

# 5. Generate ulang Prisma client
echo ""
echo "[5/6] Generate Prisma client..."
echo "    Schema akan download binary untuk: native + linux-arm64-*"
echo ""

npx prisma generate --force-reset 2>&1 | tail -20

# Set PRISMA_QUERY_ENGINE_BINARY untuk ARM64
if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
  echo ""
  echo "    Cari binary ARM64 untuk di-paksa pakai..."
  for bin in "libquery_engine-linux-arm64-openssl-3.0.x.so.node" "libquery_engine-linux-arm64-openssl-1.1.x.so.node"; do
    if [ -f "node_modules/.prisma/client/$bin" ]; then
      export PRISMA_QUERY_ENGINE_BINARY="$(pwd)/node_modules/.prisma/client/$bin"
      echo "    ✓ Force engine binary: $PRISMA_QUERY_ENGINE_BINARY"
      break
    fi
  done
  if [ -z "$PRISMA_QUERY_ENGINE_BINARY" ]; then
    echo "    [!] Binary ARM64 tidak ditemukan setelah generate!"
    echo "    File yang ada di .prisma/client/:"
    ls node_modules/.prisma/client/ 2>/dev/null | head -10
  fi
fi

# 6. Verify binary ada
echo ""
echo "[6/6] Verify binary..."
SO_FILES=$(find node_modules/.prisma -name "*.so.node" 2>/dev/null | head -5)
if [ -z "$SO_FILES" ]; then
  echo "    [!] Tidak ada file .so.node — generate mungkin gagal"
else
  echo "    Binary yang ada:"
  echo "$SO_FILES" | sed 's/^/    /'
fi

# 7. Test Prisma bisa dipakai
echo ""
echo "============================================"
echo "  Test Prisma..."
echo "============================================"
node -e "
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';
if (process.env.PRISMA_QUERY_ENGINE_BINARY) {
  console.log('Using engine binary:', process.env.PRISMA_QUERY_ENGINE_BINARY);
}
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$connect()
  .then(() => {
    console.log('    ✓ Berhasil connect ke database!');
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
    if (e.message.includes('EM_X86_64') || e.message.includes('AARCH64')) {
      console.log('    Arch mismatch masih terjadi. Coba:');
      console.log('    export PRISMA_QUERY_ENGINE_BINARY=$(pwd)/node_modules/.prisma/client/libquery_engine-linux-arm64-openssl-3.0.x.so.node');
      console.log('    bash start-termux.sh');
    } else {
      console.log('Coba manual:');
      console.log('  rm -rf node_modules/.prisma');
      console.log('  npx prisma generate');
      console.log('  bash start-termux.sh');
    }
    process.exit(1);
  });
"
