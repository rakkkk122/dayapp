import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const tasks = await db.task.findMany({ orderBy: [{ status: 'asc' }, { createdAt: 'desc' }] })
  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const task = await db.task.create({
    data: {
      title: body.title,
      notes: body.notes ?? null,
      priority: body.priority ?? 'medium',
      category: body.category ?? 'personal',
      status: body.status ?? 'pending',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  })
  return NextResponse.json(task, { status: 201 })
}
