import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const exercise = await db.gymExercise.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.sets !== undefined && { sets: body.sets }),
      ...(body.reps !== undefined && { reps: body.reps }),
      ...(body.weight !== undefined && { weight: body.weight }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  })
  return NextResponse.json(exercise)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.gymExercise.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
