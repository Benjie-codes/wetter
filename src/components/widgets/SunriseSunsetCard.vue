<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { format } from 'date-fns'

import BaseWidget from '@/components/ui/BaseWidget.vue'
import { useWeatherStore } from '@/stores/weatherStore'
import { formatTemperature } from '@/utils/formatters'

const emit = defineEmits<{
  retry: []
}>()

const weather = useWeatherStore()
const { current } = storeToRefs(weather)

const isEmpty = computed(() => current.value === null)

const tick = ref(0)
let intervalId: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  intervalId = setInterval(() => {
    tick.value += 1
  }, 60_000)
})

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
})

const sunriseTime = computed(() => {
  const c = current.value
  if (!c) return '--:--'
  return format(c.sunrise, 'HH:mm')
})

const sunsetTime = computed(() => {
  const c = current.value
  if (!c) return '--:--'
  return format(c.sunset, 'HH:mm')
})

const sunPosition = computed(() => {
  const c = current.value
  if (!c) return 0
  const now = Date.now()
  const sunrise = c.sunrise
  const sunset = c.sunset
  const position = (now - sunrise) / (sunset - sunrise)
  return Math.max(0, Math.min(1, position))
})

const sunIconPosition = computed(() => {
  const pos = sunPosition.value
  const startX = 20
  const endX = 180
  const x = startX + (endX - startX) * pos
  const arcHeight = 60
  const y = 80 - Math.sin(pos * Math.PI) * arcHeight
  return { x, y }
})
</script>

<template>
  <BaseWidget
    title="Sunrise & Sunset"
    :is-loading="isEmpty"
    @retry="emit('retry')"
  >
    <div v-if="current" class="relative flex flex-col gap-4">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-300">
            Sunrise
          </p>
          <p class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {{ sunriseTime }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-5xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100 md:text-6xl">
            {{ formatTemperature(current.temperature) }}
          </p>
        </div>
        <div class="flex-1 text-right">
          <p class="text-sm font-medium text-slate-600 dark:text-slate-300">
            Sunset
          </p>
          <p class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {{ sunsetTime }}
          </p>
        </div>
      </div>

      <div class="relative w-full">
        <svg
          class="w-full"
          viewBox="0 0 200 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <!-- Background arc (light) -->
          <path
            d="M 20 80 A 80 80 0 0 1 180 80"
            fill="none"
            stroke="#fde68a"
            stroke-width="8"
            stroke-linecap="round"
          />
          
          <!-- Sun icon positioned along the arc -->
          <g
            :style="{
              transform: `translate(${sunIconPosition.x}px, ${sunIconPosition.y}px)`,
              transition: 'transform 1s ease-in-out'
            }"
          >
            <circle
              cx="0"
              cy="0"
              r="12"
              fill="#fbbf24"
              stroke="#f59e0b"
              stroke-width="2"
            />
            <!-- Sun rays -->
            <g stroke="#f59e0b" stroke-width="2" stroke-linecap="round">
              <line x1="0" y1="-18" x2="0" y2="-22" />
              <line x1="0" y1="18" x2="0" y2="22" />
              <line x1="-18" y1="0" x2="-22" y2="0" />
              <line x1="18" y1="0" x2="22" y2="0" />
              <line x1="-13" y1="-13" x2="-16" y2="-16" />
              <line x1="13" y1="-13" x2="16" y2="-16" />
              <line x1="-13" y1="13" x2="-16" y2="16" />
              <line x1="13" y1="13" x2="16" y2="16" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  </BaseWidget>
</template>

<style scoped>
</style>
