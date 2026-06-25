import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const project = await db.workProject.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.color !== undefined && { color: body.color }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.deadline !== undefined && {
        deadline: body.deadline ? new Date(body.deadline) : null,
      }),
    },
    include: { sessions: true },
  })
  return NextResponse.json(project)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.workProject.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
