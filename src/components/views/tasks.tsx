'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, Trash2, Clock, ListChecks, Filter } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { QuickAdd, EmptyState, FloatingAddButton } from '@/components/common/quick-add'
import { toLocalInput, formatTime, isToday } from '@/lib/utils'

interface Task {
  id: string
  title: string
  notes: string | null
  priority: string
  category: string
  status: string
  dueDate: string | null
  createdAt: string
}

const PRIORITIES = [
  { value: 'low', label: 'Rendah' },
  { value: 'medium', label: 'Sedang' },
  { value: 'high', label: 'Tinggi' },
]

const CATEGORIES = [
  { value: 'personal', label: 'Pribadi' },
  { value: 'work', label: 'Kerja' },
  { value: 'gym', label: 'Gym' },
  { value: 'food', label: 'Makanan' },
  { value: 'other', label: 'Lainnya' },
]

const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20',
  medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
  low: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
}

const PRIORITY_LABEL: Record<string, string> = {
  high: 'Tinggi',
  medium: 'Sedang',
  low: 'Rendah',
}

const CATEGORY_LABEL: Record<string, string> = {
  personal: 'Pribadi',
  work: 'Kerja',
  gym: 'Gym',
  food: 'Makanan',
  other: 'Lainnya',
}

export function TasksView() {
  const [tasks, setTasks] = React.useState<Task[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'done' | 'today'>('all')
  const [addOpen, setAddOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Task | null>(null)

  const load = React.useCallback(async () => {
    try {
      const res = await fetch('/api/tasks')
      const json = await res.json()
      setTasks(json)
    } catch {
      toast.error('Gagal memuat tugas')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const toggleDone = async (t: Task) => {
    const newStatus = t.status === 'done' ? 'pending' : 'done'
    setTasks((prev) =>
      prev.map((x) => (x.id === t.id ? { ...x, status: newStatus } : x))
    )
    try {
      await fetch(`/api/tasks/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      toast.success(newStatus === 'done' ? 'Tugas selesai!' : 'Tugas dibuka kembali')
    } catch {
      toast.error('Gagal update')
      setTasks((prev) =>
        prev.map((x) => (x.id === t.id ? { ...x, status: t.status } : x))
      )
    }
  }

  const remove = async (id: string) => {
    const prev = tasks
    setTasks((p) => p.filter((x) => x.id !== id))
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      toast.success('Tugas dihapus')
    } catch {
      setTasks(prev)
      toast.error('Gagal hapus')
    }
  }

  const filtered = React.useMemo(() => {
    if (filter === 'pending') return tasks.filter((t) => t.status === 'pending')
    if (filter === 'done') return tasks.filter((t) => t.status === 'done')
    if (filter === 'today')
      return tasks.filter(
        (t) => t.status === 'pending' && t.dueDate && isToday(t.dueDate)
      )
    return tasks
  }, [tasks, filter])

  const sorted = React.useMemo(() => {
    const order: Record<string, number> = { pending: 0, done: 1 }
    const prioOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
    return [...filtered].sort((a, b) => {
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
      return prioOrder[a.priority] - prioOrder[b.priority]
    })
  }, [filtered])

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto pb-24 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Tugas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {tasks.filter((t) => t.status === 'pending').length} pending •{' '}
            {tasks.filter((t) => t.status === 'done').length} selesai
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        {(['all', 'today', 'pending', 'done'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-medium transition-colors min-h-[36px] ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {f === 'all' ? 'Semua' : f === 'today' ? 'Hari Ini' : f === 'pending' ? 'Pending' : 'Selesai'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Belum ada tugas"
          description="Mulai catat tugas pertama Anda. Bisa tugas pekerjaan, gym, atau hal personal."
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {sorted.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
              >
                <Card
                  className={`p-3 rounded-xl cursor-pointer hover:shadow-sm transition-shadow ${
                    t.status === 'done' ? 'opacity-60' : ''
                  }`}
                  onClick={() => setEditing(t)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={t.status === 'done'}
                      onCheckedChange={() => toggleDone(t)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          t.status === 'done' ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {t.title}
                      </p>
                      {t.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {t.notes}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0 ${PRIORITY_STYLE[t.priority] || PRIORITY_STYLE.medium}`}
                        >
                          {PRIORITY_LABEL[t.priority] || 'Sedang'}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] px-2 py-0">
                          {CATEGORY_LABEL[t.category] || 'Lainnya'}
                        </Badge>
                        {t.dueDate && (
                          <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(t.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        remove(t.id)
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
        </div>
      )}

      <FloatingAddButton onClick={() => setAddOpen(true)} />

      <QuickAdd
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Tambah Tugas"
        description="Catat tugas baru dengan prioritas dan tenggat"
        triggerLabel=""
      >
        {(close) => (
          <TaskForm
            onClose={() => {
              close()
              load()
            }}
          />
        )}
      </QuickAdd>

      <QuickAdd
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit Tugas"
        description="Perbarui detail tugas"
        triggerLabel=""
      >
        {(close) => (
          <TaskForm
            task={editing}
            onClose={() => {
              close()
              setEditing(null)
              load()
            }}
          />
        )}
      </QuickAdd>
    </div>
  )
}

function TaskForm({
  task,
  onClose,
}: {
  task?: Task | null
  onClose: () => void
}) {
  const [title, setTitle] = React.useState(task?.title ?? '')
  const [notes, setNotes] = React.useState(task?.notes ?? '')
  const [priority, setPriority] = React.useState(task?.priority ?? 'medium')
  const [category, setCategory] = React.useState(task?.category ?? 'personal')
  const [dueDate, setDueDate] = React.useState(task?.dueDate ? toLocalInput(task.dueDate) : '')
  const [saving, setSaving] = React.useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return toast.error('Judul wajib diisi')
    setSaving(true)
    try {
      const body = {
        title: title.trim(),
        notes: notes.trim() || null,
        priority,
        category,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      }
      if (task) {
        await fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        toast.success('Tugas diperbarui')
      } else {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        toast.success('Tugas ditambahkan')
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
        <Label htmlFor="title">Judul</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="cth: Selesaikan laporan bulanan"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Catatan (opsional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Detail tambahan..."
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Prioritas</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Kategori</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="dueDate">Tenggat (opsional)</Label>
        <Input
          id="dueDate"
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Menyimpan...' : task ? 'Simpan Perubahan' : 'Tambah Tugas'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
      </div>
    </form>
  )
}
