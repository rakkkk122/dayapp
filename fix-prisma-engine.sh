#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# FIX-PRISMA-ENGINE.SH — Fix architecture mismatch Prisma di Termux
# ============================================================
# Untuk error:
#   "libquery_engine-*.so.node is for EM_X86_64 instead of EM_AARCH64"
#   "library 'libgcc_s.so.1' not found: needed by libquery_engine-*.so.node"
#   "Cannot find module '.prisma/client/default'"
# ============================================================
set -e

echo "============================================"
echo "  Fix Prisma Engine Architecture Mismatch"
echo "============================================"
echo ""

cd "$(dirname "$0")"

# 1. Cek architecture
echo "[1/8] Cek system architecture..."
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
  TARGET_PATTERN="linux-arm64"
  WRONG_PATTERN="debian"
fi

# 2. Install system dependencies yang dibutuhkan binary Prisma
#    libgcc_s.so.1 = C++ runtime library (tidak ada default di Termux Android)
echo ""
echo "[2/8] Install system dependencies untuk Prisma binary..."

# Cek apakah libgcc_s.so.1 sudah ada
if [ -f "/data/data/com.termux/files/usr/lib/libgcc_s.so.1" ]; then
  echo "    ✓ libgcc_s.so.1 sudah ada"
else
  echo "    [i] libgcc_s.so.1 belum ada — install..."
  # Package yang berisi libgcc_s.so.1 di Termux:
  # - libgcc (utama)
  # - libc++ (C++ standard library, dibutuhkan untuk dlopen C++ binary)
  pkg install libgcc libc++ -y 2>&1 | tail -5 || true

  # Cek lagi
  if [ -f "/data/data/com.termux/files/usr/lib/libgcc_s.so.1" ]; then
    echo "    ✓ libgcc_s.so.1 berhasil diinstall"
  else
    echo "    [!] libgcc_s.so.1 masih tidak ditemukan"
    echo "    Coba manual: pkg install libgcc"
    echo "    Atau: pkg install libgcc libc++ libstdc++"
    # Lanjut saja, mungkin error nanti
  fi
fi

# 3. Pastikan @prisma/engines package ada
echo ""
echo "[3/8] Cek @prisma/engines package..."
if [ -d "node_modules/@prisma/engines" ]; then
  echo "    ✓ @prisma/engines package ada"
else
  echo "    [!] @prisma/engines package hilang — reinstall..."
  npm install @prisma/engines --no-audit --no-fund 2>&1 | tail -3
fi

# 4. Pastikan @prisma/client package ada
echo ""
echo "[4/8] Cek @prisma/client package..."
if [ -d "node_modules/@prisma/client" ]; then
  echo "    ✓ @prisma/client package ada"
else
  echo "    [!] @prisma/client package hilang — reinstall..."
  npm install @prisma/client@6.11.1 --save-exact --no-audit --no-fund 2>&1 | tail -3
fi

# 5. Hapus cache .prisma lama
echo ""
echo "[5/8] Hapus cache .prisma lama..."
rm -rf node_modules/.prisma 2>/dev/null || true
echo "    ✓ Cache dihapus"

# 6. Generate Prisma client
echo ""
echo "[6/8] Generate Prisma client..."
echo "    Schema akan download binary untuk arm64 + debian"
echo "    (4 binary total, masing-masing ~5MB)"
echo ""

# Prisma 6 tidak punya flag --force-reset, jadi cukup `prisma generate`
PRISMA_CLIENT_ENGINE_TYPE=library npx prisma generate 2>&1 | tail -15

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

# 7. HAPUS binary salah architecture
echo ""
echo "[7/8] Hapus binary yang salah architecture..."
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

# Cek binary yang tersisa
REMAINING=$(find node_modules/.prisma/client -name "libquery_engine-*.so.node" 2>/dev/null | head -5)
echo ""
echo "    Binary yang tersisa (akan dipakai Prisma):"
if [ -n "$REMAINING" ]; then
  echo "$REMAINING" | sed 's/^/      /'
  FIRST_BIN=$(echo "$REMAINING" | head -1)
  ABS_PATH="$(pwd)/$FIRST_BIN"
  echo ""
  echo "    Set env var:"
  echo "      PRISMA_QUERY_ENGINE_LIBRARY=$ABS_PATH"
else
  echo "    [!] TIDAK ada binary tersisa — generate mungkin gagal"
  exit 1
fi

# 8. Test Prisma
echo ""
echo "============================================"
echo "  Test Prisma..."
echo "============================================"
# Pastikan LD_LIBRARY_PATH termasuk Termux lib folder (untuk libgcc_s.so.1)
export LD_LIBRARY_PATH="/data/data/com.termux/files/usr/lib:${LD_LIBRARY_PATH:-}"
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
    console.log('Sekarang jalankan:');
    console.log('  bash start-termux.sh');
    console.log('');
    console.log('Lalu buka browser: http://localhost:3000');
    process.exit(0);
  })
  .catch((e) => {
    console.log('');
    console.log('    [!] GAGAL:', e.message);
    console.log('');
    if (e.message.includes('libgcc_s.so.1') || e.message.includes('library')) {
      console.log('    Library sistem kurang. Coba install:');
      console.log('    pkg install libgcc libc++ libstdc++');
      console.log('');
      console.log('    Lalu set LD_LIBRARY_PATH:');
      console.log('    export LD_LIBRARY_PATH=/data/data/com.termux/files/usr/lib');
      console.log('');
      console.log('    Dan jalankan ulang script ini.');
    } else if (e.message.includes('EM_X86_64') || e.message.includes('AARCH64')) {
      console.log('    Arch mismatch masih terjadi. Coba:');
      console.log('    export PRISMA_QUERY_ENGINE_LIBRARY=$ABS_PATH');
    }
    process.exit(1);
  });
"
