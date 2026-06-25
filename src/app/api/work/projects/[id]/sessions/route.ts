import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const projectId = (await params).id
  const body = await req.json()
  const start = body.start ? new Date(body.start) : new Date()
  const end = body.end ? new Date(body.end) : null
  const duration = end ? Math.round((end.getTime() - start.getTime()) / 60000) : 0
  const session = await db.workSession.create({
    data: {
      projectId,
      start,
      end,
      duration,
      notes: body.notes ?? null,
    },
  })
  return NextResponse.json(session, { status: 201 })
}
