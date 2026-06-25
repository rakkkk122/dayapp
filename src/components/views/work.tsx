'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Briefcase,
  Trash2,
  Play,
  Pause,
  Square,
  Clock,
  Calendar,
  ChevronDown,
  Plus,
  Timer,
} from 'lucide-react'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { QuickAdd, EmptyState, FloatingAddButton } from '@/components/common/quick-add'
import { toLocalDateInput, formatDate, formatTime, formatDuration } from '@/lib/utils'

interface Session {
  id: string
  start: string
  end: string | null
  duration: number
  notes: string | null
}

interface Project {
  id: string
  title: string
  description: string | null
  color: string
  status: string
  deadline: string | null
  sessions: Session[]
}

const COLORS = [
  { value: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { value: 'emerald', label: 'Emerald', class: 'bg-emerald-500' },
  { value: 'rose', label: 'Rose', class: 'bg-rose-500' },
  { value: 'violet', label: 'Violet', class: 'bg-violet-500' },
  { value: 'teal', label: 'Teal', class: 'bg-teal-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
]

const COLOR_BG: Record<string, string> = {
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
  teal: 'bg-teal-500',
  orange: 'bg-orange-500',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Aktif',
  paused: 'Dijeda',
  done: 'Selesai',
  archived: 'Arsip',
}

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  paused: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  done: 'bg-muted text-muted-foreground',
  archived: 'bg-muted text-muted-foreground',
}

export function WorkView() {
  const [projects, setProjects] = React.useState<Project[]>([])
  const [loading, setLoading] = React.useState(true)
  const [addOpen, setAddOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Project | null>(null)
  const [activeTimers, setActiveTimers] = React.useState<
    Record<string, { start: number }>
  >({})

  const load = React.useCallback(async () => {
    try {
      const res = await fetch('/api/work/projects')
      const json = await res.json()
      setProjects(json)
    } catch {
      toast.error('Gagal memuat proyek')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const removeProject = async (id: string) => {
    const prev = projects
    setProjects((p) => p.filter((x) => x.id !== id))
    try {
      await fetch(`/api/work/projects/${id}`, { method: 'DELETE' })
      toast.success('Proyek dihapus')
    } catch {
      setProjects(prev)
    }
  }

  const startSession = async (projectId: string) => {
    try {
      const res = await fetch(`/api/work/projects/${projectId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: new Date().toISOString() }),
      })
      const json = await res.json()
      setActiveTimers((prev) => ({
        ...prev,
        [projectId]: { start: new Date(json.start).getTime() },
      }))
      toast.success('Sesi dimulai')
    } catch {
      toast.error('Gagal mulai sesi')
    }
  }

  const stopSession = async (sessionId: string, projectId: string) => {
    try {
      await fetch(`/api/work/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ end: new Date().toISOString() }),
      })
      setActiveTimers((prev) => {
        const next = { ...prev }
        delete next[projectId]
        return next
      })
      toast.success('Sesi dihentikan')
      load()
    } catch {
      toast.error('Gagal menghentikan sesi')
    }
  }

  const removeSession = async (sessionId: string) => {
    try {
      await fetch(`/api/work/sessions/${sessionId}`, { method: 'DELETE' })
      load()
    } catch {
      toast.error('Gagal hapus sesi')
    }
  }

  // Live timer tick
  const [, setTick] = React.useState(0)
  React.useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const totalWeekMinutes = projects.reduce(
    (s, p) =>
      s +
      p.sessions
        .filter(
          (sess) =>
            new Date(sess.start).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        )
        .reduce((a, b) => a + b.duration, 0),
    0
  )

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Kerja & Proyek</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kelola proyek, lacak waktu fokus
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="p-3 rounded-xl">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-violet-500" />
            <div>
              <div className="text-xl font-bold">
                {projects.filter((p) => p.status === 'active').length}
              </div>
              <div className="text-[10px] text-muted-foreground">Proyek Aktif</div>
            </div>
          </div>
        </Card>
        <Card className="p-3 rounded-xl">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-amber-500" />
            <div>
              <div className="text-xl font-bold">{formatDuration(totalWeekMinutes)}</div>
              <div className="text-[10px] text-muted-foreground">Fokus Minggu Ini</div>
            </div>
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Belum ada proyek"
          description="Tambahkan proyek pekerjaan dan mulai lacak waktu fokus Anda."
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {projects.map((p) => {
              const totalMin = p.sessions.reduce((s, x) => s + x.duration, 0)
              const activeTimer = activeTimers[p.id]
              const liveMin = activeTimer
                ? Math.floor((Date.now() - activeTimer.start) / 60000)
                : 0
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                >
                  <ProjectCard
                    project={p}
                    totalMin={totalMin + liveMin}
                    isActive={!!activeTimer}
                    onEdit={() => setEditing(p)}
                    onDelete={() => removeProject(p.id)}
                    onStart={() => startSession(p.id)}
                    onStop={() => {
                      const lastSession = p.sessions.find((s) => !s.end)
                      if (lastSession) stopSession(lastSession.id, p.id)
                    }}
                    onRemoveSession={removeSession}
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <FloatingAddButton onClick={() => setAddOpen(true)} />

      <QuickAdd
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Tambah Proyek"
        description="Buat proyek kerja baru"
        triggerLabel=""
      >
        {(close) => <ProjectForm onClose={() => { close(); load() }} />}
      </QuickAdd>

      <QuickAdd
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit Proyek"
        triggerLabel=""
      >
        {(close) => (
          <ProjectForm
            project={editing}
            onClose={() => { close(); setEditing(null); load() }}
          />
        )}
      </QuickAdd>
    </div>
  )
}

function ProjectCard({
  project,
  totalMin,
  isActive,
  onEdit,
  onDelete,
  onStart,
  onStop,
  onRemoveSession,
}: {
  project: Project
  totalMin: number
  isActive: boolean
  onEdit: () => void
  onDelete: () => void
  onStart: () => void
  onStop: () => void
  onRemoveSession: (id: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const colorClass = COLOR_BG[project.color] || 'bg-amber-500'

  return (
    <Card className="rounded-2xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-1.5 self-stretch rounded-full ${colorClass}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3
                className="font-semibold text-base cursor-pointer hover:text-primary transition-colors"
                onClick={onEdit}
              >
                {project.title}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={onDelete}
                  className="text-muted-foreground hover:text-destructive p-1"
                  aria-label="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {project.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge className={`text-[10px] ${STATUS_STYLE[project.status] || STATUS_STYLE.active}`} variant="outline">
                {STATUS_LABEL[project.status] || project.status}
              </Badge>
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Timer className="h-3 w-3" />
                {formatDuration(totalMin)}
              </span>
              <span className="text-xs text-muted-foreground">
                {project.sessions.length} sesi
              </span>
              {project.deadline && (
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(project.deadline)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Timer controls */}
        <div className="mt-3 flex items-center gap-2">
          {isActive ? (
            <Button onClick={onStop} variant="default" size="sm" className="gap-1.5">
              <Square className="h-3.5 w-3.5 fill-current" />
              Hentikan Sesi
            </Button>
          ) : (
            <Button
              onClick={onStart}
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={project.status !== 'active'}
            >
              <Play className="h-3.5 w-3.5" />
              Mulai Sesi
            </Button>
          )}
        </div>
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full px-4 py-2 border-t border-border/50 text-xs text-muted-foreground hover:bg-muted/40 flex items-center justify-center gap-1">
            <ChevronDown
              className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
            />
            {open ? 'Sembunyikan' : 'Lihat'} Riwayat Sesi
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-3 space-y-1 bg-muted/30">
            {project.sessions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Belum ada sesi.
              </p>
            )}
            {project.sessions.slice(0, 10).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-2 p-2 rounded-md bg-background"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">
                    {formatDate(s.start)} • {formatTime(s.start)}
                    {s.end && ` → ${formatTime(s.end)}`}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {s.duration > 0 ? formatDuration(s.duration) : 'sedang berjalan'}
                  </p>
                  {s.notes && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                      {s.notes}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onRemoveSession(s.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Hapus sesi"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function ProjectForm({ project, onClose }: { project?: Project | null; onClose: () => void }) {
  const [title, setTitle] = React.useState(project?.title ?? '')
  const [description, setDescription] = React.useState(project?.description ?? '')
  const [color, setColor] = React.useState(project?.color ?? 'amber')
  const [status, setStatus] = React.useState(project?.status ?? 'active')
  const [deadline, setDeadline] = React.useState(
    project?.deadline ? toLocalDateInput(project.deadline) : ''
  )
  const [saving, setSaving] = React.useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return toast.error('Judul wajib diisi')
    setSaving(true)
    try {
      const body = {
        title: title.trim(),
        description: description.trim() || null,
        color,
        status,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      }
      if (project) {
        await fetch(`/api/work/projects/${project.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        toast.success('Proyek diperbarui')
      } else {
        await fetch('/api/work/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        toast.success('Proyek ditambahkan')
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
        <Label htmlFor="w-title">Judul Proyek</Label>
        <Input
          id="w-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="cth: Rilis aplikasi v2"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="w-desc">Deskripsi (opsional)</Label>
        <Textarea
          id="w-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Warna</Label>
          <Select value={color} onValueChange={setColor}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COLORS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  <span className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${c.class}`} />
                    {c.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="paused">Dijeda</SelectItem>
              <SelectItem value="done">Selesai</SelectItem>
              <SelectItem value="archived">Arsip</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="w-deadline">Deadline</Label>
          <Input
            id="w-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Menyimpan...' : project ? 'Simpan' : 'Tambah'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
      </div>
    </form>
  )
}
