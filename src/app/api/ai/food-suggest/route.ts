import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { askAIJSON } from '@/lib/ai'

/**
 * POST /api/ai/food-suggest
 * Body: { mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack', note?: string }
 * Returns: { suggestions: [{ name, calories, protein, carbs, fats, reason }] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const mealType: string = body.mealType || 'lunch'
    const note: string = body.note || ''

    // Gather context: last 7 days food logs + today's gym sessions + targets
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)

    const [recentFood, todayWorkouts, todayFood] = await Promise.all([
      db.foodLog.findMany({
        where: { date: { gte: sevenDaysAgo } },
        orderBy: { date: 'desc' },
        take: 50,
      }),
      db.gymWorkout.findMany({
        where: {
          date: { gte: new Date(now.setHours(0, 0, 0, 0)) },
        },
        include: { exercises: true },
      }),
      db.foodLog.findMany({
        where: {
          date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ])

    // Aggregate stats
    const totalCal7d = recentFood.reduce((s, l) => s + l.calories, 0)
    const avgCalPerDay = Math.round(totalCal7d / 7)
    const avgProtein = Math.round(recentFood.reduce((s, l) => s + l.protein, 0) / 7)
    const todayCalories = todayFood.reduce((s, l) => s + l.calories, 0)
    const todayProtein = todayFood.reduce((s, l) => s + l.protein, 0)
    const gymToday = todayWorkouts.reduce((s, w) => s + w.duration, 0)

    const target = { calories: 2000, protein: 120, carbs: 250, fats: 65 }
    const remainingCalories = Math.max(0, target.calories - todayCalories)
    const remainingProtein = Math.max(0, target.protein - todayProtein)

    const context = {
      userGoal: 'maintenance / healthy eating (Indonesia context)',
      targets: target,
      todayConsumed: { calories: todayCalories, protein: Math.round(todayProtein) },
      remaining: { calories: remainingCalories, protein: remainingProtein },
      last7DaysAvg: { caloriesPerDay: avgCalPerDay, proteinGrams: avgProtein },
      gymDoneTodayMinutes: gymToday,
      requestedMeal: mealType,
      userNote: note || null,
      recentFoods: recentFood.slice(0, 10).map((f) => ({
        name: f.foodName,
        meal: f.mealType,
        cal: f.calories,
        protein: f.protein,
      })),
    }

    const systemPrompt = `Kamu adalah asisten nutrisi personal untuk user di Indonesia.
Berikan SARAN MAKANAN konkret yang:
1. Sesuai konteks Indonesia (bisa makanan nusantara, indo, atau western yang umum di sini)
2. Realistis — kalori & makro yang masuk akal untuk porsi normal
3. Membantu mencapai sisa target kalori/protein hari ini
4. Praktis — bisa dimasak sendiri atau dibeli mudah

WAJIB jawab dengan JSON valid saja (tanpa markdown fence), format:
{
  "suggestions": [
    { "name": "...", "calories": 0, "protein": 0, "carbs": 0, "fats": 0, "reason": "..." }
  ]
}
Berikan 3-4 suggestion. "reason" jelaskan singkat kenapa cocak (1 kalimat).`

    const userMessage = `Konteks data user:\n${JSON.stringify(context, null, 2)}\n\nBerikan ${3} saran makanan untuk ${mealType}.`

    const result = await askAIJSON<{
      suggestions: Array<{
        name: string
        calories: number
        protein: number
        carbs: number
        fats: number
        reason: string
      }>
    }>(systemPrompt, userMessage, { temperature: 0.6 })

    return NextResponse.json({
      ok: true,
      context: {
        todayConsumed: context.todayConsumed,
        remaining: context.remaining,
        gymTodayMinutes: gymToday,
        avgCalPerDay,
      },
      suggestions: result.suggestions || [],
    })
  } catch (e: any) {
    console.error('[ai/food-suggest]', e)
    return NextResponse.json(
      { ok: false, error: e.message || 'AI request failed' },
      { status: 500 }
    )
  }
}
