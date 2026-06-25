# Daily Life Manager

Aplikasi self-hosted untuk manajemen kehidupan harian: tugas, reminder, rencana, gym, makanan, kerja, dan AI Assistant. Dibangun dengan Next.js 16 + SQLite, jalan di Termux Android, Raspberry Pi, VPS, atau PC.

## ✨ Fitur

### 7 Modul Utama
- **🏠 Beranda** — dashboard ringkasan harian: tugas hari ini, reminder akan datang, kalori, gym mingguan, progres rencana
- **✅ Tugas** — to-do dengan prioritas (tinggi/sedang/rendah), kategori, tenggat waktu, filter (semua/hari ini/pending/selesai)
- **🔔 Reminder** — pengingat dengan datetime + pengulangan (harian/mingguan/bulanan)
- **🎯 Rencana** — target jangka panjang dengan milestone + progress bar otomatis
- **💪 Gym** — sesi latihan (strength/cardio/flexibility/sport) + exercise (set/rep/kg)
- **🍜 Makanan** — log makanan harian dengan kalori + makro (protein/carbs/fats) + target
- **💼 Kerja** — proyek + timer sesi fokus (start/stop, riwayat per proyek)

### 🤖 AI Assistant (powered by ZAI / GLM-4)
- **Saran Makanan** — AI analisis food log 7 hari + sisa kalori + gym → beri 3-4 saran makanan Indonesia
- **Buat Rencana** — input goal + timeframe → AI generate plan lengkap dengan 3-6 milestone SMART
- **Insight** — AI analisis SEMUA data 30 hari → temukan pola + rekomendasi konkret

### 📱 PWA (Progressive Web App)
- Installable ke layar utama (Android/iOS/desktop)
- Offline support (service worker cache app shell + API stale-while-revalidate)
- Icon native (192/512/maskable/apple-touch)
- App shortcuts (Tugas, Tambah Tugas, Makanan)

### 💾 Backup & Restore
- Export seluruh data ke JSON
- Import dengan mode **Merge** (tambah, skip duplikat) atau **Replace** (hapus semua, isi dari file)
- Settings sheet dengan tombol export/import + info sistem

### 🎨 UI/UX
- **Dark & Light mode** (auto detect system, bisa manual toggle)
- **Mobile-first** dengan bottom navigation 8-tab (mobile) + sidebar (desktop)
- **Touch-friendly** — semua tombol min 40×40px, FAB 56×56px
- **Responsive** — bekerja di 360px (Android kecil) sampai 1920px+ (desktop besar)
- **Animasi smooth** (Framer Motion)
- **Safe area insets** untuk notch/dynamic island iOS

---

## 🚀 Cara Install di Termux Android

