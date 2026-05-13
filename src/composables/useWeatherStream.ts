import { onUnmounted, ref, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { storeToRefs } from 'pinia'

import { getAirQuality, getCurrentWeather } from '@/services'
import type { GeoLocation } from '@/types'
import { sanitizeAirQuality, sanitizeWeatherPoint } from '@/utils'
import { useStreamStore } from '@/stores/streamStore'
import { useWeatherStore } from '@/stores/weatherStore'

/**
 * REST-backed stream with a WebSocket-shaped API: polling every 20s, reactive connection state,
 * and buffered samples in {@link useWeatherStore}.
 */
export function useWeatherStream(location: MaybeRefOrGetter<GeoLocation>) {
  const weatherStore = useWeatherStore()
  const streamStore = useStreamStore()
  const { isConnected, isStreaming, reconnectAttempts, lastError, selectedCity } =
    storeToRefs(streamStore)

  const lastUpdated = ref<number | null>(null)
  const isPaused = ref(false)

  let pollIntervalId: ReturnType<typeof setInterval> | null = null
  let reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null
  let backoffAttempt = 0
  let active = false

  function clearPollInterval() {
    if (pollIntervalId !== null) {
      clearInterval(pollIntervalId)
      pollIntervalId = null
    }
  }

  function clearReconnectTimeout() {
    if (reconnectTimeoutId !== null) {
      clearTimeout(reconnectTimeoutId)
      reconnectTimeoutId = null
    }
  }

  function clearAllTimers() {
    clearPollInterval()
    clearReconnectTimeout()
  }

  /** Starts 20s polling loop if not already running (no immediate duplicate fetch here). */
  function ensurePollingInterval() {
    if (!active || isPaused.value || pollIntervalId !== null) return
    pollIntervalId = setInterval(() => {
      void executePoll()
    }, 20_000)
  }

  function scheduleReconnect() {
    clearReconnectTimeout()
    const delayMs = Math.min(5000 * 2 ** backoffAttempt, 60_000)
    backoffAttempt++

    streamStore.reconnectAttempts += 1

    weatherStore.addFeedEvent({
      type: 'reconnect',
      severity: 'warning',
      payload: { delayMs, phase: 'scheduled', attempt: streamStore.reconnectAttempts },
    })

    reconnectTimeoutId = setTimeout(() => {
      reconnectTimeoutId = null
      if (!active || isPaused.value) return
      void executePoll()
    }, delayMs)
  }

  async function executePoll() {
    if (!active || isPaused.value) return

    const loc = toValue(location)
    streamStore.selectedCity = { ...loc }

    try {
      const weatherRaw = await getCurrentWeather(loc.lat, loc.lon)
      if (!active || isPaused.value) return

      const airRaw = await getAirQuality(loc.lat, loc.lon)
      if (!active || isPaused.value) return

      const weather = sanitizeWeatherPoint(weatherRaw)
      const airQuality = sanitizeAirQuality(airRaw)

      if (!weather || !airQuality) {
        weatherStore.addFeedEvent({
          type: 'error',
          severity: 'warning',
          payload: {
            reason: 'malformed_payload',
            city: loc.city,
            dropped: true,
          },
        })
        ensurePollingInterval()
        return
      }

      weatherStore.bufferDataPoint(weather)
      weatherStore.setAirQuality(airQuality)
      lastUpdated.value = Date.now()
      streamStore.lastError = null
      streamStore.reconnectAttempts = 0
      backoffAttempt = 0
      clearReconnectTimeout()
      ensurePollingInterval()
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      streamStore.lastError = message

      weatherStore.addFeedEvent({
        type: 'error',
        severity: 'warning',
        payload: { message, city: loc.city, phase: 'poll' },
      })

      clearPollInterval()
      scheduleReconnect()
    }
  }

  function start() {
    if (active) return
    active = true
    streamStore.isStreaming = true
    streamStore.isConnected = true
    isPaused.value = false
    streamStore.lastError = null
    streamStore.reconnectAttempts = 0
    backoffAttempt = 0
    clearAllTimers()

    void executePoll()
  }

  function stop() {
    active = false
    streamStore.isStreaming = false
    streamStore.isConnected = false
    isPaused.value = false
    clearAllTimers()
    backoffAttempt = 0
    streamStore.lastError = null
    streamStore.reconnectAttempts = 0
  }

  function pause() {
    if (!active) return
    isPaused.value = true
    clearAllTimers()
  }

  function resume() {
    if (!active) return
    isPaused.value = false
    backoffAttempt = 0
    clearAllTimers()

    void executePoll()
  }

  onUnmounted(() => {
    clearAllTimers()
    active = false
    streamStore.isConnected = false
    streamStore.isStreaming = false
  })

  return {
    isConnected,
    isStreaming,
    reconnectAttempts,
    lastError,
    selectedCity,
    isPaused,
    lastUpdated,
    start,
    stop,
    pause,
    resume,
  }
}
