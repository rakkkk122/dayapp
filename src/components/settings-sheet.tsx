'use client'

import * as React from 'react'
import {
  Settings,
  Download,
  Upload,
  Database,
  Smartphone,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SettingsSheetProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  onChanged?: () => void
}

export function SettingsSheet({ open, onOpenChange, onChanged }: SettingsSheetProps) {
  const [importMode, setImportMode] = React.useState<'merge' | 'replace'>('merge')
  const [busy, setBusy] = React.useState<'export' | 'import' | null>(null)
  const [installPrompt, setInstallPrompt] = React.useState<any>(null)
  const [isInstalled, setIsInstalled] = React.useState(false)
  const [swState, setSwState] = React.useState<'unsupported' | 'registering' | 'active' | 'error'>(
    'unsupported'
  )
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Capture PWA install prompt event
  React.useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    const onInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
      toast.success('Aplikasi terpasang!')
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    // Detect if already installed (standalone)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  // Check SW state
  React.useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      setSwState('unsupported')
      return
    }
    setSwState('registering')
    navigator.serviceWorker
      .getRegistration('/sw.js')
      .then((reg) => {
        if (reg) setSwState('active')
        else {
          // Try to register
          navigator.serviceWorker
            .register('/sw.js', { scope: '/' })
            .then(() => setSwState('active'))
            .catch(() => setSwState('error'))
        }
      })
      .catch(() => setSwState('error'))
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) {
      toast.info('Gunakan menu browser → "Tambahkan ke Layar Utama" / "Install app"')
      return
    }
    installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice?.outcome === 'accepted') {
      setInstallPrompt(null)
    }
  }

  const handleExport = async () => {
    setBusy('export')
    try {
      const res = await fetch('/api/backup/export')
      if (!res.ok) throw new Error('Export gagal')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const stamp = new Date().toISOString().slice(0, 10)
      a.download = `dailylife-backup-${stamp}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Backup berhasil diunduh')
    } catch (e: any) {
      toast.error(`Export gagal: ${e.message}`)
    } finally {
      setBusy(null)
    }
  }

  const handleImportFile = async (file: File) => {
    setBusy('import')
    try {
      const text = await file.text()
      let parsed: any
      try {
        parsed = JSON.parse(text)
      } catch {
        throw new Error('File bukan JSON valid')
      }
      if (!parsed?.data) {
        throw new Error('Format backup tidak dikenali (missing `data`)')
      }

      const res = await fetch('/api/backup/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: importMode, data: parsed.data }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Import gagal')
      }
      const total = Object.values(json.inserted).reduce(
        (a: number, b: any) => a + (typeof b === 'number' ? b : 0),
        0
      ) as number
      toast.success(
        `Import selesai: ${total} record ditambahkan, ${json.skipped} dilewati`
      )
      onChanged?.()
      onOpenChange(false)
    } catch (e: any) {
      toast.error(`Import gagal: ${e.message}`)
    } finally {
      setBusy(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto no-scrollbar"
      >
        <SheetHeader>
          <SheetTitle className="text-left flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Pengaturan
          </SheetTitle>
          <SheetDescription className="text-left">
            Backup data, pasang sebagai aplikasi, dan info sistem
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 pt-3 space-y-5">
          {/* ===== Backup / Restore ===== */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Backup & Restore Data</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Ekspor seluruh data Anda ke file JSON untuk backup atau migrasi ke perangkat lain.
              Impor untuk mengembalikan dari file backup.
            </p>

            <div className="space-y-2">
              <Button
                onClick={handleExport}
                disabled={busy !== null}
                variant="default"
                className="w-full gap-2"
              >
                <Download className="h-4 w-4" />
                {busy === 'export' ? 'Mengekspor...' : 'Ekspor Backup (JSON)'}
              </Button>

              <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/30">
                <Label className="text-xs font-medium">Mode Impor</Label>
                <RadioGroup
                  value={importMode}
                  onValueChange={(v) => setImportMode(v as 'merge' | 'replace')}
                  className="grid grid-cols-2 gap-2"
                >
                  <label
                    className={cn(
                      'flex items-start gap-2 rounded-md border p-2 cursor-pointer transition-colors',
                      importMode === 'merge'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent/30'
                    )}
                  >
                    <RadioGroupItem value="merge" className="mt-0.5" />
                    <div>
                      <div className="text-xs font-medium">Gabung</div>
                      <div className="text-[10px] text-muted-foreground">
                        Tambah record baru, lewati yang sudah ada
                      </div>
                    </div>
                  </label>
                  <label
                    className={cn(
                      'flex items-start gap-2 rounded-md border p-2 cursor-pointer transition-colors',
                      importMode === 'replace'
                        ? 'border-destructive bg-destructive/5'
                        : 'border-border hover:bg-accent/30'
                    )}
                  >
                    <RadioGroupItem value="replace" className="mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-destructive">
                        Ganti Total
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Hapus SEMUA data, lalu isi dari file
                      </div>
                    </div>
                  </label>
                </RadioGroup>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleImportFile(f)
                  }}
                />

                {importMode === 'replace' ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full gap-2"
                        disabled={busy !== null}
                      >
                        <Upload className="h-4 w-4" />
                        {busy === 'import' ? 'Mengimpor...' : 'Pilih File & Ganti Total'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Konfirmasi Ganti Total
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          SEMUA data Anda saat ini akan dihapus permanen dan diganti
                          dengan isi file backup. Aksi ini tidak bisa dibatalkan.
                          Pastikan file backup benar.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Ya, Ganti Total
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full gap-2"
                    disabled={busy !== null}
                  >
                    <Upload className="h-4 w-4" />
                    {busy === 'import' ? 'Mengimpor...' : 'Pilih File Backup'}
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* ===== PWA Install ===== */}
          <section className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Pasang sebagai Aplikasi (PWA)</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Pasang DailyLife ke layar utama HP/desktop agar tampil seperti aplikasi native
              (fullscreen, ikon sendiri, bisa dibuka offline).
            </p>
            {isInstalled ? (
              <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 p-2.5 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Aplikasi sudah terpasang di perangkat ini.
              </div>
            ) : (
              <Button
                onClick={handleInstall}
                variant="outline"
                className="w-full gap-2"
                disabled={!installPrompt}
              >
                <Smartphone className="h-4 w-4" />
                {installPrompt ? 'Pasang Aplikasi' : 'Tunggu prompt install browser'}
              </Button>
            )}
            {!installPrompt && !isInstalled && (
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                Tip: Di Chrome/Edge → menu (⋮) → <b>Install app</b> / <b>Add to Home screen</b>.
                Di Safari iOS → tombol Share → <b>Add to Home Screen</b>.
              </p>
            )}
          </section>

          {/* ===== System Info ===== */}
          <section className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Info Sistem</h3>
            </div>
            <div className="space-y-1.5 text-xs">
              <Row label="Versi App" value="v1.0.0" />
              <Row
                label="Service Worker"
                value={
                  swState === 'active'
                    ? 'Aktif (offline OK)'
                    : swState === 'registering'
                    ? 'Mendaftarkan...'
                    : swState === 'error'
                    ? 'Gagal'
                    : 'Tidak didukung'
                }
                valueClass={
                  swState === 'active'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : swState === 'error'
                    ? 'text-destructive'
                    : ''
                }
              />
              <Row
                label="Storage"
                value="SQLite Lokal"
                valueClass="text-muted-foreground"
              />
              <Row
                label="Tipe"
                value="Self-hosted / Termux"
                valueClass="text-muted-foreground"
              />
            </div>
          </section>

          <div className="pt-2 border-t border-border">
            <Button
              variant="ghost"
              className="w-full text-xs text-muted-foreground"
              onClick={() => onOpenChange(false)}
            >
              Tutup
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Row({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium', valueClass)}>{value}</span>
    </div>
  )
}

export { Settings, RefreshCw }
