import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import type { AirQualityPoint, StreamEvent, WeatherDataPoint } from '@/types'

const HISTORY_MAX = 72
const FEED_MAX = 100

export const useWeatherStore = defineStore('weather', () => {
  const current = shallowRef<WeatherDataPoint | null>(null)
  const history = shallowRef<WeatherDataPoint[]>([])
  const airQuality = shallowRef<AirQualityPoint | null>(null)
  const eventFeed = shallowRef<StreamEvent[]>([])
  const isPaused = ref(false)
  const timeRange = ref(60)

  const pointBuffer: WeatherDataPoint[] = []
  let flushTimer: ReturnType<typeof setTimeout> | null = null

  const filteredHistory = computed(() => {
    const rangeMs = timeRange.value * 60 * 1000
    const cutoff = Date.now() - rangeMs
    return history.value.filter((p) => p.timestamp >= cutoff)
  })

  function scheduleFlush() {
    if (flushTimer !== null) return
    flushTimer = setTimeout(() => {
      flushTimer = null
      flushBuffer()
    }, 100)
  }

  function flushBuffer() {
    if (pointBuffer.length === 0) return
    const merged = [...history.value, ...pointBuffer]
    const trimmed = merged.slice(-HISTORY_MAX)
    history.value = trimmed
    current.value = trimmed.length > 0 ? trimmed[trimmed.length - 1]! : null
    pointBuffer.length = 0
  }

  function bufferDataPoint(point: WeatherDataPoint) {
    pointBuffer.push(point)
    scheduleFlush()
  }

  function setAirQuality(point: AirQualityPoint | null) {
    airQuality.value = point
  }

  function addFeedEvent(event: Omit<StreamEvent, 'timestamp'> & { timestamp?: number }) {
    const full: StreamEvent = {
      ...event,
      timestamp: event.timestamp ?? Date.now(),
    }
    eventFeed.value = [...eventFeed.value, full].slice(-FEED_MAX)
  }

  const feedCriticalAcknowledgedAt = ref(0)

  const unreadCriticalFeedCount = computed(() =>
    eventFeed.value.filter(
      (e) => e.severity === 'critical' && e.timestamp > feedCriticalAcknowledgedAt.value,
    ).length,
  )

  function acknowledgeCriticalFeed() {
    feedCriticalAcknowledgedAt.value = Date.now()
  }

  return {
    current,
    history,
    airQuality,
    eventFeed,
    isPaused,
    timeRange,
    filteredHistory,
    unreadCriticalFeedCount,
    bufferDataPoint,
    setAirQuality,
    scheduleFlush,
    addFeedEvent,
    acknowledgeCriticalFeed,
  }
})
