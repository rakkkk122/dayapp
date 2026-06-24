import { NextRequest, NextResponse } from 'next/server'
import { askAIJSON } from '@/lib/ai'

/**
 * POST /api/ai/plan-generate
 * Body: { goal: string, timeframe?: 'week'|'month'|'quarter', context?: string }
 * Returns: { title, description, color, targetDate, milestones: [{title, dueOffsetDays}] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const goal: string = (body.goal || '').trim()
    if (!goal) {
      return NextResponse.json({ error: 'goal wajib diisi' }, { status: 400 })
    }
    const timeframe: string = body.timeframe || 'month'
    const context: string = body.context || ''

    // Compute target date from timeframe
    const now = new Date()
    const targetDate = new Date(now)
    if (timeframe === 'week') targetDate.setDate(now.getDate() + 7)
    else if (timeframe === 'month') targetDate.setMonth(now.getMonth() + 1)
    else if (timeframe === 'quarter') targetDate.setMonth(now.getMonth() + 3)
    else targetDate.setMonth(now.getMonth() + 1)

    const systemPrompt = `Kamu adalah coach personal goal-setting.
Berdasarkan deskripsi goal user, buat PLAN lengkap dengan milestones yang SMART (Specific, Measurable, Achievable, Relevant, Time-bound).

Aturan:
1. Buat 3-6 milestone yang berurutan (dari awal ke akhir)
2. Setiap milestone punya dueOffsetDays = berapa hari dari SEKARANG milestone itu harus selesai
3. Milestone terakhir harus selesai tepat di targetDate
4. Bahasa Indonesia, singkat dan actionable
5. Pilih warna yang sesuai: emerald (kesehatan/kebugaran), amber (kerja/karier), rose (kreatif/hobi), violet (belajar/skill), teal (finansial), orange (lainnya)

WAJIB jawab dengan JSON valid saja (tanpa markdown fence), format:
{
  "title": "...",
  "description": "1-2 kalimat kenapa goal ini penting",
  "color": "emerald" | "amber" | "rose" | "violet" | "teal" | "orange",
  "milestones": [
    { "title": "...", "dueOffsetDays": 7 }
  ]
}`

    const userMessage = `Goal: ${goal}
Timeframe: ${timeframe} (target tanggal: ${targetDate.toISOString().slice(0, 10)})
${context ? `Konteks tambahan: ${context}` : ''}

Buatkan plan lengkap dengan milestones.`

    const result = await askAIJSON<{
      title: string
      description: string
      color: string
      milestones: Array<{ title: string; dueOffsetDays: number }>
    }>(systemPrompt, userMessage, { temperature: 0.7 })

    // Validate / normalize
    if (!result.title || !Array.isArray(result.milestones)) {
      throw new Error('Format AI tidak valid')
    }
    const validColors = ['emerald', 'amber', 'rose', 'violet', 'teal', 'orange']
    if (!validColors.includes(result.color)) result.color = 'emerald'

    return NextResponse.json({
      ok: true,
      targetDate: targetDate.toISOString(),
      plan: {
        title: result.title,
        description: result.description || '',
        color: result.color,
        targetDate: targetDate.toISOString(),
        milestones: result.milestones.map((m, i) => ({
          title: m.title,
          dueOffsetDays: Math.max(1, Math.min(365, Number(m.dueOffsetDays) || (i + 1) * 7)),
        })),
      },
    })
  } catch (e: any) {
    console.error('[ai/plan-generate]', e)
    return NextResponse.json(
      { ok: false, error: e.message || 'AI request failed' },
      { status: 500 }
    )
  }
}
