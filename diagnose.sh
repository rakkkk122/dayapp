#!/data/data/com.termux/files/usr/bin/bash
# ============================================================
# DIAGNOSE.SH — Diagnosa masalah "blank page" / error client-side
# ============================================================
# Jalankan script ini untuk mengumpulkan info yang dibutuhkan
# untuk troubleshoot error seperti:
#   - "_interop_require_wildcard is not a function"
#   - Halaman blank/berkedip putih
#   - Error di browser console
#
# Cara pakai: bash diagnose.sh
# Lalu copy semua output dan kirim ke developer
# ============================================================

echo "============================================"
echo "  Daily Life Manager — Diagnosa"
echo "============================================"
echo ""
echo "Tanggal: $(date)"
echo ""

echo "===== 1. System Info ====="
echo "Termux: $(uname -a 2>/dev/null || echo '?')"
echo "Android: $(getprop ro.build.version.release 2>/dev/null || echo '?')"
echo "Arch: $(uname -m 2>/dev/null || echo '?')"
echo ""

echo "===== 2. Node.js & npm ====="
echo "Node path: $(which node 2>/dev/null || echo 'not found')"
echo "Node version: $(node --version 2>/dev/null || echo 'not installed')"
echo "npm version: $(npm --version 2>/dev/null || echo 'not installed')"
echo ""

echo "===== 3. Project versions ====="
if [ -f "package.json" ]; then
  echo "package.json:"
  node -e "
const pkg = require('./package.json');
console.log('  name:', pkg.name);
console.log('  next:', pkg.dependencies?.next || 'NOT FOUND');
console.log('  react:', pkg.dependencies?.react || 'NOT FOUND');
console.log('  prisma:', pkg.dependencies?.prisma || 'NOT FOUND');
console.log('  @prisma/client:', pkg.dependencies?.['@prisma/client'] || 'NOT FOUND');
" 2>/dev/null || echo "  (gagal baca package.json)"
else
  echo "[!] package.json tidak ditemukan — salah folder?"
  exit 1
fi
echo ""

echo "===== 4. Installed versions ====="
if [ -d "node_modules" ]; then
  for pkg in next react prisma @prisma/client; do
    if [ -f "node_modules/$pkg/package.json" ]; then
      VER=$(node -p "require('./node_modules/$pkg/package.json').version" 2>/dev/null || echo '?')
      echo "  $pkg: $VER"
    else
      echo "  $pkg: TIDAK TERPASANG"
    fi
  done
else
  echo "[!] node_modules tidak ada — jalankan: bash install-termux.sh"
  exit 1
fi
echo ""

echo "===== 5. .env check ====="
if [ -f ".env" ]; then
  echo "  .env ada"
  # Show only DATABASE_URL line (redact anything sensitive)
  grep -E "^DATABASE_URL=" .env 2>/dev/null | sed 's|/data/data/com.termux/files/home/|~/|' || echo "  DATABASE_URL tidak ditemukan di .env"
else
  echo "[!] .env tidak ada"
fi
echo ""

echo "===== 6. Database check ====="
if [ -f "db/custom.db" ]; then
  SIZE=$(stat -c %s db/custom.db 2>/dev/null || stat -f %z db/custom.db 2>/dev/null || echo '?')
  echo "  db/custom.db ada ($SIZE bytes)"
else
  echo "[!] db/custom.db TIDAK ada — jalankan: npx prisma db push"
fi
echo ""

echo "===== 7. .next cache check ====="
if [ -d ".next" ]; then
  echo "  .next folder ada"
  if [ -d ".next/cache" ]; then
    CACHE_SIZE=$(du -sh .next/cache 2>/dev/null | cut -f1 || echo '?')
    echo "  .next/cache: $CACHE_SIZE"
  fi
else
  echo "  .next folder belum ada (akan dibuat saat first dev run)"
fi
echo ""

echo "===== 8. Service Worker check ====="
echo "  (SW di-unregister otomatis di dev mode — tidak perlu cek manual)"
echo "  Tapi kalau pernah pakai production mode, SW mungkin masih terdaftar."
echo "  Clear via: Chrome → Application → Service Workers → Unregister"
echo ""

echo "===== 9. Network/port check ====="
echo "  Port 3000 status:"
if command -v netstat &> /dev/null; then
  netstat -tln 2>/dev/null | grep ":3000" || echo "    (port 3000 kosong)"
elif command -v ss &> /dev/null; then
  ss -tln 2>/dev/null | grep ":3000" || echo "    (port 3000 kosong)"
else
  echo "    netstat/ss tidak tersedia"
fi
echo ""

echo "===== 10. OpenSSL check ====="
if command -v openssl &> /dev/null; then
  echo "  OpenSSL: $(openssl version)"
else
  echo "[!] OpenSSL tidak terinstall — install dengan: pkg install openssl-tool"
fi
echo ""

echo "===== 11. Test fetch homepage ====="
echo "  Test http://localhost:3000..."
if command -v curl &> /dev/null; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000 2>/dev/null || echo "fail")
  if [ "$HTTP_CODE" = "200" ]; then
    echo "  ✓ HTTP 200 — server respond"
  elif [ "$HTTP_CODE" = "fail" ]; then
    echo "  [!] Server tidak jalan atau tidak respond"
  else
    echo "  [!] HTTP $HTTP_CODE — server ada error"
  fi
else
  echo "  curl tidak tersedia — install dengan: pkg install curl"
fi
echo ""

echo "===== 12. Test fetch API ====="
if command -v curl &> /dev/null; then
  HTTP_API=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000/api/tasks 2>/dev/null || echo "fail")
  if [ "$HTTP_API" = "200" ]; then
    echo "  ✓ API /api/tasks: 200 OK"
  elif [ "$HTTP_API" = "500" ]; then
    echo "  [!] API /api/tasks: 500 — Prisma error (cek: bash fix-prisma.sh)"
  elif [ "$HTTP_API" = "fail" ]; then
    echo "  [!] Server tidak jalan"
  else
    echo "  [!] API /api/tasks: $HTTP_API"
  fi
fi
echo ""

echo "============================================"
echo "  Diagnosa selesai!"
echo "============================================"
echo ""
echo "Langkah selanjutnya berdasarkan hasil di atas:"
echo ""
echo "A. Kalau Node.js < 18:"
echo "   pkg install nodejs-lts"
echo "   bash install-termux.sh"
echo ""
echo "B. Kalau Prisma version 7.x:"
echo "   bash fix-prisma.sh"
echo ""
echo "C. Kalau API return 500:"
echo "   bash fix-prisma.sh"
echo ""
echo "D. Kalau HTTP 200 tapi browser blank/kedip:"
echo "   1. Clear browser cache: Chrome → History → Clear browsing data"
echo "   2. Atau pakai incognito mode untuk test"
echo "   3. Atau Chrome → Application → Service Workers → Unregister"
echo "   4. Atau Chrome → Application → Storage → Clear site data"
echo "   5. Refresh halaman (Ctrl+Shift+R untuk hard reload)"
echo ""
echo "E. Kalau masih error:"
echo "   rm -rf .next node_modules/.cache"
echo "   bash start-termux.sh"
echo ""
