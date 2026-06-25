import ZAI from 'z-ai-web-dev-sdk'

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

/** Get a shared ZAI client (singleton) */
export async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

/**
 * Send a chat completion to ZAI. Returns the assistant message content.
 * The system prompt uses role: 'assistant' as per SDK convention.
 */
export async function askAI(
  systemPrompt: string,
  userMessage: string,
  opts: { temperature?: number; maxRetries?: number } = {}
): Promise<string> {
  const { temperature = 0.7, maxRetries = 2 } = opts
  const zai = await getZAI()

  let lastError: Error | null = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        thinking: { type: 'disabled' },
        temperature,
      } as any)

      const content = completion.choices?.[0]?.message?.content
      if (!content || !content.trim()) {
        throw new Error('Empty response from AI')
      }
      return content
    } catch (err: any) {
      lastError = err
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
      }
    }
  }
  throw lastError || new Error('AI request failed')
}

/**
 * Ask AI and parse the response as JSON.
 * Strips markdown fences and extracts the first JSON object/array from the response.
 */
export async function askAIJSON<T = any>(
  systemPrompt: string,
  userMessage: string,
  opts?: { temperature?: number; maxRetries?: number }
): Promise<T> {
  const raw = await askAI(systemPrompt, userMessage, opts)
  return parseAIJson<T>(raw)
}

/**
 * Robust JSON parser for AI responses.
 * Handles:
 *  - ```json ... ``` markdown fences
 *  - Plain JSON
 *  - Text before/after JSON (extracts first { ... } or [ ... ])
 *  - Trailing commas
 */
export function parseAIJson<T = any>(raw: string): T {
  let cleaned = raw.trim()

  // Strip markdown code fences ```json ... ``` or ``` ... ```
  const fenceMatch = cleaned.match(/```(?:json|JSON)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim()
  }

  // Find first { or [ and matching last } or ]
  const firstObj = cleaned.indexOf('{')
  const firstArr = cleaned.indexOf('[')
  let start = -1
  let openChar = ''
  let closeChar = ''

  if (firstObj >= 0 && (firstArr < 0 || firstObj < firstArr)) {
    start = firstObj
    openChar = '{'
    closeChar = '}'
  } else if (firstArr >= 0) {
    start = firstArr
    openChar = '['
    closeChar = ']'
  }

  if (start >= 0) {
    // Find matching close char from the end
    const lastClose = cleaned.lastIndexOf(closeChar)
    if (lastClose > start) {
      cleaned = cleaned.slice(start, lastClose + 1)
    }
  }

  // Remove trailing commas (common AI mistake)
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1')

  try {
    return JSON.parse(cleaned) as T
  } catch (e: any) {
    throw new Error(
      `AI returned non-JSON after cleanup: ${cleaned.slice(0, 300)}... | Original error: ${e.message}`
    )
  }
}
