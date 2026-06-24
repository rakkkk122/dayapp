'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  UtensilsCrossed,
  Target,
  TrendingUp,
  Loader2,
  RefreshCw,
  Check,
  Plus,
  AlertTriangle,
  Lightbulb,
  ThumbsUp,
  Info,
  Clock,
  Flame,
  Dumbbell,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useUIStore } from '@/store/ui-store'
import { cn } from '@/lib/utils'

// ============ Types ============
interface FoodSuggestion {
  name: string
  calories: number
  protein: number
  carbs: number
  fats: number
  reason: string
}

// Tailwind doesn't support dynamic class names — must enumerate
const PLAN_COLOR_DOT: Record<string, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  violet: 'bg-violet-500',
  teal: 'bg-teal-500',
  orange: 'bg-orange-500',
}

interface FoodSuggestResponse {
  ok: boolean
  context: {
    todayConsumed: { calories: number; protein: number }
    remaining: { calories: number; protein: number }
    gymTodayMinutes: number
    avgCalPerDay: number
  }
  suggestions: FoodSuggestion[]
}

interface GeneratedPlan {
  title: string
  description: string
  color: string
  targetDate: string
  milestones: Array<{ title: string; dueOffsetDays: number }>
}

interface PlanGenResponse {
  ok: boolean
  targetDate: string
  plan: GeneratedPlan
}

interface Insight {
  type: 'productivity' | 'food' | 'gym' | 'work' | 'plans' | string
  severity: 'positive' | 'neutral' | 'warning'
  title: string
  body: string
  recommendation: string
}

interface InsightsResponse {
  ok: boolean
  generatedAt: string
  dataRange: string
  summary: string
  insights: Insight[]
  rawStats: any
}

