<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import BaseWidget from '@/components/ui/BaseWidget.vue'
import { getUVIndex } from '@/services'
import { useWeatherStore } from '@/stores/weatherStore'
import type { UVIndexPoint } from '@/types'

const emit = defineEmits<{
  retry: []
}>()

const weather = useWeatherStore()
const { current } = storeToRefs(weather)

const uv = ref<UVIndexPoint | null>(null)
const loading = ref(false)
const fetchError = ref<string | null>(null)

function uvSeverity(uvi: number) {
  if (uvi < 3)
    return {
      label: 'Low' as const,
      strokeClass: 'text-emerald-500',
    }
  if (uvi < 6)
    return {
      label: 'Moderate' as const,
      strokeClass: 'text-amber-500',
    }
  if (uvi < 8)
    return {
      label: 'High' as const,
      strokeClass: 'text-orange-500',
    }
  if (uvi < 11)
    return {
      label: 'Very High' as const,
      strokeClass: 'text-red-600',
    }
  return {
    label: 'Extreme' as const,
    strokeClass: 'text-violet-600',
  }
}

const hasErr = computed(() => fetchError.value !== null)

const isLoadingState = computed(() => {
  if (!current.value) return true
  if (hasErr.value) return false
  return loading.value
})

const severity = computed(() => {
  const u = uv.value?.uvi
  if (u === undefined) return uvSeverity(0)
  return uvSeverity(u)
})

const uvDisplay = computed(() => {
  const u = uv.value?.uvi
  if (u === undefined) return '—'
  return Number.isInteger(u) ? String(u) : u.toFixed(1)
})

/** Fill 0–100 for scale 0–11 UV (cap at 11). */
const arcFill = computed(() => {
  const u = uv.value?.uvi ?? 0
  return Math.min(100, Math.max(0, (u / 11) * 100))
})

const arcOffset = computed(() => 100 - arcFill.value)

async function loadUV() {
  const c = current.value
  if (!c) {
    uv.value = null
    fetchError.value = null
    loading.value = false
    return
  }
  loading.value = true
  fetchError.value = null
  try {
    uv.value = await getUVIndex(c.location.lat, c.location.lon)
  } catch (e) {
    uv.value = null
    fetchError.value = e instanceof Error ? e.message : 'Could not load UV index.'
  } finally {
    loading.value = false
  }
}

watch(
  current,
  () => {
    void loadUV()
  },
  { immediate: true },
)

function onRetry() {
  void loadUV()
  emit('retry')
}
</script>

<template>
  <BaseWidget
    title="UV index"
    :is-loading="isLoadingState"
    :has-error="hasErr"
    :error-message="fetchError ?? undefined"
    @retry="onRetry"
  >
    <div v-if="uv" class="flex flex-col items-center gap-4">
      <div class="text-center">
        <p
          class="text-5xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-50 md:text-6xl"
        >
          {{ uvDisplay }}
        </p>
        <p class="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
          {{ severity.label }}
        </p>
      </div>

      <div class="relative w-full max-w-[220px]">
        <svg
          class="w-full text-slate-200 dark:text-slate-600"
          viewBox="0 0 120 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <!-- Track arc -->
          <path
            pathLength="100"
            d="M 14 56 A 46 46 0 0 1 106 56"
            fill="none"
            stroke="currentColor"
            stroke-width="10"
            stroke-linecap="round"
            class="transition-colors duration-300"
          />
          <!-- Value arc -->
          <path
            pathLength="100"
            stroke-dasharray="100"
            :stroke-dashoffset="arcOffset"
            d="M 14 56 A 46 46 0 0 1 106 56"
            :class="[severity.strokeClass, 'transition-[stroke-dashoffset] duration-700 ease-out']"
            fill="none"
            stroke="currentColor"
            stroke-width="10"
            stroke-linecap="round"
          />
        </svg>
      </div>
    </div>
  </BaseWidget>
</template>
