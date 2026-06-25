import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const reminder = await db.reminder.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.datetime !== undefined && { datetime: new Date(body.datetime) }),
      ...(body.repeat !== undefined && { repeat: body.repeat }),
      ...(body.done !== undefined && { done: body.done }),
    },
  })
  return NextResponse.json(reminder)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.reminder.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
