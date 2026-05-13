import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
  format,
} from 'date-fns'

const AQI_LABELS = ['Good', 'Fair', 'Moderate', 'Poor', 'Hazardous'] as const

const AQI_TAILWIND = [
  'text-emerald-600',
  'text-lime-600',
  'text-amber-500',
  'text-orange-600',
  'text-red-600',
] as const

/** Wall-clock time from epoch milliseconds */
export function formatTimestamp(ts: number): string {
  return format(ts, 'HH:mm:ss')
}

/**
 * Compact relative time (past or future). Uses date-fns difference helpers only.
 */
export function formatRelativeTime(ts: number): string {
  const date = new Date(ts)
  const now = new Date()

  if (date <= now) {
    const sec = differenceInSeconds(now, date)
    if (sec < 60) return 'just now'
    const min = differenceInMinutes(now, date)
    if (min < 60) return `${min} min ago`
    const hrs = differenceInHours(now, date)
    if (hrs < 24) return `${hrs} hr ago`
    const days = differenceInDays(now, date)
    return `${days} days ago`
  }

  const sec = differenceInSeconds(date, now)
  if (sec < 60) return 'just now'
  const min = differenceInMinutes(date, now)
  if (min < 60) return `in ${min} min`
  const hrs = differenceInHours(date, now)
  if (hrs < 24) return `in ${hrs} hr`
  const days = differenceInDays(date, now)
  return `in ${days} days`
}

export function formatTemperature(celsius: number, unit: 'C' | 'F' = 'C'): string {
  if (unit === 'C') {
    return `${Math.round(celsius)}°C`
  }
  const f = (celsius * 9) / 5 + 32
  const rounded = Math.round(f * 10) / 10
  const display = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  return `${display}°F`
}

/** Wind at observation height: metres per second → kilometres per hour */
export function formatWindSpeed(mps: number): string {
  const kmh = Math.round(mps * 3.6)
  return `${kmh} km/h`
}

export function formatPressure(hpa: number): string {
  return `${Math.round(hpa)} hPa`
}

/** Horizontal visibility: metres → metres or kilometres */
export function formatVisibility(metres: number): string {
  if (metres >= 1000) {
    const km = Math.round((metres / 1000) * 10) / 10
    const display = Number.isInteger(km) ? String(km) : km.toFixed(1)
    return `${display} km`
  }
  return `${Math.round(metres)} m`
}

function clampAqiIndex(aqi: number): number {
  const rounded = Math.round(aqi)
  return Math.min(5, Math.max(1, rounded))
}

export function getAQILabel(aqi: number): (typeof AQI_LABELS)[number] {
  return AQI_LABELS[clampAqiIndex(aqi) - 1]!
}

export function getAQIColor(aqi: number): string {
  return AQI_TAILWIND[clampAqiIndex(aqi) - 1]!
}
