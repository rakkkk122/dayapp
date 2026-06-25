#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# FIX-PRISMA-ENGINE.SH — Fix architecture mismatch Prisma di Termux
# ============================================================
# Untuk error:
#   "libquery_engine-debian-openssl-1.1.x.so.node is for EM_X86_64 instead of EM_AARCH64"
#   "Cannot find module '.prisma/client/default'"
#
# Strategi:
#   1. Pastikan @prisma/engines package ada (npm install kalau hilang)
#   2. Hapus cache .prisma lama
#   3. prisma generate (download binary untuk arm64 + debian)
#   4. HAPUS binary salah architecture dari .prisma/client/
#      - Kalau di ARM64: hapus libquery_engine-debian-*
#      - Kalau di x86_64: hapus libquery_engine-linux-arm64-*
#   5. Set PRISMA_QUERY_ENGINE_LIBRARY ke binary yang tersisa
#   6. Test connection
# ============================================================
set -e

echo "============================================"
echo "  Fix Prisma Engine Architecture Mismatch"
echo "============================================"
echo ""

cd "$(dirname "$0")"

# 1. Cek architecture
echo "[1/7] Cek system architecture..."
ARCH=$(uname -m 2>/dev/null || echo "unknown")
echo "    Architecture: $ARCH"
if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
  echo "    ✓ ARM64 terdeteksi (HP Android umum)"
  TARGET_PATTERN="linux-arm64"
  WRONG_PATTERN="debian"
elif [[ "$ARCH" == "x86_64" || "$ARCH" == "x64" ]]; then
  echo "    ✓ x86_64 terdeteksi (PC/emulator)"
  TARGET_PATTERN="debian"
  WRONG_PATTERN="linux-arm64"
else
  echo "    [?] Architecture tidak dikenali: $ARCH"
  echo "    Asumsi: linux-arm64"
  TARGET_PATTERN="linux-arm64"
  WRONG_PATTERN="debian"
fi

# 2. Pastikan @prisma/engines package ada (PENTING — jangan dihapus!)
echo ""
echo "[2/7] Cek @prisma/engines package..."
if [ -d "node_modules/@prisma/engines" ]; then
  echo "    ✓ @prisma/engines package ada"
else
  echo "    [!] @prisma/engines package hilang — reinstall..."
  npm install @prisma/engines --no-audit --no-fund 2>&1 | tail -3
  if [ ! -d "node_modules/@prisma/engines" ]; then
    echo "    [!] Gagal install @prisma/engines"
    echo "    Coba manual: npm install @prisma/engines"
    exit 1
  fi
  echo "    ✓ @prisma/engines terinstall"
fi

# 3. Pastikan @prisma/client package ada
echo ""
echo "[3/7] Cek @prisma/client package..."
if [ -d "node_modules/@prisma/client" ]; then
  echo "    ✓ @prisma/client package ada"
else
  echo "    [!] @prisma/client package hilang — reinstall..."
  npm install @prisma/client@6.11.1 --save-exact --no-audit --no-fund 2>&1 | tail -3
fi

# 4. Hapus cache .prisma lama
echo ""
echo "[4/7] Hapus cache .prisma lama..."
rm -rf node_modules/.prisma 2>/dev/null || true
echo "    ✓ Cache dihapus"

# 5. Generate Prisma client
echo ""
echo "[5/7] Generate Prisma client..."
echo "    Schema akan download binary untuk arm64 + debian"
echo "    (4 binary total, masing-masing ~5MB)"
echo ""

# Prisma 6 tidak punya flag --force-reset, jadi cukup `prisma generate`
# (cache sudah dihapus di step 4, jadi ini generate dari nol)
PRISMA_CLIENT_ENGINE_TYPE=library npx prisma generate 2>&1 | tail -15

# Cek apakah generate berhasil
if [ ! -d "node_modules/.prisma/client" ]; then
  echo ""
  echo "    [!] Generate GAGAL — .prisma/client tidak ada"
  echo "    Coba jalankan manual untuk lihat error:"
  echo "    npx prisma generate"
  exit 1
fi

echo ""
echo "    File di .prisma/client/:"
ls node_modules/.prisma/client/ 2>/dev/null | head -10

# 6. HAPUS binary salah architecture
echo ""
echo "[6/7] Hapus binary yang salah architecture..."
echo "    Target pattern: *$TARGET_PATTERN* (KEEP)"
echo "    Wrong pattern:  *$WRONG_PATTERN*    (DELETE)"

WRONG_FILES=$(find node_modules/.prisma/client -name "libquery_engine-$WRONG_PATTERN*.so.node" 2>/dev/null)
if [ -n "$WRONG_FILES" ]; then
  echo "    File yang dihapus (salah arch):"
  echo "$WRONG_FILES" | sed 's/^/      /'
  echo "$WRONG_FILES" | xargs rm -f 2>/dev/null
  echo "    ✓ Binary salah arch dihapus"
else
  echo "    Tidak ada binary salah arch (sudah bersih)"
fi

# Cek binary yang tersisa (harus yang benar arch)
REMAINING=$(find node_modules/.prisma/client -name "libquery_engine-*.so.node" 2>/dev/null | head -5)
echo ""
echo "    Binary yang tersisa (akan dipakai Prisma):"
if [ -n "$REMAINING" ]; then
  echo "$REMAINING" | sed 's/^/      /'
  # Set env var PRISMA_QUERY_ENGINE_LIBRARY ke binary pertama yang tersisa
  FIRST_BIN=$(echo "$REMAINING" | head -1)
  ABS_PATH="$(pwd)/$FIRST_BIN"
  echo ""
  echo "    Set env var:"
  echo "      PRISMA_QUERY_ENGINE_LIBRARY=$ABS_PATH"
else
  echo "    [!] TIDAK ada binary tersisa — generate mungkin gagal"
  exit 1
fi

# 7. Test Prisma
echo ""
echo "============================================"
echo "  Test Prisma..."
echo "============================================"
PRISMA_QUERY_ENGINE_LIBRARY="$ABS_PATH" PRISMA_CLIENT_ENGINE_TYPE=library node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.\$connect()
  .then(() => {
    console.log('    ✓ Berhasil connect ke database!');
    return p.task.findMany({ take: 1 });
  })
  .then((tasks) => {
    console.log('    ✓ Query tasks OK, count:', tasks.length);
    return p.\$disconnect();
  })
  .then(() => {
    console.log('');
    console.log('============================================');
    console.log('  ✓ FIX BERHASIL!');
    console.log('============================================');
    console.log('');
    console.log('PENTING — sebelum jalankan app, set env var ini:')
    console.log('  export PRISMA_QUERY_ENGINE_LIBRARY=$ABS_PATH')
    console.log('')
    console.log('Atau langsung jalankan:')
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
      console.log('    Arch mismatch masih terjadi. Coba manual:');
      console.log('    export PRISMA_QUERY_ENGINE_LIBRARY=$ABS_PATH');
      console.log('    export PRISMA_CLIENT_ENGINE_TYPE=library');
      console.log('    node -e \"new (require(\\\"@prisma/client\\\").PrismaClient)().\\\$connect().then(()=>console.log(\\\"OK\\\"))\"');
    }
    process.exit(1);
  });
"
