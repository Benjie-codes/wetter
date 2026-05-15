<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

import BaseWidget from '@/components/ui/BaseWidget.vue'
import { useWeatherStore } from '@/stores/weatherStore'
import {
  formatPressure,
  formatRelativeTime,
  formatTemperature,
  formatVisibility,
} from '@/utils/formatters'

const emit = defineEmits<{
  retry: []
}>()

const weather = useWeatherStore()
const { current } = storeToRefs(weather)

const isEmpty = computed(() => current.value === null)
const isLoading = computed(() => current.value === null)

const tick = ref(0)
let intervalId: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  intervalId = setInterval(() => {
    tick.value += 1
  }, 10_000)
})

onUnmounted(() => {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
})

const lastUpdatedLabel = computed(() => {
  void tick.value
  const c = current.value
  if (!c) return ''
  return formatRelativeTime(c.timestamp)
})

function weatherKindFromMain(main: string) {
  const m = main.toLowerCase()
  if (m === 'clear') return 'clear' as const
  if (m === 'clouds') return 'clouds' as const
  if (m === 'thunderstorm') return 'thunder' as const
  if (m === 'drizzle') return 'drizzle' as const
  if (m === 'rain') return 'rain' as const
  if (m === 'snow') return 'snow' as const
  if (
    ['mist', 'fog', 'haze', 'smoke', 'dust', 'sand', 'ash', 'squall', 'tornado'].includes(m)
  ) {
    return 'mist' as const
  }
  return 'default' as const
}

const conditionKind = computed(() =>
  current.value ? weatherKindFromMain(current.value.condition.main) : 'default',
)
</script>

<template>
  <BaseWidget
    title="Weather"
    variant="hero"
    :is-loading="isLoading"
    skeleton-variant="hero"
    @retry="emit('retry')"
  >
    <div v-if="current" class="relative flex flex-col gap-5">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <p class="truncate text-lg font-semibold leading-tight text-white drop-shadow-sm">
            {{ current.location.city }}
          </p>
          <p class="truncate text-sm text-white/85">
            {{ current.location.country }}
          </p>
        </div>
        <div class="weather-card__icon shrink-0" aria-hidden="true">
          <!-- Clear -->
          <svg
            v-if="conditionKind === 'clear'"
            class="weather-card__sun size-20 text-amber-200"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="32" cy="32" r="12" fill="currentColor" />
            <g stroke="currentColor" stroke-width="3" stroke-linecap="round">
              <path d="M32 6v6M32 52v6M6 32h6M52 32h6M13.6 13.6l4.2 4.2M46.2 46.2l4.3 4.3M13.6 50.4l4.2-4.2M46.2 17.8l4.3-4.3" />
            </g>
          </svg>
          <!-- Clouds -->
          <svg
            v-else-if="conditionKind === 'clouds'"
            class="weather-card__cloud size-20 text-white/90"
            viewBox="0 0 64 64"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M48 40a12 12 0 10-1.2-23.9A16 16 0 0016 28a10 10 0 1010 28h20a14 14 0 000-28z"
              fill-opacity="0.95"
            />
          </svg>
          <!-- Rain / drizzle -->
          <svg
            v-else-if="conditionKind === 'rain' || conditionKind === 'drizzle'"
            class="size-20 text-sky-100"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="currentColor"
              fill-opacity="0.9"
              d="M46 18a12 12 0 00-22.3-3.4A14 14 0 0014 36h38a10 10 0 00-6-18z"
            />
            <g class="weather-card__rain" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M22 42v10" />
              <path d="M32 40v12" />
              <path d="M42 42v10" />
            </g>
          </svg>
          <!-- Thunder -->
          <svg
            v-else-if="conditionKind === 'thunder'"
            class="size-20 text-sky-100"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="currentColor"
              fill-opacity="0.85"
              d="M44 16a11 11 0 00-20.5-3A13 13 0 0012 34h40a9 9 0 00-8-18z"
            />
            <path
              class="weather-card__bolt"
              fill="#fde047"
              d="M34 36l-8 12h6l-4 14 14-16h-8l4-10z"
            />
          </svg>
          <!-- Snow -->
          <svg
            v-else-if="conditionKind === 'snow'"
            class="size-20 text-white"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="currentColor"
              fill-opacity="0.88"
              d="M46 18a12 12 0 00-22.3-3.4A14 14 0 0014 36h38a10 10 0 00-6-18z"
            />
            <g class="weather-card__snow" fill="currentColor" fill-opacity="0.95">
              <circle cx="22" cy="46" r="2" />
              <circle cx="32" cy="52" r="2" />
              <circle cx="42" cy="46" r="2" />
            </g>
          </svg>
          <!-- Mist -->
          <svg
            v-else-if="conditionKind === 'mist'"
            class="weather-card__mist size-20 text-white/80"
            viewBox="0 0 64 64"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="32" cy="24" rx="20" ry="6" fill-opacity="0.5" />
            <ellipse cx="32" cy="34" rx="24" ry="7" fill-opacity="0.45" />
            <ellipse cx="32" cy="46" rx="18" ry="5" fill-opacity="0.4" />
          </svg>
          <!-- Default -->
          <svg
            v-else
            class="weather-card__cloud size-20 text-white/90"
            viewBox="0 0 64 64"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M48 40a12 12 0 10-1.2-23.9A16 16 0 0016 28a10 10 0 1010 28h20a14 14 0 000-28z" />
          </svg>
        </div>
      </div>

      <div class="flex flex-wrap items-end gap-2">
        <p class="text-5xl font-bold tabular-nums tracking-tight text-white drop-shadow-md md:text-6xl">
          {{ formatTemperature(current.temperature) }}
        </p>
        <p class="pb-1.5 text-sm text-white/80">
          Feels like {{ formatTemperature(current.feelsLike) }}
        </p>
      </div>

      <p class="text-sm font-medium capitalize leading-snug text-white/90">
        {{ current.condition.description }}
      </p>

      <div class="grid grid-cols-3 gap-2 sm:gap-3">
        <div
          class="rounded-xl bg-white/15 px-2 py-2.5 text-center shadow-inner ring-1 ring-white/20 backdrop-blur-sm sm:px-3"
        >
          <p class="text-[10px] font-medium uppercase tracking-wide text-white/70">
            Pressure
          </p>
          <p class="mt-1 truncate text-xs font-semibold text-white sm:text-sm">
            {{ formatPressure(current.pressure) }}
          </p>
        </div>
        <div
          class="rounded-xl bg-white/15 px-2 py-2.5 text-center shadow-inner ring-1 ring-white/20 backdrop-blur-sm sm:px-3"
        >
          <p class="text-[10px] font-medium uppercase tracking-wide text-white/70">
            Visibility
          </p>
          <p class="mt-1 truncate text-xs font-semibold text-white sm:text-sm">
            {{ formatVisibility(current.visibility) }}
          </p>
        </div>
        <div
          class="rounded-xl bg-white/15 px-2 py-2.5 text-center shadow-inner ring-1 ring-white/20 backdrop-blur-sm sm:px-3"
        >
          <p class="text-[10px] font-medium uppercase tracking-wide text-white/70">
            Humidity
          </p>
          <p class="mt-1 text-xs font-semibold text-white sm:text-sm">
            {{ Math.round(current.humidity) }}%
          </p>
        </div>
      </div>

      <p class="text-xs text-white/70">
        Updated {{ lastUpdatedLabel }}
      </p>
    </div>
  </BaseWidget>
