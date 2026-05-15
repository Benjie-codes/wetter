/**
 * openWeatherService.ts
 * All communication with the OpenWeatherMap REST API.
 *
 * - Uses a pre-configured axios instance (10 s timeout, base URL).
 * - Every public function transforms raw API shapes into app types.
 * - Raw API shapes are kept private to this file.
 * - API key is read exclusively from import.meta.env — never hardcoded.
 */

import axios, { type AxiosError } from 'axios'
import type {
  AirQualityPoint,
  ForecastDay,
  GeoLocation,
  UVIndexPoint,
  WeatherCondition,
  WeatherDataPoint,
} from '@/types'
import { sanitizeAirQuality, sanitizeUVIndex, sanitizeWeatherPoint } from '@/utils'

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY as string

const owmClient = axios.create({
  baseURL: 'https://api.openweathermap.org',
  timeout: 10_000,
  params: {
    appid: apiKey,
    units: 'metric',
  },
})

// ---------------------------------------------------------------------------
// Typed error
// ---------------------------------------------------------------------------

export class WeatherServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'WeatherServiceError'
  }
}

function handleAxiosError(err: unknown, context: string): never {
  const axiosErr = err as AxiosError
  const status = axiosErr.response?.status
  const message =
    status === 401
      ? 'Invalid API key — check VITE_OPENWEATHER_API_KEY in your .env file.'
      : status === 404
        ? `Resource not found (${context}).`
        : status === 429
          ? 'API rate limit exceeded — please wait before retrying.'
          : `Unexpected error in ${context}: ${axiosErr.message}`

  throw new WeatherServiceError(message, String(status ?? 'NETWORK_ERROR'), err)
}

// ---------------------------------------------------------------------------
// Raw API shapes (private — never exported)
// ---------------------------------------------------------------------------

interface OWMWeatherItem {
  id: number
  main: string
  description: string
  icon: string
}

interface OWMCurrentResponse {
  id: number
  dt: number
  name: string
  sys: { country: string; sunrise: number; sunset: number }
  coord: { lat: number; lon: number }
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
  }
  visibility: number
  wind: { speed: number; deg: number }
  weather: OWMWeatherItem[]
}

interface OWMAirPollutionResponse {
  list: Array<{
    dt: number
    main: { aqi: 1 | 2 | 3 | 4 | 5 }
    components: {
      pm2_5: number
      pm10: number
      co: number
    }
  }>
}

interface OWMForecastItem {
  dt: number
  dt_txt: string
  main: { temp_max: number; temp_min: number }
  weather: OWMWeatherItem[]
}

interface OWMForecastResponse {
  list: OWMForecastItem[]
}

interface OWMOneCallResponse {
  current: {
    dt: number
    uvi: number
  }
}

interface OWMGeoItem {
  name: string
  country: string
  lat: number
  lon: number
}

// ---------------------------------------------------------------------------
// Transformers (raw → app types)
// ---------------------------------------------------------------------------

function toWeatherCondition(items: OWMWeatherItem[]): WeatherCondition {
  const w = items[0] ?? { id: 0, main: 'Unknown', description: 'Unknown', icon: '01d' }
  return { id: w.id, main: w.main, description: w.description, icon: w.icon }
}

const AQI_STATUS_MAP: Record<1 | 2 | 3 | 4 | 5, AirQualityPoint['status']> = {
  1: 'Good',
  2: 'Fair',
  3: 'Moderate',
  4: 'Poor',
  5: 'Hazardous',
}

function toAqiStatus(aqi: 1 | 2 | 3 | 4 | 5): AirQualityPoint['status'] {
  return AQI_STATUS_MAP[aqi]
}

/**
 * Groups 3-hour forecast slots by calendar date (YYYY-MM-DD) and
 * returns one ForecastDay per unique date with daily high/low temps.
 * Conditions are taken from the midday slot (closest to 12:00).
 */
