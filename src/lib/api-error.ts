import { NextResponse } from 'next/server'

/**
 * Handle Prisma errors with user-friendly messages.
 * Returns a NextResponse with appropriate status code and message.
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  const err = error as any
  const msg = err?.message || String(error)
  const ctx = context ? `[${context}] ` : ''

  // Prisma client not initialized (engine not loaded)
  if (msg.includes('did not initialize yet') || msg.includes("Cannot find module '.prisma/client")) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Prisma client belum siap. Jalankan: bash fix-prisma-engine.sh lalu restart server.',
        detail: msg,
      },
      { status: 500 }
    )
  }

  // Architecture mismatch (x86_64 vs ARM64)
  if (msg.includes('EM_X86_64') || msg.includes('EM_AARCH64') || msg.includes('compatible with your system')) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Prisma engine architecture mismatch. Jalankan: bash fix-prisma-engine.sh',
        detail: msg,
      },
      { status: 500 }
    )
  }

  // Database not found / can't connect
  if (msg.includes('P1003') || msg.includes("database file") || msg.includes("Can't reach database")) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Database tidak ditemukan. Jalankan: npx prisma db push',
        detail: msg,
      },
      { status: 500 }
    )
  }

  // Generic error
  console.error(`${ctx}API Error:`, error)
  return NextResponse.json(
    {
      ok: false,
      error: msg.slice(0, 500),
    },
    { status: 500 }
  )
}
