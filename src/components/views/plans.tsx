'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  Trash2,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  ChevronDown,
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
import { toLocalDateInput, formatDate } from '@/lib/utils'

interface Milestone {
  id: string
  title: string
  done: boolean
  dueDate: string | null
}

interface Plan {
  id: string
  title: string
  description: string | null
  color: string
  targetDate: string | null
  status: string
  milestones: Milestone[]
}

const COLORS = [
  { value: 'emerald', label: 'Emerald', class: 'bg-emerald-500' },
  { value: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { value: 'rose', label: 'Rose', class: 'bg-rose-500' },
  { value: 'violet', label: 'Violet', class: 'bg-violet-500' },
  { value: 'teal', label: 'Teal', class: 'bg-teal-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
]

const COLOR_BG: Record<string, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
  teal: 'bg-teal-500',
  orange: 'bg-orange-500',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Aktif',
  done: 'Selesai',
  archived: 'Arsip',
}

export function PlansView() {
  const [plans, setPlans] = React.useState<Plan[]>([])
  const [loading, setLoading] = React.useState(true)
  const [addOpen, setAddOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Plan | null>(null)

  const load = React.useCallback(async () => {
    try {
      const res = await fetch('/api/plans')
      const json = await res.json()
      setPlans(json)
    } catch {
      toast.error('Gagal memuat rencana')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const remove = async (id: string) => {
    const prev = plans
    setPlans((p) => p.filter((x) => x.id !== id))
    try {
      await fetch(`/api/plans/${id}`, { method: 'DELETE' })
      toast.success('Rencana dihapus')
    } catch {
      setPlans(prev)
    }
  }

  const toggleMilestone = async (planId: string, m: Milestone) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? {
              ...p,
              milestones: p.milestones.map((x) =>
                x.id === m.id ? { ...x, done: !x.done } : x
              ),
            }
          : p
      )
    )
    try {
      await fetch(`/api/milestones/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !m.done }),
      })
    } catch {
      toast.error('Gagal update')
      load()
    }
  }

  const addMilestone = async (planId: string, title: string) => {
    if (!title.trim()) return
    try {
      const res = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, title: title.trim() }),
      })
      const json = await res.json()
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId ? { ...p, milestones: [...p.milestones, json] } : p
        )
      )
    } catch {
      toast.error('Gagal menambah milestone')
    }
  }

  const removeMilestone = async (planId: string, mId: string) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? { ...p, milestones: p.milestones.filter((x) => x.id !== mId) }
          : p
      )
    )
    try {
      await fetch(`/api/milestones/${mId}`, { method: 'DELETE' })
    } catch {
      load()
    }
  }

  const markDone = async (p: Plan) => {
    const newStatus = p.status === 'done' ? 'active' : 'done'
    setPlans((prev) =>
      prev.map((x) => (x.id === p.id ? { ...x, status: newStatus } : x))
    )
    try {
      await fetch(`/api/plans/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      toast.success(newStatus === 'done' ? 'Rencana selesai!' : 'Rencana dibuka kembali')
    } catch {
      load()
    }
  }

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Rencana</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {plans.filter((p) => p.status === 'active').length} aktif •{' '}
          {plans.filter((p) => p.status === 'done').length} selesai
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Belum ada rencana"
          description="Tetapkan target jangka panjang dan pecah jadi milestone yang lebih kecil."
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {plans.map((p) => {
              const done = p.milestones.filter((m) => m.done).length
              const total = p.milestones.length
              const progress = total === 0 ? 0 : Math.round((done / total) * 100)
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                >
                  <PlanCard
                    plan={p}
                    progress={progress}
                    doneCount={done}
                    total={total}
                    onEdit={() => setEditing(p)}
                    onDelete={() => remove(p.id)}
                    onToggleDone={() => markDone(p)}
                    onToggleMilestone={(m) => toggleMilestone(p.id, m)}
                    onAddMilestone={(t) => addMilestone(p.id, t)}
                    onRemoveMilestone={(mId) => removeMilestone(p.id, mId)}
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
        title="Tambah Rencana"
        description="Tetapkan target baru untuk dikejar"
        triggerLabel=""
      >
        {(close) => <PlanForm onClose={() => { close(); load() }} />}
      </QuickAdd>

      <QuickAdd
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit Rencana"
        triggerLabel=""
      >
        {(close) => (
          <PlanForm
            plan={editing}
            onClose={() => { close(); setEditing(null); load() }}
          />
        )}
      </QuickAdd>
    </div>
  )
}

function PlanCard({
  plan,
  progress,
  doneCount,
  total,
  onEdit,
  onDelete,
  onToggleDone,
  onToggleMilestone,
  onAddMilestone,
  onRemoveMilestone,
}: {
  plan: Plan
  progress: number
  doneCount: number
  total: number
  onEdit: () => void
  onDelete: () => void
  onToggleDone: () => void
  onToggleMilestone: (m: Milestone) => void
  onAddMilestone: (t: string) => void
  onRemoveMilestone: (id: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [newMilestone, setNewMilestone] = React.useState('')
  const colorClass = COLOR_BG[plan.color] || 'bg-emerald-500'

  return (
    <Card className={`rounded-2xl overflow-hidden ${plan.status === 'done' ? 'opacity-70' : ''}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-1.5 self-stretch rounded-full ${colorClass}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3
                className="font-semibold text-base cursor-pointer hover:text-primary transition-colors"
                onClick={onEdit}
              >
                {plan.title}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={onToggleDone}
                  className="text-xs px-2 py-1 rounded-md hover:bg-muted text-muted-foreground"
                >
                  {plan.status === 'done' ? 'Buka' : 'Selesai'}
                </button>
                <button
                  onClick={onDelete}
                  className="text-muted-foreground hover:text-destructive p-1"
                  aria-label="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {plan.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {plan.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="text-[10px]">
                {STATUS_LABEL[plan.status] || plan.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {doneCount}/{total} milestone
              </span>
              {plan.targetDate && (
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(plan.targetDate)}
                </span>
              )}
            </div>
            {total > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full ${colorClass} rounded-full`}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums">{progress}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full px-4 py-2 border-t border-border/50 text-xs text-muted-foreground hover:bg-muted/40 flex items-center justify-center gap-1">
            <ChevronDown
              className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
            />
            {open ? 'Sembunyikan' : 'Lihat'} Milestone
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-3 space-y-2 bg-muted/30">
            {plan.milestones.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Belum ada milestone. Tambahkan di bawah.
              </p>
            )}
            {plan.milestones.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-background"
              >
                <button onClick={() => onToggleMilestone(m)} aria-label="Toggle">
                  {m.done ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <span
                  className={`flex-1 text-sm ${m.done ? 'line-through text-muted-foreground' : ''}`}
                >
                  {m.title}
                </span>
                {m.dueDate && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(m.dueDate)}
                  </span>
                )}
                <button
                  onClick={() => onRemoveMilestone(m.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Hapus milestone"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                onAddMilestone(newMilestone)
                setNewMilestone('')
              }}
              className="flex gap-2 pt-1"
            >
              <Input
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                placeholder="Tambah milestone baru..."
                className="h-8 text-sm"
              />
              <Button type="submit" size="sm" variant="secondary" className="h-8 px-2">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function PlanForm({ plan, onClose }: { plan?: Plan | null; onClose: () => void }) {
  const [title, setTitle] = React.useState(plan?.title ?? '')
  const [description, setDescription] = React.useState(plan?.description ?? '')
  const [color, setColor] = React.useState(plan?.color ?? 'emerald')
  const [targetDate, setTargetDate] = React.useState(
    plan?.targetDate ? toLocalDateInput(plan.targetDate) : ''
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
        targetDate: targetDate ? new Date(targetDate).toISOString() : null,
      }
      if (plan) {
        await fetch(`/api/plans/${plan.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        toast.success('Rencana diperbarui')
      } else {
        await fetch('/api/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        toast.success('Rencana ditambahkan')
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
        <Label htmlFor="p-title">Judul Rencana</Label>
        <Input
          id="p-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="cth: Lari 10km tanpa henti"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-desc">Deskripsi (opsional)</Label>
        <Textarea
          id="p-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kenapa rencana ini penting..."
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
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
          <Label htmlFor="p-target">Target Tanggal</Label>
          <Input
            id="p-target"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Menyimpan...' : plan ? 'Simpan' : 'Tambah'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
      </div>
    </form>
  )
}