// ============ Main View ============
export function AiView() {
  const [tab, setTab] = React.useState<'food' | 'plan' | 'insights'>('food')

  return (
    <div className="space-y-4 p-4 md:p-6 max-w-3xl mx-auto pb-24 md:pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Asisten AI
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Saran personal berbasis data Anda — makanan, rencana, dan analisis pola
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="food" className="gap-1.5">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Saran Makanan</span>
            <span className="sm:hidden">Makanan</span>
          </TabsTrigger>
          <TabsTrigger value="plan" className="gap-1.5">
            <Target className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Buat Rencana</span>
            <span className="sm:hidden">Rencana</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Insight</span>
            <span className="sm:hidden">Insight</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="food" className="mt-4">
          <FoodSuggestTab />
        </TabsContent>
        <TabsContent value="plan" className="mt-4">
          <PlanGenerateTab />
        </TabsContent>
        <TabsContent value="insights" className="mt-4">
          <InsightsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============ Tab 1: Food Suggestions ============
function FoodSuggestTab() {
  const [mealType, setMealType] = React.useState('lunch')
  const [note, setNote] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<FoodSuggestResponse | null>(null)
  const [addingName, setAddingName] = React.useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    setData(null)
    try {
      const res = await fetch('/api/ai/food-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealType, note: note.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal')
      setData(json)
      toast.success(`${json.suggestions.length} saran makanan siap!`)
    } catch (e: any) {
      toast.error(`Gagal: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const addToFoodLog = async (s: FoodSuggestion) => {
    setAddingName(s.name)
    try {
      const res = await fetch('/api/food/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType,
          foodName: s.name,
          calories: s.calories,
          protein: s.protein,
          carbs: s.carbs,
          fats: s.fats,
          notes: 'Ditambahkan dari saran AI',
        }),
      })
      if (!res.ok) throw new Error('Gagal')
      toast.success(`"${s.name}" ditambahkan ke log hari ini`)
    } catch (e: any) {
      toast.error(`Gagal: ${e.message}`)
    } finally {
      setAddingName(null)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 rounded-2xl">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Jenis Makan</Label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">Sarapan</SelectItem>
                  <SelectItem value="lunch">Makan Siang</SelectItem>
                  <SelectItem value="dinner">Makan Malam</SelectItem>
                  <SelectItem value="snack">Camilan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Catatan (opsional)</Label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="cth: mau yang ringan"
                className="h-9"
              />
            </div>
          </div>
          <Button onClick={generate} disabled={loading} className="w-full gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                AI berpikir...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Minta Saran Makanan
              </>
            )}
          </Button>
        </div>
      </Card>

      {data && (
        <>
          {/* Context */}
          <Card className="p-3 rounded-2xl bg-muted/30">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <ContextStat
                label="Sisa Kalori"
                value={`${data.context.remaining.calories}`}
                sub="kkal"
                icon={Flame}
                color="text-orange-500"
              />
              <ContextStat
                label="Sisa Protein"
                value={`${data.context.remaining.protein}`}
                sub="g"
                icon={Plus}
                color="text-rose-500"
              />
              <ContextStat
                label="Gym Hari Ini"
                value={`${data.context.gymTodayMinutes}`}
                sub="menit"
                icon={Clock}
                color="text-emerald-500"
              />
              <ContextStat
                label="Rata-rata 7hr"
                value={`${data.context.avgCalPerDay}`}
                sub="kkal/hr"
                icon={TrendingUp}
                color="text-violet-500"
              />
            </div>
          </Card>

          {/* Suggestions */}
          <div className="space-y-2">
            <AnimatePresence>
              {data.suggestions.map((s, i) => (
                <motion.div
                  key={`${s.name}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="p-3 rounded-2xl">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm">{s.name}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Flame className="h-3 w-3 text-orange-500" />
                            {s.calories} kkal
                          </span>
                          <span>P {s.protein}g</span>
                          <span>C {s.carbs}g</span>
                          <span>F {s.fats}g</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          {s.reason}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addToFoodLog(s)}
                        disabled={addingName === s.name}
                        className="shrink-0 gap-1"
                      >
                        {addingName === s.name ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        Log
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}

// ============ Tab 2: Plan Generator ============
function PlanGenerateTab() {
  const { setActiveView } = useUIStore()
  const [goal, setGoal] = React.useState('')
  const [timeframe, setTimeframe] = React.useState('month')
  const [context, setContext] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<PlanGenResponse | null>(null)
  const [creating, setCreating] = React.useState(false)

  const generate = async () => {
    if (!goal.trim()) return toast.error('Goal wajib diisi')
    setLoading(true)
    setData(null)
    try {
      const res = await fetch('/api/ai/plan-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: goal.trim(),
          timeframe,
          context: context.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal')
      setData(json)
      toast.success('Rencana siap! Review lalu buat.')
    } catch (e: any) {
      toast.error(`Gagal: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createPlan = async () => {
    if (!data) return
    setCreating(true)
    try {
      // Create plan
      const planRes = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.plan.title,
          description: data.plan.description,
          color: data.plan.color,
          targetDate: data.plan.targetDate,
        }),
      })
      if (!planRes.ok) throw new Error('Gagal membuat plan')
      const plan = await planRes.json()

      // Create milestones
      for (const m of data.plan.milestones) {
        const due = new Date()
        due.setDate(due.getDate() + m.dueOffsetDays)
        await fetch('/api/milestones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: plan.id,
            title: m.title,
            dueDate: due.toISOString(),
          }),
        })
      }

      toast.success(`Plan "${plan.title}" + ${data.plan.milestones.length} milestone dibuat!`)
      setActiveView('plans')
    } catch (e: any) {
      toast.error(`Gagal: ${e.message}`)
    } finally {
      setCreating(false)
    }
  }

  const examples = [
    'Lari 10km tanpa henti',
    'Naikkan berat bench press ke 80kg',
    'Selesaikan kursus React sampai mahir',
    'Menabung 5 juta dalam 3 bulan',
    'Bangun pagi jam 5 setiap hari',
  ]

  return (
    <div className="space-y-4">
      <Card className="p-4 rounded-2xl space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="goal">Goal / Target</Label>
          <Textarea
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="cth: Saya ingin bisa lari 10km tanpa henti dalam 2 bulan"
            rows={2}
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Timeframe</Label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">1 Minggu</SelectItem>
                <SelectItem value="month">1 Bulan</SelectItem>
                <SelectItem value="quarter">3 Bulan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Konteks (opsional)</Label>
            <Input
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="cth: pemula, 3x gym/minggu"
              className="h-9"
            />
          </div>
        </div>
        <Button onClick={generate} disabled={loading} className="w-full gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              AI menyusun rencana...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Buatkan Rencana
            </>
          )}
        </Button>
      </Card>

      {!data && !loading && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Contoh goal:</p>
          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setGoal(ex)}
                className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-accent transition-colors text-muted-foreground"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {data && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4 rounded-2xl">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      'h-2.5 w-2.5 rounded-full',
                      PLAN_COLOR_DOT[data.plan.color] || PLAN_COLOR_DOT.emerald
                    )}
                  />
                  <h3 className="font-bold text-base">{data.plan.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{data.plan.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: {new Date(data.plan.targetDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-3 mt-3">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">
                {data.plan.milestones.length} Milestone
              </h4>
              <div className="space-y-2">
                {data.plan.milestones.map((m, i) => {
                  const due = new Date()
                  due.setDate(due.getDate() + m.dueOffsetDays)
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="flex items-start gap-2"
                    >
                      <span className="text-xs font-bold text-primary mt-0.5">
                        {i + 1}.
                      </span>
                      <div className="flex-1">
                        <p className="text-sm">{m.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {m.dueOffsetDays} hari lagi •{' '}
                          {due.toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-3 border-t border-border">
              <Button onClick={createPlan} disabled={creating} className="flex-1 gap-2">
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Membuat...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Buat Plan & Milestones
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={generate} disabled={loading}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

// ============ Tab 3: Insights ============
function InsightsTab() {
  const [loading, setLoading] = React.useState(false)
  const [data, setData] = React.useState<InsightsResponse | null>(null)

  const generate = async () => {
    setLoading(true)
    setData(null)
    try {
      const res = await fetch('/api/ai/insights')
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal')
      setData(json)
      toast.success('Insight siap!')
    } catch (e: any) {
      toast.error(`Gagal: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    generate()
  }, [])

  const severityConfig = {
    positive: {
      icon: ThumbsUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-l-emerald-500',
      label: 'Positif',
    },
    neutral: {
      icon: Info,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-l-blue-500',
      label: 'Observasi',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-l-amber-500',
      label: 'Perhatian',
    },
  }

  const typeLabel: Record<string, string> = {
    productivity: 'Produktivitas',
    food: 'Makanan',
    gym: 'Gym',
    work: 'Kerja',
    plans: 'Rencana',
  }

  return (
    <div className="space-y-4">
      {loading && (
        <Card className="p-8 rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              AI sedang menganalisis 30 hari data Anda...
            </p>
            <p className="text-xs text-muted-foreground/70">
              Mengumpulkan tasks, makanan, gym, kerja, dan rencana
            </p>
          </div>
        </Card>
      )}

      {data && (
        <>
          {/* Summary */}
          <Card className="p-4 rounded-2xl bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm mb-1">Ringkasan</h3>
                <p className="text-sm text-muted-foreground">{data.summary}</p>
              </div>
            </div>
          </Card>

          {/* Stats overview */}
          {data.rawStats && (
            <Card className="p-3 rounded-2xl">
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <ContextStat
                  label="Tugas Selesai"
                  value={`${data.rawStats.tasks?.done ?? 0}`}
                  sub={`/${data.rawStats.tasks?.done + data.rawStats.tasks?.pending ?? 0}`}
                  icon={Check}
                  color="text-emerald-500"
                />
                <ContextStat
                  label="Sesi Gym"
                  value={`${data.rawStats.gym?.totalSessions ?? 0}`}
                  sub="30 hari"
                  icon={Dumbbell}
                  color="text-rose-500"
                />
                <ContextStat
                  label="Rata Kalori"
                  value={`${data.rawStats.food?.avgCaloriesPerDay ?? 0}`}
                  sub="kkal/hr"
                  icon={Flame}
                  color="text-orange-500"
                />
                <ContextStat
                  label="Fokus Kerja"
                  value={`${Math.round((data.rawStats.work?.totalFocusMinutes ?? 0) / 60)}`}
                  sub="jam"
                  icon={Clock}
                  color="text-violet-500"
                />
              </div>
            </Card>
          )}

          {/* Insights */}
          <div className="space-y-2">
            <AnimatePresence>
              {data.insights.map((ins, i) => {
                const cfg =
                  severityConfig[ins.severity as keyof typeof severityConfig] ||
                  severityConfig.neutral
                const Icon = cfg.icon
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Card
                      className={cn(
                        'p-4 rounded-2xl border-l-4',
                        cfg.border
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('rounded-lg p-2', cfg.bg)}>
                          <Icon className={cn('h-4 w-4', cfg.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-sm">{ins.title}</h4>
                            <Badge variant="secondary" className="text-[10px]">
                              {typeLabel[ins.type] || ins.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {ins.body}
                          </p>
                          {ins.recommendation && (
                            <div
                              className={cn(
                                'text-xs rounded-md p-2',
                                cfg.bg,
                                cfg.color
                              )}
                            >
                              <span className="font-medium">💡 Saran: </span>
                              {ins.recommendation}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          <Button
            onClick={generate}
            variant="outline"
            className="w-full gap-2"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Analisis Ulang
          </Button>
        </>
      )}
    </div>
  )
}

// ============ Shared Context Stat ============
function ContextStat({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub: string
  color: string
}) {
  return (
    <div>
      <Icon className={cn('h-4 w-4 mx-auto mb-1', color)} />
      <div className="font-bold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
      <div className="text-[9px] text-muted-foreground/70 mt-0.5">{label}</div>
    </div>
  )
}
