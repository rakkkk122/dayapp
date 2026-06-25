'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dumbbell,
  Trash2,
  Plus,
  Clock,
  Calendar,
  ChevronDown,
  Flame,
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
import { toLocalDateInput, formatDate, formatDuration } from '@/lib/utils'

interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  weight: number
  notes: string | null
}

interface Workout {
  id: string
  date: string
  type: string
  duration: number
  notes: string | null
  exercises: Exercise[]
}

const TYPES = [
  { value: 'strength', label: 'Angkat Beban' },
  { value: 'cardio', label: 'Kardio' },
  { value: 'flexibility', label: 'Fleksibilitas' },
  { value: 'sport', label: 'Olahraga' },
]

const TYPE_LABEL: Record<string, string> = {
  strength: 'Angkat Beban',
  cardio: 'Kardio',
  flexibility: 'Fleksibilitas',
  sport: 'Olahraga',
}

const TYPE_STYLE: Record<string, string> = {
  strength: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  cardio: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  flexibility: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  sport: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
}

export function GymView() {
  const [workouts, setWorkouts] = React.useState<Workout[]>([])
  const [loading, setLoading] = React.useState(true)
  const [addOpen, setAddOpen] = React.useState(false)

  const load = React.useCallback(async () => {
    try {
      const res = await fetch('/api/gym/workouts')
      const json = await res.json()
      setWorkouts(json)
    } catch {
      toast.error('Gagal memuat latihan')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  const removeWorkout = async (id: string) => {
    const prev = workouts
    setWorkouts((p) => p.filter((x) => x.id !== id))
    try {
      await fetch(`/api/gym/workouts/${id}`, { method: 'DELETE' })
      toast.success('Latihan dihapus')
    } catch {
      setWorkouts(prev)
    }
  }

  const addExercise = async (workoutId: string, body: Partial<Exercise>) => {
    try {
      const res = await fetch(`/api/gym/workouts/${workoutId}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      setWorkouts((prev) =>
        prev.map((w) =>
          w.id === workoutId ? { ...w, exercises: [...w.exercises, json] } : w
        )
      )
    } catch {
      toast.error('Gagal menambah latihan')
    }
  }

  const removeExercise = async (workoutId: string, exId: string) => {
    setWorkouts((prev) =>
      prev.map((w) =>
        w.id === workoutId
          ? { ...w, exercises: w.exercises.filter((e) => e.id !== exId) }
          : w
      )
    )
    try {
      await fetch(`/api/gym/exercises/${exId}`, { method: 'DELETE' })
    } catch {
      load()
    }
  }

  // Stats
  const totalWorkouts = workouts.length
  const totalMinutes = workouts.reduce((s, w) => s + w.duration, 0)
  const totalSets = workouts.reduce(
    (s, w) => s + w.exercises.reduce((a, e) => a + e.sets, 0),
    0
  )

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Gym & Latihan</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Lacak sesi latihan, set, dan beban
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 rounded-xl text-center">
          <Dumbbell className="h-4 w-4 mx-auto text-rose-500 mb-1" />
          <div className="text-xl font-bold">{totalWorkouts}</div>
          <div className="text-[10px] text-muted-foreground">Sesi Total</div>
        </Card>
        <Card className="p-3 rounded-xl text-center">
          <Timer className="h-4 w-4 mx-auto text-amber-500 mb-1" />
          <div className="text-xl font-bold">{formatDuration(totalMinutes)}</div>
          <div className="text-[10px] text-muted-foreground">Total Waktu</div>
        </Card>
        <Card className="p-3 rounded-xl text-center">
          <Flame className="h-4 w-4 mx-auto text-orange-500 mb-1" />
          <div className="text-xl font-bold">{totalSets}</div>
          <div className="text-[10px] text-muted-foreground">Total Set</div>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Belum ada sesi latihan"
          description="Catat sesi gym pertama Anda. Tambahkan exercise, set, rep, dan beban."
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {workouts.map((w) => (
              <motion.div
                key={w.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
              >
                <WorkoutCard
                  workout={w}
                  onDelete={() => removeWorkout(w.id)}
                  onAddExercise={(body) => addExercise(w.id, body)}
                  onRemoveExercise={(exId) => removeExercise(w.id, exId)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <FloatingAddButton onClick={() => setAddOpen(true)} />

      <QuickAdd
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Tambah Sesi Latihan"
        description="Catat sesi gym baru"
        triggerLabel=""
      >
        {(close) => <WorkoutForm onClose={() => { close(); load() }} />}
      </QuickAdd>
    </div>
  )
}

function WorkoutCard({
  workout,
  onDelete,
  onAddExercise,
  onRemoveExercise,
}: {
  workout: Workout
  onDelete: () => void
  onAddExercise: (body: Partial<Exercise>) => void
  onRemoveExercise: (id: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [exName, setExName] = React.useState('')
  const [sets, setSets] = React.useState('3')
  const [reps, setReps] = React.useState('10')
  const [weight, setWeight] = React.useState('0')

  const addEx = (e: React.FormEvent) => {
    e.preventDefault()
    if (!exName.trim()) return
    onAddExercise({
      name: exName.trim(),
      sets: parseInt(sets) || 3,
      reps: parseInt(reps) || 10,
      weight: parseFloat(weight) || 0,
    })
    setExName('')
    setSets('3')
    setReps('10')
    setWeight('0')
  }

  return (
    <Card className="rounded-2xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-[10px] ${TYPE_STYLE[workout.type] || TYPE_STYLE.strength}`} variant="outline">
                {TYPE_LABEL[workout.type] || workout.type}
              </Badge>
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(workout.date)}
              </span>
              {workout.duration > 0 && (
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(workout.duration)}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold mt-2">
              {workout.exercises.length} exercise •{' '}
              {workout.exercises.reduce((s, e) => s + e.sets, 0)} set total
            </p>
            {workout.notes && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {workout.notes}
              </p>
            )}
          </div>
          <button
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive p-1"
            aria-label="Hapus"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full px-4 py-2 border-t border-border/50 text-xs text-muted-foreground hover:bg-muted/40 flex items-center justify-center gap-1">
            <ChevronDown
              className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
            />
            {open ? 'Sembunyikan' : 'Lihat'} Detail Exercise
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 py-3 space-y-2 bg-muted/30">
            {workout.exercises.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Belum ada exercise. Tambahkan di bawah.
              </p>
            )}
            {workout.exercises.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center justify-between gap-2 p-2 rounded-md bg-background"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ex.sets} set × {ex.reps} rep
                    {ex.weight > 0 && ` • ${ex.weight}kg`}
                  </p>
                  {ex.notes && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{ex.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => onRemoveExercise(ex.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Hapus exercise"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <form onSubmit={addEx} className="grid grid-cols-12 gap-1.5 pt-2">
              <Input
                value={exName}
                onChange={(e) => setExName(e.target.value)}
                placeholder="Nama exercise"
                className="col-span-12 h-8 text-sm"
              />
              <Input
                type="number"
                value={sets}
                onChange={(e) => setSets(e.target.value)}
                placeholder="Set"
                className="col-span-3 h-8 text-sm"
              />
              <Input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="Rep"
                className="col-span-3 h-8 text-sm"
              />
              <Input
                type="number"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="kg"
                className="col-span-4 h-8 text-sm"
              />
              <Button type="submit" size="sm" variant="secondary" className="col-span-2 h-8 px-2">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function WorkoutForm({ onClose }: { onClose: () => void }) {
  const [date, setDate] = React.useState(toLocalDateInput(new Date()))
  const [type, setType] = React.useState('strength')
  const [duration, setDuration] = React.useState('60')
  const [notes, setNotes] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch('/api/gym/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date ? new Date(date).toISOString() : undefined,
          type,
          duration: parseInt(duration) || 0,
          notes: notes.trim() || null,
        }),
      })
      toast.success('Sesi latihan ditambahkan')
      onClose()
    } catch {
      toast.error('Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="g-date">Tanggal</Label>
          <Input
            id="g-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tipe Latihan</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="g-dur">Durasi (menit)</Label>
        <Input
          id="g-dur"
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="g-notes">Catatan (opsional)</Label>
        <Textarea
          id="g-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Mis: PR squat 100kg, perasaan latihan, dll"
          rows={2}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Menyimpan...' : 'Tambah Sesi'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Exercise & set bisa ditambahkan setelah sesi dibuat.
      </p>
    </form>
  )
}
