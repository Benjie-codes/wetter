<script setup lang="ts">
import { onMounted } from 'vue'

import { useDarkMode } from '@/composables/useDarkMode'
import { useWeatherStream } from '@/composables/useWeatherStream'

useDarkMode()

const DEFAULT_CITY = {
  city: 'Lagos',
  country: 'NG',
  lat: 6.5244,
  lon: 3.3792,
} as const

const weatherStream = useWeatherStream(() => ({
  city: DEFAULT_CITY.city,
  country: DEFAULT_CITY.country,
  lat: DEFAULT_CITY.lat,
  lon: DEFAULT_CITY.lon,
}))

onMounted(() => {
  weatherStream.start()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-900">
    <RouterView />
  </div>
</template>

<style scoped></style>
