import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const [tasks, reminders, plans, workouts, foodLogs, workProjects] = await Promise.all([
    db.task.findMany({ orderBy: [{ status: 'asc' }, { createdAt: 'desc' }] }),
    db.reminder.findMany({ where: { done: false }, orderBy: { datetime: 'asc' } }),
    db.plan.findMany({ where: { status: 'active' }, include: { milestones: true } }),
    db.gymWorkout.findMany({ where: { date: { gte: startOfWeek } }, orderBy: { date: 'desc' } }),
    db.foodLog.findMany({ where: { date: { gte: startOfDay, lte: endOfDay } } }),
    db.workProject.findMany({ where: { status: 'active' }, include: { sessions: true } }),
  ])

  const todayTasks = tasks.filter(
    (t) =>
      t.status === 'pending' &&
      (!t.dueDate || (t.dueDate >= startOfDay && t.dueDate <= endOfDay))
  )
  const upcomingReminders = reminders
    .filter((r) => r.datetime >= now)
    .slice(0, 5)
  const todayCalories = foodLogs.reduce((s, l) => s + l.calories, 0)
  const todayProtein = foodLogs.reduce((s, l) => s + l.protein, 0)
  const weekWorkoutMinutes = workouts.reduce((s, w) => s + w.duration, 0)
  const activePlansCount = plans.length
  const planProgress = plans.map((p) => ({
    id: p.id,
    title: p.title,
    color: p.color,
    progress:
      p.milestones.length === 0
        ? 0
        : Math.round(
            (p.milestones.filter((m) => m.done).length / p.milestones.length) * 100
          ),
  }))

  // Work: this week total minutes
  const weekWorkMinutes = workProjects.reduce(
    (s, p) =>
      s +
      p.sessions
        .filter((sess) => sess.start >= startOfWeek)
        .reduce((a, b) => a + b.duration, 0),
    0
  )

  return NextResponse.json({
    date: now.toISOString(),
    stats: {
      tasksPending: tasks.filter((t) => t.status === 'pending').length,
      tasksToday: todayTasks.length,
      tasksDone: tasks.filter((t) => t.status === 'done').length,
      remindersUpcoming: reminders.length,
      todayCalories,
      todayProtein: Math.round(todayProtein),
      weekWorkoutMinutes,
      weekWorkMinutes,
      activePlansCount,
    },
    todayTasks,
    upcomingReminders,
    planProgress,
  })
}