function toForecastDays(list: OWMForecastItem[]): ForecastDay[] {
  const byDate = new Map<string, OWMForecastItem[]>()

  for (const item of list) {
    const date = item.dt_txt.slice(0, 10) // 'YYYY-MM-DD'
    const group = byDate.get(date) ?? []
    group.push(item)
    byDate.set(date, group)
  }

  return Array.from(byDate.entries()).map(([date, slots]) => {
    const high = Math.max(...slots.map((s) => s.main.temp_max))
    const low = Math.min(...slots.map((s) => s.main.temp_min))

    // Prefer the noon slot for representative conditions
    const representative =
      slots.find((s) => s.dt_txt.includes('12:00:00')) ?? slots[Math.floor(slots.length / 2)] ?? slots[0]!

    const condition = toWeatherCondition(representative.weather)

    return {
      date,
      high,
      low,
      condition,
      icon: condition.icon,
    } satisfies ForecastDay
  })
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/**
 * Fetches current weather conditions for a coordinate pair.
 * Maps to {@link WeatherDataPoint}.
 */
export async function getCurrentWeather(lat: number, lon: number): Promise<WeatherDataPoint> {
  try {
    const { data } = await owmClient.get<OWMCurrentResponse>('/data/2.5/weather', {
      params: { lat, lon },
    })

    const candidate = {
      id: `${data.id}-${data.dt}`,
      timestamp: data.dt * 1000,
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      visibility: data.visibility,
      windSpeed: data.wind.speed,
      windDirection: data.wind.deg,
      condition: toWeatherCondition(data.weather),
      location: {
        city: data.name,
        country: data.sys.country,
        lat: data.coord.lat,
        lon: data.coord.lon,
      },
      sunrise: data.sys.sunrise * 1000,
      sunset: data.sys.sunset * 1000,
    }

    const validated = sanitizeWeatherPoint(candidate)
    if (!validated) {
      throw new WeatherServiceError(
        'Weather response failed validation',
        'INVALID_RESPONSE',
      )
    }
    return validated
  } catch (err) {
    if (err instanceof WeatherServiceError) throw err
    return handleAxiosError(err, 'getCurrentWeather')
  }
}

/**
 * Fetches current air quality index for a coordinate pair.
 * Maps to {@link AirQualityPoint}.
 */
export async function getAirQuality(lat: number, lon: number): Promise<AirQualityPoint> {
  try {
    const { data } = await owmClient.get<OWMAirPollutionResponse>('/data/2.5/air_pollution', {
      params: { lat, lon },
    })

    const entry = data.list[0]
    if (!entry) throw new WeatherServiceError('Empty air quality response', 'EMPTY_RESPONSE')

    const aqi = entry.main.aqi

    const candidate = {
      timestamp: entry.dt * 1000,
      aqi,
      pm2_5: entry.components.pm2_5,
      pm10: entry.components.pm10,
      co: entry.components.co,
      status: toAqiStatus(aqi),
    }

    const validated = sanitizeAirQuality(candidate)
    if (!validated) {
      throw new WeatherServiceError(
        'Air quality response failed validation',
        'INVALID_RESPONSE',
      )
    }
    return validated
  } catch (err) {
    if (err instanceof WeatherServiceError) throw err
    return handleAxiosError(err, 'getAirQuality')
  }
}

/**
 * Fetches current UV index (One Call API 3.0 `current.uvi`).
 * Requires an API key with One Call 3.0 access.
 */
export async function getUVIndex(lat: number, lon: number): Promise<UVIndexPoint> {
  try {
    const { data } = await owmClient.get<OWMOneCallResponse>('/data/3.0/onecall', {
      params: {
        lat,
        lon,
        exclude: 'minutely,hourly,daily,alerts',
      },
    })

    const current = data.current
    if (!current || typeof current.uvi !== 'number' || !Number.isFinite(current.uvi)) {
      throw new WeatherServiceError('Missing UV index in One Call response', 'INVALID_RESPONSE')
    }

    const candidate = {
      timestamp: current.dt * 1000,
      uvi: current.uvi,
    }

    const validated = sanitizeUVIndex(candidate)
    if (!validated) {
      throw new WeatherServiceError('UV index response failed validation', 'INVALID_RESPONSE')
    }
    return validated
  } catch (err) {
    if (err instanceof WeatherServiceError) throw err
    return handleAxiosError(err, 'getUVIndex')
  }
}

/**
 * Fetches a 5-day forecast (grouped into daily summaries).
 * Maps to {@link ForecastDay}[].
 */
export async function getForecast(lat: number, lon: number): Promise<ForecastDay[]> {
  try {
    const { data } = await owmClient.get<OWMForecastResponse>('/data/2.5/forecast', {
      params: { lat, lon, cnt: 40 }, // 40 × 3-hour slots = ~5 days
    })

    return toForecastDays(data.list)
  } catch (err) {
    return handleAxiosError(err, 'getForecast')
  }
}

/**
 * Searches for cities matching a free-text query using the Geocoding API.
 * Maps to {@link GeoLocation}[].
 */
export async function searchCities(query: string): Promise<GeoLocation[]> {
  try {
    const { data } = await owmClient.get<OWMGeoItem[]>('/geo/1.0/direct', {
      params: { q: query, limit: 5 },
    })

    return data.map((item) => ({
      city: item.name,
      country: item.country,
      lat: item.lat,
      lon: item.lon,
    }))
  } catch (err) {
    return handleAxiosError(err, 'searchCities')
  }
}
