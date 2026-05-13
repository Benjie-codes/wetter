/**
 * weather.types.ts
 * Central type definitions for the entire Wetter application.
 * This file contains ONLY interfaces — no implementation code.
 */

// ---------------------------------------------------------------------------
// Primitives / sub-types
// ---------------------------------------------------------------------------

export interface WeatherCondition {
  id: number
  main: string
  description: string
  icon: string
}

export interface GeoLocation {
  city: string
  country: string
  lat: number
  lon: number
}

// ---------------------------------------------------------------------------
// Core data points
// ---------------------------------------------------------------------------

export interface WeatherDataPoint {
  id: string
  timestamp: number
  temperature: number
  feelsLike: number
  humidity: number
  pressure: number
  visibility: number
  windSpeed: number
  windDirection: number
  condition: WeatherCondition
  location: GeoLocation
}

export interface AirQualityPoint {
  timestamp: number
  /** AQI index on a 1–5 scale (1 = Good, 5 = Hazardous) */
  aqi: 1 | 2 | 3 | 4 | 5
  pm2_5: number
  pm10: number
  co: number
  status: 'Good' | 'Fair' | 'Moderate' | 'Poor' | 'Hazardous'
}

// ---------------------------------------------------------------------------
// Forecast
// ---------------------------------------------------------------------------

export interface ForecastDay {
  date: string
  high: number
  low: number
  condition: WeatherCondition
  icon: string
}

// ---------------------------------------------------------------------------
// Streaming / real-time events
// ---------------------------------------------------------------------------

export interface StreamEvent {
  type: 'weather_update' | 'alert' | 'error' | 'reconnect'
  payload: unknown
  severity: 'info' | 'warning' | 'critical'
  timestamp: number
}

// ---------------------------------------------------------------------------
// UI / Dashboard configuration
// ---------------------------------------------------------------------------

export interface TimeRange {
  label: '1H' | '3H' | '6H' | '24H' | 'Live'
  minutes: number
}

export interface DashboardConfig {
  theme: 'light' | 'dark'
  isPaused: boolean
  timeRange: TimeRange
  selectedCity: GeoLocation
}
