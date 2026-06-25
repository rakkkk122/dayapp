import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/backup/import
 * Body: { mode?: 'merge' | 'replace', data: BackupData }
 * - mode 'merge' (default): add new records, skip conflicts on id
 * - mode 'replace': wipe all tables first, then insert
 */
export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const data = body?.data
  if (!data || typeof data !== 'object') {
    return NextResponse.json({ error: 'Missing `data` field' }, { status: 400 })
  }

  const mode: 'merge' | 'replace' = body.mode === 'replace' ? 'replace' : 'merge'

  const result = {
    inserted: {
      tasks: 0,
      reminders: 0,
      plans: 0,
      milestones: 0,
      workouts: 0,
      exercises: 0,
      foodLogs: 0,
      workProjects: 0,
      workSessions: 0,
    },
    skipped: 0,
    errors: [] as string[],
  }

  try {
    if (mode === 'replace') {
      await Promise.all([
        db.task.deleteMany(),
        db.reminder.deleteMany(),
        db.planMilestone.deleteMany(),
        db.gymExercise.deleteMany(),
        db.gymWorkout.deleteMany(),
        db.foodLog.deleteMany(),
        db.workSession.deleteMany(),
        db.workProject.deleteMany(),
      ])
      await db.plan.deleteMany()
    }

    const d = (v: any) => (v ? new Date(v) : null)

    // Plans (before milestones)
    if (Array.isArray(data.plans)) {
      for (const p of data.plans) {
        try {
          await db.plan.upsert({
            where: { id: p.id },
            update: {},
            create: {
              id: p.id,
              title: p.title,
              description: p.description ?? null,
              color: p.color ?? 'emerald',
              targetDate: d(p.targetDate),
              status: p.status ?? 'active',
              createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
              updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
            },
          })
          result.inserted.plans++
        } catch (e: any) {
          if (e?.code === 'P2002') result.skipped++
          else result.errors.push(`plan ${p.id}: ${e.message}`)
        }
      }
    }

    // Milestones
    if (Array.isArray(data.milestones)) {
      for (const m of data.milestones) {
        try {
          await db.planMilestone.upsert({
            where: { id: m.id },
            update: {},
            create: {
              id: m.id,
              planId: m.planId,
              title: m.title,
              done: !!m.done,
              dueDate: d(m.dueDate),
              createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
              updatedAt: m.updatedAt ? new Date(m.updatedAt) : new Date(),
            },
          })
          result.inserted.milestones++
        } catch (e: any) {
          if (e?.code === 'P2002') result.skipped++
          else result.errors.push(`milestone ${m.id}: ${e.message}`)
        }
      }
    }

    // Tasks
    if (Array.isArray(data.tasks)) {
      for (const t of data.tasks) {
        try {
          await db.task.upsert({
            where: { id: t.id },
            update: {},
            create: {
              id: t.id,
              title: t.title,
              notes: t.notes ?? null,
              priority: t.priority ?? 'medium',
              category: t.category ?? 'personal',
              status: t.status ?? 'pending',
              dueDate: d(t.dueDate),
              completedAt: d(t.completedAt),
              createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
              updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
            },
          })
          result.inserted.tasks++
        } catch (e: any) {
          if (e?.code === 'P2002') result.skipped++
          else result.errors.push(`task ${t.id}: ${e.message}`)
        }
      }
    }

    // Reminders
    if (Array.isArray(data.reminders)) {
      for (const r of data.reminders) {
        try {
          await db.reminder.upsert({
            where: { id: r.id },
            update: {},
            create: {
              id: r.id,
              title: r.title,
              notes: r.notes ?? null,
              datetime: new Date(r.datetime),
              repeat: r.repeat ?? null,
              done: !!r.done,
              createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
              updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
            },
          })
          result.inserted.reminders++
        } catch (e: any) {
          if (e?.code === 'P2002') result.skipped++
          else result.errors.push(`reminder ${r.id}: ${e.message}`)
        }
      }
    }

    // Workouts (before exercises)
    if (Array.isArray(data.workouts)) {
      for (const w of data.workouts) {
        try {
          await db.gymWorkout.upsert({
            where: { id: w.id },
            update: {},
            create: {
              id: w.id,
              date: w.date ? new Date(w.date) : new Date(),
              type: w.type ?? 'strength',
              duration: w.duration ?? 0,
              notes: w.notes ?? null,
              createdAt: w.createdAt ? new Date(w.createdAt) : new Date(),
              updatedAt: w.updatedAt ? new Date(w.updatedAt) : new Date(),
            },
          })
          result.inserted.workouts++
        } catch (e: any) {
          if (e?.code === 'P2002') result.skipped++
          else result.errors.push(`workout ${w.id}: ${e.message}`)
        }
      }
    }

    // Exercises
    if (Array.isArray(data.exercises)) {
      for (const e of data.exercises) {
        try {
          await db.gymExercise.upsert({
            where: { id: e.id },
            update: {},
            create: {
              id: e.id,
              workoutId: e.workoutId,
              name: e.name,
              sets: e.sets ?? 3,
              reps: e.reps ?? 10,
              weight: e.weight ?? 0,
              notes: e.notes ?? null,
              createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
            },
          })
          result.inserted.exercises++
        } catch (err: any) {
          if (err?.code === 'P2002') result.skipped++
          else result.errors.push(`exercise ${e.id}: ${err.message}`)
        }
      }
    }

    // Food logs
    if (Array.isArray(data.foodLogs)) {
      for (const f of data.foodLogs) {
        try {
          await db.foodLog.upsert({
            where: { id: f.id },
            update: {},
            create: {
              id: f.id,
              date: f.date ? new Date(f.date) : new Date(),
              mealType: f.mealType ?? 'snack',
              foodName: f.foodName,
              calories: f.calories ?? 0,
              protein: f.protein ?? 0,
              carbs: f.carbs ?? 0,
              fats: f.fats ?? 0,
              notes: f.notes ?? null,
              createdAt: f.createdAt ? new Date(f.createdAt) : new Date(),
              updatedAt: f.updatedAt ? new Date(f.updatedAt) : new Date(),
            },
          })
          result.inserted.foodLogs++
        } catch (e: any) {
          if (e?.code === 'P2002') result.skipped++
          else result.errors.push(`foodLog ${f.id}: ${e.message}`)
        }
      }
    }

    // Work projects (before sessions)
    if (Array.isArray(data.workProjects)) {
      for (const p of data.workProjects) {
        try {
          await db.workProject.upsert({
            where: { id: p.id },
            update: {},
            create: {
              id: p.id,
              title: p.title,
              description: p.description ?? null,
              color: p.color ?? 'amber',
              status: p.status ?? 'active',
              deadline: d(p.deadline),
              createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
              updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
            },
          })
          result.inserted.workProjects++
        } catch (e: any) {
          if (e?.code === 'P2002') result.skipped++
          else result.errors.push(`workProject ${p.id}: ${e.message}`)
        }
      }
    }

    // Work sessions
    if (Array.isArray(data.workSessions)) {
      for (const s of data.workSessions) {
        try {
          await db.workSession.upsert({
            where: { id: s.id },
            update: {},
            create: {
              id: s.id,
              projectId: s.projectId,
              start: s.start ? new Date(s.start) : new Date(),
              end: d(s.end),
              duration: s.duration ?? 0,
              notes: s.notes ?? null,
              createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
            },
          })
          result.inserted.workSessions++
        } catch (e: any) {
          if (e?.code === 'P2002') result.skipped++
          else result.errors.push(`workSession ${s.id}: ${e.message}`)
        }
      }
    }

    return NextResponse.json({ ok: true, mode, ...result })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message, ...result },
      { status: 500 }
    )
  }
}
