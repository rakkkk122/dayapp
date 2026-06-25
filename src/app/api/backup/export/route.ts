import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/backup/export
 * Returns a JSON file containing all user data.
 */
export async function GET() {
  const [
    tasks,
    reminders,
    plans,
    milestones,
    workouts,
    exercises,
    foodLogs,
    workProjects,
    workSessions,
  ] = await Promise.all([
    db.task.findMany(),
    db.reminder.findMany(),
    db.plan.findMany(),
    db.planMilestone.findMany(),
    db.gymWorkout.findMany(),
    db.gymExercise.findMany(),
    db.foodLog.findMany(),
    db.workProject.findMany(),
    db.workSession.findMany(),
  ])

  const payload = {
    version: 1,
    app: 'dailylife',
    exportedAt: new Date().toISOString(),
    data: {
      tasks,
      reminders,
      plans,
      milestones,
      workouts,
      exercises,
      foodLogs,
      workProjects,
      workSessions,
    },
  }

  const stamp = new Date().toISOString().slice(0, 10)
  const filename = `dailylife-backup-${stamp}.json`

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
