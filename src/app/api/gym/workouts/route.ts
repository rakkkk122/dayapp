import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const workouts = await db.gymWorkout.findMany({
    include: { exercises: true },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(workouts)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const workout = await db.gymWorkout.create({
    data: {
      date: body.date ? new Date(body.date) : new Date(),
      type: body.type ?? 'strength',
      duration: body.duration ?? 0,
      notes: body.notes ?? null,
    },
    include: { exercises: true },
  })
  return NextResponse.json(workout, { status: 201 })
}
