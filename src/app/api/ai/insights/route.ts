import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { askAIJSON } from '@/lib/ai'

/**
 * GET /api/ai/insights
 * Analyzes last 30 days of all user data and returns insights + recommendations.
 * Returns: { insights: [{ type, title, body, severity }], summary }
 */
export async function GET() {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)

    const [tasks, reminders, plans, workouts, foodLogs, workProjects] = await Promise.all([
      db.task.findMany({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.reminder.findMany({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.plan.findMany({ include: { milestones: true } }),
      db.gymWorkout.findMany({
        where: { date: { gte: thirtyDaysAgo } },
        include: { exercises: true },
      }),
      db.foodLog.findMany({ where: { date: { gte: thirtyDaysAgo } } }),
      db.workProject.findMany({
        include: { sessions: { where: { start: { gte: thirtyDaysAgo } } } },
      }),
    ])

    // Aggregates
    const tasksDone = tasks.filter((t) => t.status === 'done').length
    const tasksPending = tasks.filter((t) => t.status === 'pending').length
    const overdueTasks = tasks.filter(
      (t) => t.status === 'pending' && t.dueDate && new Date(t.dueDate) < now
    ).length

    const workoutMinutes = workouts.reduce((s, w) => s + w.duration, 0)
    const workoutCount = workouts.length
    const workoutTypes = workouts.reduce<Record<string, number>>((acc, w) => {
      acc[w.type] = (acc[w.type] || 0) + 1
      return acc
    }, {})

    const totalCal = foodLogs.reduce((s, l) => s + l.calories, 0)
    const avgCalPerDay = Math.round(totalCal / 30)
    const avgProtein = Math.round(foodLogs.reduce((s, l) => s + l.protein, 0) / 30)
    const mealDistribution = foodLogs.reduce<Record<string, number>>((acc, l) => {
      acc[l.mealType] = (acc[l.mealType] || 0) + 1
      return acc
    }, {})

    const workMinutes = workProjects.reduce(
      (s, p) => s + p.sessions.reduce((a, b) => a + b.duration, 0),
      0
    )

    const activePlans = plans.filter((p) => p.status === 'active')
    const planProgress = activePlans.map((p) => ({
      title: p.title,
      progress:
        p.milestones.length === 0
          ? 0
          : Math.round(
              (p.milestones.filter((m) => m.done).length / p.milestones.length) * 100
            ),
    }))

    // Group food by day-of-week to find patterns
    const foodByDay: Record<number, { cal: number; count: number }> = {}
    foodLogs.forEach((l) => {
      const day = new Date(l.date).getDay()
      if (!foodByDay[day]) foodByDay[day] = { cal: 0, count: 0 }
      foodByDay[day].cal += l.calories
      foodByDay[day].count += 1
    })

    // Group workouts by day-of-week
    const workoutByDay: Record<number, number> = {}
    workouts.forEach((w) => {
      const day = new Date(w.date).getDay()
      workoutByDay[day] = (workoutByDay[day] || 0) + 1
    })

    const dataSummary = {
      range: '30 hari terakhir',
      tasks: { done: tasksDone, pending: tasksPending, overdue: overdueTasks },
      gym: {
        totalSessions: workoutCount,
        totalMinutes: workoutMinutes,
        types: workoutTypes,
        byDayOfWeek: workoutByDay,
      },
      food: {
        avgCaloriesPerDay: avgCalPerDay,
        avgProteinPerDay: avgProtein,
        mealDistribution,
        byDayOfWeek: Object.fromEntries(
          Object.entries(foodByDay).map(([k, v]) => [
            k,
            Math.round(v.cal / Math.max(1, v.count)),
          ])
        ),
      },
      work: { totalFocusMinutes: workMinutes, activeProjects: workProjects.length },
      plans: { activeCount: activePlans.length, progressList: planProgress },
    }

    const systemPrompt = `Kamu adalah life coach personal yang menganalisis pola hidup user 30 hari terakhir.
Tugas: temukan POLA dan INSIGHT yang bermanfaat, lalu berikan REKOMENDASI konkret.

Fokus pada:
1. Pola produktivitas (hari apa user produktif/stand-by)
2. Pola makan (kalori naik/turun, distribusi makro)
3. Pola gym (konsistensi, jenis latihan dominan)
4. Pola kerja (durasi fokus, distribusi proyek)
5. Progress rencana
6. Hal yang mungkin user TIDAK sadari

Setiap insight harus:
- Berdasarkan DATA NYATA (sebutkan angka)
- Punya severity: 'positive' (hal bagus), 'neutral' (observasi), 'warning' (perlu perhatian)
- Punya rekomendasi konkret & actionable

WAJIB jawab dengan JSON valid saja (tanpa markdown fence), format:
{
  "summary": "1-2 kalimat ringkasan keseluruhan",
  "insights": [
    {
      "type": "productivity" | "food" | "gym" | "work" | "plans",
      "severity": "positive" | "neutral" | "warning",
      "title": "...",
      "body": "3-4 kalimat penjelasan dengan angka konkret",
      "recommendation": "1-2 kalimat apa yang harus dilakukan"
    }
  ]
}
Berikan 3-5 insight terpenting saja (jangan semua).`

    const userMessage = `Berikut ringkasan data 30 hari user:\n${JSON.stringify(dataSummary, null, 2)}\n\nAnalisis dan berikan insight.`

    const result = await askAIJSON<{
      summary: string
      insights: Array<{
        type: string
        severity: 'positive' | 'neutral' | 'warning'
        title: string
        body: string
        recommendation: string
      }>
    }>(systemPrompt, userMessage, { temperature: 0.6 })

    return NextResponse.json({
      ok: true,
      generatedAt: now.toISOString(),
      dataRange: dataSummary.range,
      summary: result.summary || '',
      insights: result.insights || [],
      rawStats: dataSummary,
    })
  } catch (e: any) {
    console.error('[ai/insights]', e)
    return NextResponse.json(
      { ok: false, error: e.message || 'AI request failed' },
      { status: 500 }
    )
  }
}
