import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const reminders = await db.reminder.findMany({ orderBy: [{ done: 'asc' }, { datetime: 'asc' }] })
  return NextResponse.json(reminders)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const reminder = await db.reminder.create({
    data: {
      title: body.title,
      notes: body.notes ?? null,
      datetime: new Date(body.datetime),
      repeat: body.repeat ?? null,
    },
  })
  return NextResponse.json(reminder, { status: 201 })
}
