import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  let duration: number | undefined
  let end: Date | null | undefined
  if (body.end) {
    end = new Date(body.end)
    // need start to compute duration; fetch first
    const existing = await db.workSession.findUnique({ where: { id } })
    if (existing) {
      duration = Math.round((end.getTime() - existing.start.getTime()) / 60000)
    }
  }
  const session = await db.workSession.update({
    where: { id },
    data: {
      ...(end !== undefined && { end }),
      ...(duration !== undefined && { duration }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  })
  return NextResponse.json(session)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.workSession.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
