import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const plans = await db.plan.findMany({
    include: { milestones: true },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(plans)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const plan = await db.plan.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      color: body.color ?? 'emerald',
      targetDate: body.targetDate ? new Date(body.targetDate) : null,
    },
    include: { milestones: true },
  })
  return NextResponse.json(plan, { status: 201 })
}
