import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const log = await db.foodLog.update({
    where: { id },
    data: {
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.mealType !== undefined && { mealType: body.mealType }),
      ...(body.foodName !== undefined && { foodName: body.foodName }),
      ...(body.calories !== undefined && { calories: body.calories }),
      ...(body.protein !== undefined && { protein: body.protein }),
      ...(body.carbs !== undefined && { carbs: body.carbs }),
      ...(body.fats !== undefined && { fats: body.fats }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  })
  return NextResponse.json(log)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.foodLog.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
