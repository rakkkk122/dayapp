import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const task = await db.task.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
      ...(body.status === 'done' && { completedAt: new Date() }),
    },
  })
  return NextResponse.json(task)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.task.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
