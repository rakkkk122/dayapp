import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format date for datetime-local input */
export function toLocalInput(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return ''
  const off = date.getTimezoneOffset()
  const local = new Date(date.getTime() - off * 60000)
  return local.toISOString().slice(0, 16)
}

export function toLocalDateInput(d: Date | string | null | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return ''
  const off = date.getTimezoneOffset()
  const local = new Date(date.getTime() - off * 60000)
  return local.toISOString().slice(0, 10)
}

export function formatTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(d: Date | string): string {
  return `${formatDate(d)} • ${formatTime(d)}`
}

export function relativeTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const diff = date.getTime() - Date.now()
  const abs = Math.abs(diff)
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  const rtf = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })
  if (abs < hour) return rtf.format(Math.round(diff / minute), 'minute')
  if (abs < day) return rtf.format(Math.round(diff / hour), 'hour')
  if (abs < 7 * day) return rtf.format(Math.round(diff / day), 'day')
  return formatDate(date)
}

export function isToday(d: Date | string): boolean {
  const date = typeof d === 'string' ? new Date(d) : d
  const now = new Date()
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

export function isSameDay(a: Date | string, b: Date | string): boolean {
  const da = typeof a === 'string' ? new Date(a) : a
  const db = typeof b === 'string' ? new Date(b) : b
  return (
    da.getDate() === db.getDate() &&
    da.getMonth() === db.getMonth() &&
    da.getFullYear() === db.getFullYear()
  )
}

export function startOfDay(d: Date = new Date()): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}j` : `${h}j ${m}m`
}
