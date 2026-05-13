import type { AirQualityPoint, WeatherDataPoint } from '@/types'

/** Epoch ms: reject absurd dates while allowing historical and near-future data */
const TIMESTAMP_MS_MIN = 0
const TIMESTAMP_MS_MAX = 4_102_444_800_000 // ~2100-01-01 UTC

function parseAqi(value: number): 1 | 2 | 3 | 4 | 5 | null {
  switch (value) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
      return value
    default:
      return null
  }
}

function isAirQualityStatus(value: unknown): value is AirQualityPoint['status'] {
  return (
    value === 'Good' ||
    value === 'Fair' ||
    value === 'Moderate' ||
    value === 'Poor' ||
    value === 'Hazardous'
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Valid epoch milliseconds for weather payloads: finite, non-negative, within a plausible calendar range.
 */
export function isValidTimestamp(ts: unknown): boolean {
  if (!isFiniteNumber(ts) || ts < TIMESTAMP_MS_MIN || ts > TIMESTAMP_MS_MAX) return false
  return true
}

export function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function sanitizeWeatherCondition(raw: unknown): WeatherDataPoint['condition'] | null {
  if (!isRecord(raw)) return null
  const id = raw.id
  const main = raw.main
  const description = raw.description
  const icon = raw.icon
  if (!isFiniteNumber(id) || !isString(main) || !isString(description) || !isString(icon)) {
    return null
  }
  return { id, main, description, icon }
}

function sanitizeGeoLocation(raw: unknown): WeatherDataPoint['location'] | null {
  if (!isRecord(raw)) return null
  const city = raw.city
  const country = raw.country
  const lat = raw.lat
  const lon = raw.lon
  if (!isString(city) || !isString(country) || !isFiniteNumber(lat) || !isFiniteNumber(lon)) {
    return null
  }
  return { city, country, lat, lon }
}

export function sanitizeWeatherPoint(raw: unknown): WeatherDataPoint | null {
  if (!isRecord(raw)) return null

  const id = raw.id
  const timestamp = raw.timestamp
  const temperature = raw.temperature
  const feelsLike = raw.feelsLike
  const humidity = raw.humidity
  const pressure = raw.pressure
  const visibility = raw.visibility
  const windSpeed = raw.windSpeed
  const windDirection = raw.windDirection

  if (
    !isString(id) ||
    !isValidTimestamp(timestamp) ||
    !isFiniteNumber(temperature) ||
    !isFiniteNumber(feelsLike) ||
    !isFiniteNumber(humidity) ||
    !isFiniteNumber(pressure) ||
    !isFiniteNumber(visibility) ||
    !isFiniteNumber(windSpeed) ||
    !isFiniteNumber(windDirection)
  ) {
    return null
  }

  const condition = sanitizeWeatherCondition(raw.condition)
  const location = sanitizeGeoLocation(raw.location)
  if (!condition || !location) return null

  const point: WeatherDataPoint = {
    id,
    timestamp,
    temperature,
    feelsLike,
    humidity,
    pressure,
    visibility,
    windSpeed,
    windDirection,
    condition,
    location,
  }
  return point
}

export function sanitizeAirQuality(raw: unknown): AirQualityPoint | null {
  if (!isRecord(raw)) return null

  const timestamp = raw.timestamp
  const aqiRaw = raw.aqi
  const pm2_5 = raw.pm2_5
  const pm10 = raw.pm10
  const co = raw.co
  const status = raw.status

  if (!isValidTimestamp(timestamp) || !isFiniteNumber(aqiRaw) || !Number.isInteger(aqiRaw)) {
    return null
  }

  const aqi = parseAqi(aqiRaw)
  if (
    aqi === null ||
    !isFiniteNumber(pm2_5) ||
    !isFiniteNumber(pm10) ||
    !isFiniteNumber(co) ||
    !isAirQualityStatus(status)
  ) {
    return null
  }

  const point: AirQualityPoint = {
    timestamp,
    aqi,
    pm2_5,
    pm10,
    co,
    status,
  }
  return point
}