</template>

<style scoped>
.weather-card__sun {
  filter: drop-shadow(0 2px 8px rgb(0 0 0 / 0.15));
  animation: weather-sun-gentle 3.2s ease-in-out infinite;
  transform-origin: center;
}

@keyframes weather-sun-gentle {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.94;
  }
}

.weather-card__cloud {
  animation: weather-cloud-drift 5s ease-in-out infinite;
}

@keyframes weather-cloud-drift {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(3px);
  }
}

.weather-card__rain path {
  animation: weather-rain-drop 1.1s ease-in infinite;
}

.weather-card__rain path:nth-child(2) {
  animation-delay: 0.2s;
}

.weather-card__rain path:nth-child(3) {
  animation-delay: 0.35s;
}

@keyframes weather-rain-drop {
  0% {
    opacity: 0.35;
    transform: translateY(-4px);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.35;
    transform: translateY(8px);
  }
}

.weather-card__bolt {
  animation: weather-bolt-flash 2.8s ease-in-out infinite;
}

@keyframes weather-bolt-flash {
  0%,
  70%,
  100% {
    opacity: 1;
  }
  72%,
  78% {
    opacity: 0.35;
  }
  74%,
  76% {
    opacity: 1;
  }
}

.weather-card__snow circle {
  animation: weather-snow-fall 2.2s ease-in-out infinite;
}

.weather-card__snow circle:nth-child(2) {
  animation-delay: 0.35s;
}

.weather-card__snow circle:nth-child(3) {
  animation-delay: 0.65s;
}

@keyframes weather-snow-fall {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  50% {
    transform: translateY(5px);
    opacity: 1;
  }
}

.weather-card__mist ellipse {
  animation: weather-mist-pulse 4s ease-in-out infinite;
}

.weather-card__mist ellipse:nth-child(2) {
  animation-delay: 0.6s;
}

.weather-card__mist ellipse:nth-child(3) {
  animation-delay: 1.2s;
}

@keyframes weather-mist-pulse {
  0%,
  100% {
    opacity: 0.45;
  }
  50% {
    opacity: 0.85;
  }
}
</style>
