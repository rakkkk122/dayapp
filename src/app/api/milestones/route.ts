import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/milestones — body: { planId, title, dueDate? }
export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.planId) {
    return NextResponse.json({ error: 'planId required' }, { status: 400 })
  }
  const milestone = await db.planMilestone.create({
    data: {
      planId: body.planId,
      title: body.title,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  })
  return NextResponse.json(milestone, { status: 201 })
}
