'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Trash2, Clock, Calendar, BellRing } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { QuickAdd, EmptyState, FloatingAddButton } from '@/components/common/quick-add'
import { toLocalInput, formatDateTime, relativeTime } from '@/lib/utils'

interface Reminder {
  id: string
  title: string
  notes: string | null
  datetime: string
  repeat: string | null
  done: boolean
}

const REPEATS = [
  { value: 'none', label: 'Sekali' },
  { value: 'daily', label: 'Harian' },
  { value: 'weekly', label: 'Mingguan' },
  { value: 'monthly', label: 'Bulanan' },
]

const REPEAT_LABEL: Record<string, string> = {
  none: 'Sekali',
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
}

export function RemindersView() {
  const [reminders, setReminders] = React.useState<Reminder[]>([])
  const [loading, setLoading] = React.useState(true)
  const [addOpen, setAddOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Reminder | null>(null)

  const load = React.useCallback(async () => {
    try {
      const res = await fetch('/api/reminders')
      const json = await res.json()
      setReminders(json)
    } catch {
      toast.error('Gagal memuat reminder')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const toggleDone = async (r: Reminder) => {
    setReminders((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, done: !x.done } : x))
    )
    try {
      await fetch(`/api/reminders/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !r.done }),
      })
    } catch {
      toast.error('Gagal update')
      setReminders((prev) => prev.map((x) => (x.id === r.id ? r : x)))
    }
  }

  const remove = async (id: string) => {
    const prev = reminders
    setReminders((p) => p.filter((x) => x.id !== id))
    try {
      await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
      toast.success('Reminder dihapus')
    } catch {
      setReminders(prev)
      toast.error('Gagal hapus')
    }
  }

  const now = Date.now()
  const upcoming = reminders
    .filter((r) => !r.done && new Date(r.datetime).getTime() >= now)
    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
  const past = reminders
    .filter((r) => !r.done && new Date(r.datetime).getTime() < now)
    .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
  const done = reminders.filter((r) => r.done)

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reminder</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {upcoming.length} akan datang • {done.length} selesai
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <EmptyState
          icon={BellRing}
          title="Belum ada reminder"
          description="Atur pengingat untuk janji, minum obat, atau aktivitas penting."
        />
      ) : (
        <div className="space-y-5">
          {upcoming.length > 0 && (
            <Section
              title="Akan Datang"
              icon={<BellRing className="h-4 w-4 text-emerald-500" />}
            >
              <ReminderList
                items={upcoming}
                onEdit={setEditing}
                onToggle={toggleDone}
                onRemove={remove}
                highlight
              />
            </Section>
          )}

          {past.length > 0 && (
            <Section
              title="Terlewat"
              icon={<Clock className="h-4 w-4 text-amber-500" />}
            >
              <ReminderList
                items={past}
                onEdit={setEditing}
                onToggle={toggleDone}
                onRemove={remove}
              />
            </Section>
          )}

          {done.length > 0 && (
            <Section
              title="Selesai"
              icon={<Bell className="h-4 w-4 text-muted-foreground" />}
            >
              <ReminderList
                items={done}
                onEdit={setEditing}
                onToggle={toggleDone}
                onRemove={remove}
                muted
              />
            </Section>
          )}
        </div>
      )}

      <FloatingAddButton onClick={() => setAddOpen(true)} />

      <QuickAdd
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Tambah Reminder"
        description="Atur pengingat dengan waktu dan opsi pengulangan"
        triggerLabel=""
      >
        {(close) => <ReminderForm onClose={() => { close(); load() }} />}
      </QuickAdd>

      <QuickAdd
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit Reminder"
        triggerLabel=""
      >
        {(close) => (
          <ReminderForm
            reminder={editing}
            onClose={() => { close(); setEditing(null); load() }}
          />
        )}
      </QuickAdd>
    </div>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function ReminderList({
  items,
  onEdit,
  onToggle,
  onRemove,
  highlight,
  muted,
}: {
  items: Reminder[]
  onEdit: (r: Reminder) => void
  onToggle: (r: Reminder) => void
  onRemove: (id: string) => void
  highlight?: boolean
  muted?: boolean
}) {
  return (
    <AnimatePresence initial={false}>
      {items.map((r) => (
        <motion.div
          key={r.id}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.18 }}
        >
          <Card
            className={`p-3 rounded-xl cursor-pointer hover:shadow-sm transition-shadow ${
              muted ? 'opacity-60' : ''
            } ${highlight ? 'border-l-4 border-l-primary' : ''}`}
            onClick={() => onEdit(r)}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggle(r)
                }}
                className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  r.done
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground/30 hover:border-primary'
                }`}
                aria-label="Tandai selesai"
              >
                {r.done && <span className="text-[10px]">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${r.done ? 'line-through' : ''}`}>
                  {r.title}
                </p>
                {r.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {r.notes}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateTime(r.datetime)}
                  </span>
                  <span className="text-[11px] text-muted-foreground/70">
                    • {relativeTime(r.datetime)}
                  </span>
                  {r.repeat && r.repeat !== 'none' && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0">
                      {REPEAT_LABEL[r.repeat] || r.repeat}
                    </Badge>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(r.id)
                }}
                className="text-muted-foreground hover:text-destructive p-1"
                aria-label="Hapus"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </motion.div>
      ))}
    </AnimatePresence>
  )
}

function ReminderForm({
  reminder,
  onClose,
}: {
  reminder?: Reminder | null
  onClose: () => void
}) {
  const [title, setTitle] = React.useState(reminder?.title ?? '')
  const [notes, setNotes] = React.useState(reminder?.notes ?? '')
  const [datetime, setDatetime] = React.useState(
    reminder?.datetime ? toLocalInput(reminder.datetime) : ''
  )
  const [repeat, setRepeat] = React.useState(reminder?.repeat ?? 'none')
  const [saving, setSaving] = React.useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return toast.error('Judul wajib diisi')
    if (!datetime) return toast.error('Waktu wajib diisi')
    setSaving(true)
    try {
      const body = {
        title: title.trim(),
        notes: notes.trim() || null,
        datetime: new Date(datetime).toISOString(),
        repeat: repeat === 'none' ? null : repeat,
      }
      if (reminder) {
        await fetch(`/api/reminders/${reminder.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        toast.success('Reminder diperbarui')
      } else {
        await fetch('/api/reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        toast.success('Reminder ditambahkan')
      }
      onClose()
    } catch {
      toast.error('Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 mt-4">
      <div className="space-y-1.5">
        <Label htmlFor="r-title">Judul</Label>
        <Input
          id="r-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="cth: Minum obat"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="r-notes">Catatan (opsional)</Label>
        <Textarea
          id="r-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Detail..."
          rows={2}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="r-datetime">Waktu</Label>
        <Input
          id="r-datetime"
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Pengulangan</Label>
        <Select value={repeat} onValueChange={setRepeat}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPEATS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Menyimpan...' : reminder ? 'Simpan' : 'Tambah'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
      </div>
    </form>
  )
}
