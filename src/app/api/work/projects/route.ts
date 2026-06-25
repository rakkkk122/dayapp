import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const projects = await db.workProject.findMany({
    include: { sessions: true },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const project = await db.workProject.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      color: body.color ?? 'amber',
      status: body.status ?? 'active',
      deadline: body.deadline ? new Date(body.deadline) : null,
    },
    include: { sessions: true },
  })
  return NextResponse.json(project, { status: 201 })
}
