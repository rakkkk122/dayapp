'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  CheckSquare,
  Bell,
  Dumbbell,
  UtensilsCrossed,
  Briefcase,
  Target,
  ChevronRight,
  Flame,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useUIStore } from '@/store/ui-store'
import { relativeTime, formatTime, formatDuration } from '@/lib/utils'

interface DashboardData {
  date: string
  stats: {
    tasksPending: number
    tasksToday: number
    tasksDone: number
    remindersUpcoming: number
    todayCalories: number
    todayProtein: number
    weekWorkoutMinutes: number
    weekWorkMinutes: number
    activePlansCount: number
  }
  todayTasks: Array<{
    id: string
    title: string
    priority: string
    dueDate: string | null
    category: string
  }>
  upcomingReminders: Array<{
    id: string
    title: string
    datetime: string
    repeat: string | null
  }>
  planProgress: Array<{
    id: string
    title: string
    color: string
    progress: number
  }>
}

const PRIORITY_STYLE: Record<string, string> = {
  high: 'bg-red-500/15 text-red-600 dark:text-red-400',
  medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  low: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
}

const PRIORITY_LABEL: Record<string, string> = {
  high: 'Tinggi',
  medium: 'Sedang',
  low: 'Rendah',
}

export function DashboardView() {
  const { setActiveView } = useUIStore()
  const [data, setData] = React.useState<DashboardData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    try {
      setErrorMsg(null)
      const res = await fetch('/api/dashboard')
      if (!res.ok) {
        // Coba ambil pesan error dari response body
        let detail = `HTTP ${res.status}`
        try {
          const errBody = await res.json()
          if (errBody?.error) detail = errBody.error
        } catch {}
        throw new Error(detail)
      }
      const json = await res.json()
      setData(json)
    } catch (e: any) {
      console.error('Dashboard load error:', e)
      setErrorMsg(e?.message || 'Gagal memuat dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  if (loading && !data && !errorMsg) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (errorMsg && !data) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-bold text-destructive mb-2">
            Gagal Memuat Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Error: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{errorMsg}</code>
          </p>
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg text-left space-y-1.5">
            <p className="font-semibold text-foreground">Kemungkinan penyebab:</p>
            <p>• Prisma engine belum ter-setup dengan benar (arch mismatch)</p>
            <p>• Database belum di-init</p>
            <p className="mt-2 font-semibold text-foreground">Solusi:</p>
            <p>1. Jalankan: <code className="bg-background px-1 rounded">bash fix-prisma-engine.sh</code></p>
            <p>2. Restart: <code className="bg-background px-1 rounded">bash start-termux.sh</code></p>
            <p>3. Refresh halaman ini</p>
          </div>
          <button
            onClick={() => load()}
            className="mt-4 text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const stats = [
    {
      label: 'Tugas Hari Ini',
      value: data.stats.tasksToday,
      sub: `${data.stats.tasksPending} total pending`,
      icon: CheckSquare,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
      onClick: () => setActiveView('tasks'),
    },
    {
      label: 'Reminder Aktif',
      value: data.stats.remindersUpcoming,
      sub: 'akan datang',
      icon: Bell,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
      onClick: () => setActiveView('reminders'),
    },
    {
      label: 'Kalori Hari Ini',
      value: data.stats.todayCalories,
      sub: `${data.stats.todayProtein}g protein`,
      icon: Flame,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-500/10',
      onClick: () => setActiveView('food'),
    },
    {
      label: 'Gym Minggu Ini',
      value: formatDuration(data.stats.weekWorkoutMinutes),
      sub: 'total latihan',
      icon: Dumbbell,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10',
      onClick: () => setActiveView('gym'),
    },
    {
      label: 'Kerja Minggu Ini',
      value: formatDuration(data.stats.weekWorkMinutes),
      sub: 'waktu fokus',
      icon: Briefcase,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-500/10',
      onClick: () => setActiveView('work'),
    },
    {
      label: 'Rencana Aktif',
      value: data.stats.activePlansCount,
      sub: 'target berjalan',
      icon: Target,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-500/10',
      onClick: () => setActiveView('plans'),
    },
  ]

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-sm text-muted-foreground">{today}</p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-0.5">
          Halo, semangat hari ini!
        </h1>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.button
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.25 }}
              onClick={s.onClick}
              className="text-left"
            >
              <Card className="p-4 hover:shadow-md transition-shadow rounded-2xl h-full">
                <div className={`inline-flex rounded-xl ${s.bg} p-2 mb-3`}>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div className="text-2xl font-bold tracking-tight">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                <div className="text-[10px] text-muted-foreground/70 mt-1">{s.sub}</div>
              </Card>
            </motion.button>
          )
        })}
      </div>

      {/* Today's tasks */}
      <Card className="p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            Tugas Hari Ini
          </h2>
          <button
            onClick={() => setActiveView('tasks')}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
          >
            Lihat semua <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        {data.todayTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3">
            Tidak ada tugas untuk hari ini. Santai saja!
          </p>
        ) : (
          <div className="space-y-2">
            {data.todayTasks.slice(0, 5).map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
              >
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLE[t.priority] || PRIORITY_STYLE.medium}`}
                >
                  {PRIORITY_LABEL[t.priority] || 'Sedang'}
                </span>
                <span className="flex-1 text-sm truncate">{t.title}</span>
                {t.dueDate && (
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(t.dueDate)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Upcoming reminders */}
      <Card className="p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Reminder Akan Datang
          </h2>
          <button
            onClick={() => setActiveView('reminders')}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
          >
            Lihat semua <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        {data.upcomingReminders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3">
            Tidak ada reminder aktif.
          </p>
        ) : (
          <div className="space-y-2">
            {data.upcomingReminders.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
              >
                <Bell className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {relativeTime(r.datetime)} • {formatTime(r.datetime)}
                  </p>
                </div>
                {r.repeat && r.repeat !== 'none' && (
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {r.repeat}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Plan progress */}
      {data.planProgress.length > 0 && (
        <Card className="p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Progres Rencana
            </h2>
            <button
              onClick={() => setActiveView('plans')}
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
            >
              Kelola <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {data.planProgress.slice(0, 4).map((p) => (
              <div key={p.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="truncate">{p.title}</span>
                  <span className="text-muted-foreground">{p.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${p.progress}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
