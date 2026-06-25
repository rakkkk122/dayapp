'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UtensilsCrossed,
  Trash2,
  Flame,
  Egg,
  Wheat,
  Droplet,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
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
import { QuickAdd, EmptyState, FloatingAddButton } from '@/components/common/quick-add'
import { toLocalDateInput, formatDate, startOfDay, isSameDay } from '@/lib/utils'

interface FoodLog {
  id: string
  date: string
  mealType: string
  foodName: string
  calories: number
  protein: number
  carbs: number
  fats: number
  notes: string | null
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Sarapan' },
  { value: 'lunch', label: 'Makan Siang' },
  { value: 'dinner', label: 'Makan Malam' },
  { value: 'snack', label: 'Camilan' },
]

const MEAL_LABEL: Record<string, string> = {
  breakfast: 'Sarapan',
  lunch: 'Makan Siang',
  dinner: 'Makan Malam',
  snack: 'Camilan',
}

const MEAL_STYLE: Record<string, string> = {
  breakfast: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  lunch: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  dinner: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  snack: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
}

const DAILY_TARGET = {
  calories: 2000,
  protein: 120,
  carbs: 250,
  fats: 65,
}

export function FoodView() {
  const [logs, setLogs] = React.useState<FoodLog[]>([])
  const [loading, setLoading] = React.useState(true)
  const [addOpen, setAddOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date>(startOfDay())

  const load = React.useCallback(async () => {
    try {
      const dateStr = toLocalDateInput(selectedDate)
      const res = await fetch(`/api/food/logs?date=${dateStr}`)
      const json = await res.json()
      setLogs(json)
    } catch {
      toast.error('Gagal memuat log makanan')
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  React.useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  const remove = async (id: string) => {
    const prev = logs
    setLogs((p) => p.filter((x) => x.id !== id))
    try {
      await fetch(`/api/food/logs/${id}`, { method: 'DELETE' })
      toast.success('Log dihapus')
    } catch {
      setLogs(prev)
    }
  }

  const totalCalories = logs.reduce((s, l) => s + l.calories, 0)
  const totalProtein = logs.reduce((s, l) => s + l.protein, 0)
  const totalCarbs = logs.reduce((s, l) => s + l.carbs, 0)
  const totalFats = logs.reduce((s, l) => s + l.fats, 0)

  const changeDate = (delta: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + delta)
    setSelectedDate(startOfDay(d))
  }

  const grouped = MEAL_TYPES.map((m) => ({
    ...m,
    items: logs.filter((l) => l.mealType === m.value),
  }))

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Makanan & Gizi</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Lacak asupan kalori & makro harian
        </p>
      </div>

      {/* Date picker */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" onClick={() => changeDate(-1)} aria-label="Hari sebelumnya" className="h-10 w-10">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center">
          <p className="font-semibold">{formatDate(selectedDate)}</p>
          {isSameDay(selectedDate, new Date()) && (
            <p className="text-xs text-primary">Hari ini</p>
          )}
        </div>
        <Button variant="outline" size="icon" onClick={() => changeDate(1)} aria-label="Hari berikutnya" className="h-10 w-10">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Macros summary */}
      <Card className="p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            Ringkasan Hari Ini
          </h3>
          <span className="text-xs text-muted-foreground">
            Target: {DAILY_TARGET.calories} kkal
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <MacroPill
            icon={Flame}
            label="Kalori"
            value={totalCalories}
            unit="kkal"
            target={DAILY_TARGET.calories}
            color="text-orange-500"
          />
          <MacroPill
            icon={Egg}
            label="Protein"
            value={Math.round(totalProtein)}
            unit="g"
            target={DAILY_TARGET.protein}
            color="text-rose-500"
          />
          <MacroPill
            icon={Wheat}
            label="Karbo"
            value={Math.round(totalCarbs)}
            unit="g"
            target={DAILY_TARGET.carbs}
            color="text-amber-500"
          />
          <MacroPill
            icon={Droplet}
            label="Lemak"
            value={Math.round(totalFats)}
            unit="g"
            target={DAILY_TARGET.fats}
            color="text-violet-500"
          />
        </div>
      </Card>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Belum ada log makanan"
          description={`Catat makanan yang Anda konsumsi pada ${formatDate(selectedDate)}.`}
        />
      ) : (
        <div className="space-y-4">
          {grouped.map((g) =>
            g.items.length === 0 ? null : (
              <div key={g.value}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                  <Badge className={`text-[10px] ${MEAL_STYLE[g.value]}`} variant="outline">
                    {g.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground/70">
                    {g.items.reduce((s, l) => s + l.calories, 0)} kkal
                  </span>
                </h3>
                <div className="space-y-2">
                  <AnimatePresence initial={false}>
                    {g.items.map((l) => (
                      <motion.div
                        key={l.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.18 }}
                      >
                        <Card className="p-3 rounded-xl">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{l.foodName}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <Flame className="h-3 w-3 text-orange-500" />
                                  {l.calories} kkal
                                </span>
                                {l.protein > 0 && <span>P {l.protein}g</span>}
                                {l.carbs > 0 && <span>C {l.carbs}g</span>}
                                {l.fats > 0 && <span>F {l.fats}g</span>}
                              </div>
                              {l.notes && (
                                <p className="text-[11px] text-muted-foreground/70 mt-1 line-clamp-1">
                                  {l.notes}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => remove(l.id)}
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
              </div>
            )
          )}
        </div>
      )}

      <FloatingAddButton onClick={() => setAddOpen(true)} />

      <QuickAdd
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Tambah Log Makanan"
        description={`Catat makanan untuk ${formatDate(selectedDate)}`}
        triggerLabel=""
      >
        {(close) => (
          <FoodForm
            defaultDate={selectedDate}
            onClose={() => { close(); load() }}
          />
        )}
      </QuickAdd>
    </div>
  )
}

function MacroPill({
  icon: Icon,
  label,
  value,
  unit,
  target,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  unit: string
  target: number
  color: string
}) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0
  return (
    <div className="text-center">
      <Icon className={`h-4 w-4 mx-auto ${color} mb-1`} />
      <div className="text-base font-bold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{unit}</div>
      <div className="text-[10px] text-muted-foreground/70">{pct}% / {label}</div>
    </div>
  )
}

function FoodForm({
  defaultDate,
  onClose,
}: {
  defaultDate: Date
  onClose: () => void
}) {
  const [date, setDate] = React.useState(toLocalDateInput(defaultDate))
  const [mealType, setMealType] = React.useState('snack')
  const [foodName, setFoodName] = React.useState('')
  const [calories, setCalories] = React.useState('')
  const [protein, setProtein] = React.useState('')
  const [carbs, setCarbs] = React.useState('')
  const [fats, setFats] = React.useState('')
  const [notes, setNotes] = React.useState('')
  const [saving, setSaving] = React.useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!foodName.trim()) return toast.error('Nama makanan wajib diisi')
    setSaving(true)
    try {
      await fetch('/api/food/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: date ? new Date(date).toISOString() : undefined,
          mealType,
          foodName: foodName.trim(),
          calories: parseInt(calories) || 0,
          protein: parseFloat(protein) || 0,
          carbs: parseFloat(carbs) || 0,
          fats: parseFloat(fats) || 0,
          notes: notes.trim() || null,
        }),
      })
      toast.success('Log ditambahkan')
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
          <Label htmlFor="f-date">Tanggal</Label>
          <Input
            id="f-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Jenis Makan</Label>
          <Select value={mealType} onValueChange={setMealType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEAL_TYPES.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="f-name">Nama Makanan</Label>
        <Input
          id="f-name"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
          placeholder="cth: Nasi putih 1 porsi"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="f-cal" className="text-xs">Kalori</Label>
          <Input
            id="f-cal"
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-protein" className="text-xs">Protein (g)</Label>
          <Input
            id="f-protein"
            type="number"
            step="0.1"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-carbs" className="text-xs">Karbo (g)</Label>
          <Input
            id="f-carbs"
            type="number"
            step="0.1"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="f-fats" className="text-xs">Lemak (g)</Label>
          <Input
            id="f-fats"
            type="number"
            step="0.1"
            value={fats}
            onChange={(e) => setFats(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="f-notes">Catatan (opsional)</Label>
        <Textarea
          id="f-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Mis: dirumah / di luar"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? 'Menyimpan...' : 'Tambah Log'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Batal
        </Button>
      </div>
    </form>
  )
}
