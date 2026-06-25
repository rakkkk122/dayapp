import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const milestone = await db.planMilestone.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.done !== undefined && { done: body.done }),
      ...(body.dueDate !== undefined && {
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      }),
    },
  })
  return NextResponse.json(milestone)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.planMilestone.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
