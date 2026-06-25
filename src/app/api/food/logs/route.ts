import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  let where = {}
  if (date) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    where = { date: { gte: start, lte: end } }
  }
  const logs = await db.foodLog.findMany({ where, orderBy: { date: 'asc' } })
  return NextResponse.json(logs)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const log = await db.foodLog.create({
    data: {
      date: body.date ? new Date(body.date) : new Date(),
      mealType: body.mealType ?? 'snack',
      foodName: body.foodName,
      calories: body.calories ?? 0,
      protein: body.protein ?? 0,
      carbs: body.carbs ?? 0,
      fats: body.fats ?? 0,
      notes: body.notes ?? null,
    },
  })
  return NextResponse.json(log, { status: 201 })
}