### Prasyarat
- HP Android dengan Termux terinstall (download dari [F-Droid](https://f-droid.org/packages/com.termux/) — versi Play Store sudah deprecated)
- Min Android 7.0, RAM 2GB+ (4GB+ untuk AI)
- ~500MB free storage

### Langkah Install

```bash
# 1. Buka Termux, install Node.js & git
pkg update && pkg upgrade
pkg install nodejs-lts git

# 2. Clone project (atau copy folder kalau sudah ada)
git clone <url-repo-anda> dailylife
cd dailylife

# 3. Jalankan installer
bash install-termux.sh
```

Installer akan otomatis:
- Install dependencies (`npm install`)
- Buat file `.env` dengan path absolut
- Init database SQLite (`prisma db push`)

### Menjalankan

```bash
# Mode development (ada hot-reload, cocok untuk testing)
bash start-termux.sh

# Mode production (lebih cepat & hemat baterai, untuk daily use)
bash build-termux.sh    # build sekali
bash start-prod.sh      # jalankan
```

Buka browser HP → `http://localhost:3000`

### ⚠️ Penting untuk Termux Android

Script `start-termux.sh` sudah otomatis menangani 3 masalah umum di Android:

1. **Turbopack tidak support android/arm64** → otomatis pakai `--webpack`
2. **Prisma client tidak ter-generate** → otomatis jalankan `prisma generate` sebelum start
3. **Watchpack EACCES errors** → otomatis set `WATCHPACK_POLLING=true`

**JANGAN jalankan `npm run dev` langsung di Termux** — akan pakai Turbopack yang crash. Selalu pakai `bash start-termux.sh`.

### Kalau sudah pernah install tapi error Prisma

```bash
# Jalankan script fix khusus
bash fix-prisma.sh

# Atau reset total kalau masih gagal
rm -rf node_modules .next
bash install-termux.sh
```

### Akses dari Device Lain di WiFi

Script start otomatis bind ke `0.0.0.0`, jadi bisa diakses dari:
- Browser HP lain di WiFi yang sama: `http://[IP-HP-Anda]:3000`
- Cek IP dengan `ifconfig` di Termux (cari `inet` address)

---

## 💻 Install di PC / Linux / Mac / Windows

### Prasyarat
- Node.js 18+ (download dari [nodejs.org](https://nodejs.org))
- npm atau bun

### Langkah

```bash
# Clone & install
git clone <url-repo-anda> dailylife
cd dailylife
npm install

# Setup env
cp .env.example .env
# Edit .env, sesuaikan DATABASE_URL kalau perlu

# Init database
npx prisma db push

# Jalankan
npm run dev
```

Buka browser → `http://localhost:3000`

---

## 🤖 Setup AI Assistant

AI Assistant pakai `z-ai-web-dev-sdk` yang membutuhkan API key.

### Opsi 1: Z.ai Free Tier (gratis, paling mudah)
1. Daftar di [z.ai](https://z.ai) (gratis)
2. Buat API key di dashboard
3. Tambahkan ke `.env`:
   ```
   ZAI_API_KEY=your_key_here
   ```
4. Restart server

### Opsi 2: Tanpa AI (fitur lain tetap jalan)
Kalau tidak setup API key, fitur AI akan return error 500 tapi fitur lain (tasks, reminders, plans, gym, food, work) tetap jalan normal.

### Opsi 3: Provider lain (Ollama, Groq, OpenRouter)
Edit `src/lib/ai.ts` untuk ganti provider. Struktur kodenya sudah modular.

---

## 📱 Install sebagai PWA (Home Screen App)

Setelah server jalan:

### Android (Chrome/Edge)
1. Buka `http://localhost:3000` di browser
2. Menu ⋮ → **Install app** / **Add to Home screen**
3. App muncul di app drawer dengan icon sendiri
4. Buka seperti app biasa (fullscreen, no browser chrome)

### iOS (Safari)
1. Buka `http://localhost:3000`
2. Tombol Share → **Add to Home Screen**
3. App muncul di home screen

### Desktop (Chrome/Edge)
1. Klik ikon install di address bar
2. App jalan di window sendiri

### Atau lewat Settings Sheet
Buka app → klik ⚙️ Settings → **Pasang sebagai Aplikasi**

---

## 📂 Struktur Project

```
dailylife/
├── prisma/
│   └── schema.prisma          # Skema database (9 model)
├── db/
│   └── custom.db              # SQLite database (auto-created)
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker (offline cache)
│   ├── favicon.ico
│   └── icons/                 # PWA icons (192, 512, maskable, apple-touch)
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (PWA meta + SW register)
│   │   ├── page.tsx           # Main page (nav + view switcher)
│   │   ├── globals.css        # Theme (emerald primary, dark/light)
│   │   └── api/
│   │       ├── tasks/         # CRUD tugas
│   │       ├── reminders/     # CRUD reminder
│   │       ├── plans/         # CRUD plan + milestones
│   │       ├── milestones/    # CRUD milestone
│   │       ├── gym/           # CRUD workout + exercise
│   │       ├── food/          # CRUD food log
│   │       ├── work/          # CRUD project + session
│   │       ├── backup/        # Export/import JSON
│   │       ├── dashboard/     # Aggregated stats
│   │       └── ai/            # AI endpoints (food-suggest, plan-generate, insights)
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── views/             # 8 view (dashboard, tasks, reminders, plans, gym, food, work, ai)
│   │   ├── nav-shell.tsx      # Sidebar + BottomNav
│   │   ├── settings-sheet.tsx # Backup/restore + PWA install + system info
│   │   ├── theme-provider.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── sw-register.tsx    # Service worker registration
│   │   └── common/quick-add.tsx
│   ├── lib/
│   │   ├── db.ts              # Prisma client
│   │   ├── ai.ts              # ZAI SDK helper (retry + JSON parser)
│   │   └── utils.ts           # Date format, helpers
│   └── store/
│       └── ui-store.ts        # Zustand (active view)
├── scripts/
│   └── gen-icons.py           # Generator PWA icons
├── .env.example
├── install-termux.sh          # Installer untuk Termux
├── start-termux.sh            # Run dev server (Termux)
├── build-termux.sh            # Build production (Termux)
├── start-prod.sh              # Run production server (Termux)
└── package.json
```

---

## 🗄️ Database Schema

9 model Prisma (SQLite):

| Model | Deskripsi |
|---|---|
| `Task` | Tugas dengan prioritas, kategori, tenggat, status |
| `Reminder` | Pengingat dengan datetime + repeat |
| `Plan` | Rencana/target jangka panjang |
| `PlanMilestone` | Milestone dari plan (1:N) |
| `GymWorkout` | Sesi latihan (type, duration) |
| `GymExercise` | Exercise dalam workout (1:N) |
| `FoodLog` | Log makanan dengan makro |
| `WorkProject` | Proyek kerja |
| `WorkSession` | Sesi fokus kerja (1:N) |

Semua data tersimpan lokal di `db/custom.db` (SQLite). Tidak ada cloud, tidak ada server eksternal.

---

## 🛠️ Troubleshooting

### ⚠️ Error: "is for EM_X86_64 (62) instead of EM_AARCH64 (183)" — Architecture Mismatch

**Gejala**:
- API return 500 error
- Log: `Unable to require(.../libquery_engine-debian-openssl-1.1.x.so.node)`
- Log: `is for EM_X86_64 (62) instead of EM_AARCH64 (183)`
- Log: `The Prisma engines do not seem to be compatible with your system`

**Akar Penyebab**: Prisma auto-detect platform Android sebagai "linux" lalu download binary untuk **x86_64** (Intel/AMD), padahal HP Android adalah **ARM64**. Binary tidak bisa di-load.

**Solusi**: Pakai **engine library (WASM)** yang tidak butuh native binary sama sekali.

```bash
# Jalankan script fix khusus
bash fix-prisma-engine.sh
```

**Atau manual**:
```bash
# 1. Hapus semua binary native lama
rm -rf node_modules/.prisma node_modules/@prisma/engines

# 2. Pastikan schema.prisma punya engineType = "library"
#    (kalau belum, edit prisma/schema.prisma, tambahkan di generator block):
#    generator client {
#      provider   = "prisma-client-js"
#      engineType = "library"
#    }

# 3. Set env var dan generate ulang
export PRISMA_CLIENT_ENGINE_TYPE=library
npx prisma generate --force-reset

# 4. Verify tidak ada .so.node
find node_modules/.prisma -name "*.so.node"  # harus kosong

# 5. Test
node -e "new (require('@prisma/client').PrismaClient)().\$connect().then(()=>console.log('OK'))"

# 6. Jalankan app
bash start-termux.sh
```

**Kenapa engine library lebih baik untuk Termux?**
- Native binary (`.so.node`) Prisma tidak tersedia untuk android-arm64
- Engine library pakai WASM/JS — jalan di semua platform
- Sedikit lebih lambat (10-20%) tapi 100% kompatibel
- Tidak perlu download binary besar (library engine ~10MB vs native binary ~50MB per platform)

Schema.prisma dan script `start-termux.sh` versi baru sudah otomatis pakai engine library.

---

### ⚠️ Error: "@prisma/client did not initialize yet" atau "prisma schema validation"

**Akar Penyebab**: Project ini pakai **Prisma 6.11.1**, tapi `npm install` di Termux Anda mungkin resolve ke **Prisma 7.x** yang punya breaking changes (datasource `url` tidak lagi didukung, dll).

Ciri-ciri Prisma 7 terpasang:
- Error: `the datasource property 'url' is no longer supported in schema files`
- Error: `prisma schema validation - get-config-wasm`
- Error: `move connection urls to 'prisma.config.ts'`
- `npx prisma --version` menunjukkan `7.x.x`

**Solusi Cepat**:
```bash
# Jalankan script fix khusus (auto-detect & downgrade Prisma 7)
bash fix-prisma.sh
```

**Solusi Manual — Downgrade ke Prisma 6**:
```bash
# 1. Hapus Prisma 7 + cache
rm -rf node_modules/prisma node_modules/@prisma node_modules/.prisma
rm -f package-lock.json bun.lock

# 2. Install Prisma 6 exact version (pinned)
npm install prisma@6.11.1 @prisma/client@6.11.1 --save-exact --no-audit --no-fund

# 3. Verify version (harus 6.11.1)
node -p "require('./node_modules/prisma/package.json').version"

# 4. Generate client dengan engine library (penting untuk android-arm64)
PRISMA_CLIENT_ENGINE_TYPE=library npx prisma generate

# 5. Test
node -e "const {PrismaClient}=require('@prisma/client'); new PrismaClient().\$connect().then(()=>console.log('OK'))"

# 6. Jalankan app
bash start-termux.sh
```

**Kenapa pakai `PRISMA_CLIENT_ENGINE_TYPE=library`?**
Prisma default-nya pakai native binary engine (file `.so.node`) yang sering tidak tersedia untuk android-arm64. Engine "library" pakai WASM/JS yang bekerja di semua platform.

Script `start-termux.sh` dan `fix-prisma.sh` sudah otomatis set env var ini.

---

### ⚠️ Error: "_interop_require_wildcard is not a function" / halaman blank berkedip

**Gejala**:
- Halaman web blank putih / berkedip cepat
- Browser console error: `_interop_require_wildcard is not a function`
- Call stack: `app-pages-browser/./node_modules/next/dist/client/router.js`
- Di Termux: `GET / 200` (server OK, tapi client error)

**Akar Penyebab** (salah satu dari):
1. **Node.js versi terlalu lama** — Next.js 16 butuh Node.js 18.18+ (recommended 20+)
2. **Cache `.next/dev` corrupt** — chunk JS partial/rusak
3. **Service Worker cache chunk lama** — SW menyimpan versi lama yang konflik dengan dev server

**Diagnosa cepat**:
```bash
bash diagnose.sh
```
Lihat output — terutama bagian Node.js version dan installed versions.

**Solusi 1: Cek & upgrade Node.js** (paling sering)
```bash
node --version
# Kalau < 18, upgrade:
pkg install nodejs-lts
# Verify
node --version  # harus >= 18.18, recommended 20+

# Restart app
bash start-termux.sh
```

**Solusi 2: Clear browser cache** (wajib kalau pernah akses sebelumnya)
- Chrome → menu ⋮ → **History** → **Clear browsing data** → pilih **Cached images and files**
- Atau buka **incognito mode** untuk test apakah cache browser penyebabnya
- Atau Chrome → **Application** → **Service Workers** → **Unregister**
- Atau Chrome → **Application** → **Storage** → **Clear site data**

**Solusi 3: Clear .next cache di Termux**
```bash
# Stop server dulu (Ctrl+C)
rm -rf .next
bash start-termux.sh
```

**Solusi 4: Reset total kalau semua gagal**
```bash
rm -rf .next node_modules/.cache
bash start-termux.sh
# Lalu di browser: clear cache + incognito mode
```

**Kenapa ini terjadi?**
- Next.js 16 + React 19 generate chunk JS yang sangat modern (ESM, async, dkk)
- Browser cache chunk lama dari sesi sebelumnya
- Saat dev server rebuild, hash chunk berubah, tapi browser masih load chunk lama dari cache
- Chunk lama reference function yang tidak ada di chunk baru → error

Script `start-termux.sh` versi baru sudah otomatis:
- Hapus `.next/cache` di awal start
- Skip SW registration di dev mode (SW hanya aktif di production)
- Unregister SW yang mungkin terpasang dari sesi production sebelumnya

---

### ⚠️ Error: "Turbopack is not supported for this platform (android/arm64)"

**Penyebab**: Next.js 16 default-nya pakai Turbopack (compiler Rust) yang tidak punya native binary untuk Android ARM64.

**Solusi**: Script `start-termux.sh` sudah otomatis pakai `--webpack` flag (compiler JavaScript). Kalau jalankan manual:

```bash
# ❌ JANGAN pakai ini di Termux:
npm run dev

# ✅ Pakai ini di Termux:
bash start-termux.sh
# atau manual:
npx next dev --webpack
```

---

### ⚠️ Error: "Watchpack Error (watcher): EACCES: permission denied, watch '/data'"

**Penyebab**: Webpack's file watcher (inotify) coba watch folder sistem Android (`/`, `/data`, `/data/data`) yang tidak bisa diakses Termux.

**Solusi**: Script `start-termux.sh` sudah set env vars:
- `WATCHPACK_POLLING=true` — pakai polling instead of inotify
- `CHOKIDAR_USEPOLLING=true` — same untuk chokidar

Error ini sebenarnya **tidak fatal** — app tetap jalan, tapi log berisik. Kalau sangat mengganggu, jalankan via `start-termux.sh` (bukan `npm run dev` langsung).

---

### Port 3000 sudah dipakai

Edit `.env`:
```
PORT=3001
```
Atau jalankan: `PORT=3001 bash start-termux.sh`

---

### Database corrupt / reset

```bash
# Stop server dulu (Ctrl+C)
rm db/custom.db
npx prisma db push
bash start-termux.sh
```

---

### Service worker tidak update (PWA cache lama)

- Buka DevTools (Chrome: F12 atau menu ⋮ → More tools → Developer tools)
- Tab **Application** → **Service Workers** → klik **Unregister**
- Tab **Application** → **Storage** → **Clear site data**
- Refresh page

Atau buka halaman dengan `?v=2` di URL untuk bypass cache.

---

### AI error 500 (endpoint `/api/ai/*`)

- Cek apakah `ZAI_API_KEY` ada di `.env` (atau otomatis disediakan platform)
- Cek log server di terminal tempat server jalan
- AI butuh internet, pastikan HP online
- Test koneksi: `curl https://api.z.ai/health`

Kalau tidak mau pakai AI, fitur lain (Tasks, Reminders, Plans, Gym, Food, Work) tetap jalan normal.

---

### Build gagal di Termux (memory/RAM kurang)

HP dengan RAM <3GB mungkin OOM saat build. Solusi:

```bash
# Tutup app lain dulu, lalu build dengan memory limit
NODE_OPTIONS="--max-old-space-size=512" bash build-termux.sh

# Atau pakai swap (butuh root atau Termux:Boot)
# Atau pakai mode dev saja (tidak perlu build)
bash start-termux.sh
```

---

### Tidak bisa diakses dari device lain di WiFi

- Pastikan kedua device di WiFi yang sama
- Cek IP HP: jalankan `ifconfig` di Termux, cari `inet` address (biasanya 192.168.x.x)
- Pastikan tidak ada firewall yang block port 3000
- Beberapa router mengaktifkan "Client Isolation" — cek router settings
- Pastikan jalankan dengan `bash start-termux.sh` (bukan `--local` flag)

---

### Backup file tidak bisa di-import

- Pastikan file adalah JSON valid: `cat backup.json | python3 -m json.tool`
- Pastikan format sesuai (ada field `data` dengan array per model)
- Coba mode "Merge" dulu (lebih aman dari "Replace")

---

### App lemot / baterai cepat habis

- Pakai **mode production** (build sekali, jalankan berkali-kali):
  ```bash
  bash build-termux.sh
  bash start-prod.sh
  ```
- Matikan AI features kalau tidak dipakai (edit `.env`, kosongkan `ZAI_API_KEY`)
- Tutup app lain yang berat
- Pakai wake-lock hanya saat perlu: `termux-wake-release` untuk matikan

---

### Permission denied saat install

```bash
# Beri permission execute ke semua script
chmod +x *.sh

# Atau jalankan dengan bash eksplisit
bash install-termux.sh
```

---

## 🔒 Privasi & Keamanan

- ✅ **Semua data lokal** — tidak ada cloud, tidak ada tracking
- ✅ **Tidak ada akun** — langsung pakai, tidak perlu login
- ✅ **AI privacy** — data dikirim ke ZAI API hanya saat Anda klik tombol AI. Tidak otomatis
- ⚠️ **Akses network** — kalau bind ke `0.0.0.0`, siapa saja di WiFi yang sama bisa akses. Untuk keamanan, gunakan `--local` saat di WiFi publik: `bash start-termux.sh --local`

---

## 📊 Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York)
- **Database**: Prisma ORM + SQLite
- **State**: Zustand (UI) + React hooks (data fetching)
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **AI**: z-ai-web-dev-sdk (GLM-4)
- **PWA**: next-pwa style (custom service worker)
- **Forms**: react-hook-form + zod
- **Charts**: Recharts

---

## 📜 Scripts

| Command | Deskripsi |
|---|---|
| `npm run dev` | Jalankan dev server (hot reload) |
| `npm run build` | Build production |
| `npm run start` | Jalankan production server |
| `npm run lint` | Cek code quality |
| `npx prisma db push` | Sync schema ke database |
| `npx prisma studio` | Buka GUI untuk lihat/edit data |
| `python3 scripts/gen-icons.py` | Regenerate PWA icons |

---

## 🎯 Roadmap (fitur yang bisa ditambah)

- [ ] Notifikasi push (Web Push API + service worker)
- [ ] AI Chat general (tanya jawab bebas dengan konteks data)
- [ ] Auto-suggest reminder (AI belajar pola aktivitas)
- [ ] Sync antar device (self-hosted sync server)
- [ ] Multi-user (NextAuth + per-user data isolation)
- [ ] Widget Android (Termux:Tasker integration)
- [ ] Export ke CSV / Excel
- [ ] Statistik bulanan dengan grafik

---

## 📄 License

MIT — bebas pakai, modifikasi, distribusi.

---

## 🙏 Credits

Built with ❤️ using:
- [Next.js](https://nextjs.org)
- [Prisma](https://prisma.io)
- [shadcn/ui](https://ui.shadcn.com)
- [Z.ai](https://z.ai) untuk AI
- [Lucide](https://lucide.dev) untuk icons
