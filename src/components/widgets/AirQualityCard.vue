<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import BaseWidget from '@/components/ui/BaseWidget.vue'
import { useWeatherStore } from '@/stores/weatherStore'
import type { AirQualityPoint } from '@/types'
import { formatWindCompass, getAQIColor, getAQILabel } from '@/utils/formatters'

const emit = defineEmits<{
  retry: []
}>()

const weather = useWeatherStore()
const { airQuality, current } = storeToRefs(weather)

const isEmpty = computed(() => airQuality.value === null)
const isLoading = computed(() => airQuality.value === null)

/** Map OWM 1–5 index to 0–500 display scale (linear). */
function aqiToDisplayScale(aqi: AirQualityPoint['aqi']): number {
  return Math.round(((aqi - 1) / 4) * 500)
}

const displayScore = computed(() =>
  airQuality.value ? aqiToDisplayScale(airQuality.value.aqi) : 0,
)

const indicatorPercent = computed(() =>
  Math.min(100, Math.max(0, (displayScore.value / 500) * 100)),
)

/** 0 = Good (0–166), 1 = Standard (167–333), 2 = Hazardous (334–500). */
const activeSegment = computed(() => {
  const v = displayScore.value
  if (v <= 166) return 0
  if (v <= 333) return 1
  return 2
})

const badgeToneClass: Record<AirQualityPoint['aqi'], string> = {
  1: 'bg-emerald-500 text-white ring-1 ring-white/30',
  2: 'bg-yellow-400 text-slate-900 ring-1 ring-yellow-700/25',
  3: 'bg-orange-500 text-white ring-1 ring-white/25',
  4: 'bg-red-600 text-white ring-1 ring-white/25',
  5: 'bg-purple-600 text-white ring-1 ring-white/25',
}

const mainPollutantLabel = computed(() => {
  const aq = airQuality.value
  if (!aq) return 'Main pollutant: —'
  const order = ['pm2_5', 'pm10', 'co'] as const
  const rows = [
    { key: 'pm2_5' as const, value: aq.pm2_5, label: 'PM 2.5' },
    { key: 'pm10' as const, value: aq.pm10, label: 'PM10' },
    { key: 'co' as const, value: aq.co, label: 'CO' },
  ]
  let best = rows[0]!
  for (const r of rows) {
    if (r.value > best.value) best = r
    else if (r.value === best.value && order.indexOf(r.key) < order.indexOf(best.key)) best = r
  }
  return `Main pollutant: ${best.label}`
})

const windLabel = computed(() => {
  const c = current.value
  if (!c) return 'Wind: —'
  return `Wind ${formatWindCompass(c.windDirection)}`
})

function segmentClass(i: number) {
  return activeSegment.value === i
    ? 'font-semibold text-white'
    : 'font-medium text-white/50'
}
</script>

<template>
  <BaseWidget
    title="Air quality"
    variant="aqi"
    :is-loading="isLoading"
    skeleton-variant="card"
    @retry="emit('retry')"
  >
    <div v-if="airQuality" class="flex flex-col gap-5">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div class="flex flex-wrap items-end gap-3">
          <p class="text-5xl font-bold tabular-nums tracking-tight text-white drop-shadow md:text-6xl">
            {{ displayScore }}
          </p>
          <div class="flex flex-col gap-1">
            <span
              class="inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide shadow-sm"
              :class="badgeToneClass[airQuality.aqi]"
            >
              {{ getAQILabel(airQuality.aqi) }}
            </span>
            <span class="rounded-md bg-white/90 px-2 py-0.5 text-sm font-medium shadow-sm">
              <span :class="getAQIColor(airQuality.aqi)">Index {{ airQuality.aqi }}/5</span>
            </span>
          </div>
        </div>
      </div>

      <p class="text-sm text-white/90">
        {{ mainPollutantLabel }}
      </p>
      <p class="text-sm text-white/85">
        {{ windLabel }}
      </p>

      <div class="space-y-2">
        <p class="text-xs font-medium uppercase tracking-wide text-white/70">
          Index (0–500)
        </p>
        <div class="relative pt-1">
          <div
            class="relative h-3 overflow-visible rounded-full ring-1 ring-white/25"
            role="presentation"
          >
            <div
              class="h-full w-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-violet-500"
            />
            <div
              class="pointer-events-none absolute top-1/2 z-10 h-6 w-1.5 -translate-y-1/2 rounded-full bg-white shadow-md ring-2 ring-white/40 transition-[left] duration-500 ease-out"
              :style="{ left: `calc(${indicatorPercent}% - 3px)` }"
            />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-1 text-center text-xs transition-colors duration-300">
          <span :class="segmentClass(0)">Good</span>
          <span :class="segmentClass(1)">Standard</span>
          <span :class="segmentClass(2)">Hazardous</span>
        </div>
      </div>
    </div>
  </BaseWidget>
</template>
