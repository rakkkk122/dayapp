import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const workoutId = (await params).id
  const body = await req.json()
  const exercise = await db.gymExercise.create({
    data: {
      workoutId,
      name: body.name,
      sets: body.sets ?? 3,
      reps: body.reps ?? 10,
      weight: body.weight ?? 0,
      notes: body.notes ?? null,
    },
  })
  return NextResponse.json(exercise, { status: 201 })
}
