import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const workout = await db.gymWorkout.update({
    where: { id },
    data: {
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.duration !== undefined && { duration: body.duration }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
    include: { exercises: true },
  })
  return NextResponse.json(workout)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.gymWorkout.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
