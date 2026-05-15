<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { formatRelativeTime } from '@/utils'

import { useWeatherStore } from '@/stores/weatherStore'
import { useStreamStore } from '@/stores/streamStore'
import { useWeatherStream } from '@/composables/useWeatherStream'
import { useDarkMode } from '@/composables/useDarkMode'
import { searchCities } from '@/services'
import type { GeoLocation } from '@/types'

const { isDarkMode: isDark } = useDarkMode()
const weather = useWeatherStore()
const streamStore = useStreamStore()
const { isPaused, timeRange } = storeToRefs(weather)
const { isStreamPaused, selectedCity } = storeToRefs(streamStore)

const weatherStream = useWeatherStream()
const { lastUpdated, isConnected, isStreaming, lastError } = weatherStream

const showCityModal = ref(false)
const citySearchTerm = ref('')
const citySearchResults = ref<GeoLocation[]>([])
const isSearching = ref(false)

const TIME_RANGES = [
  { label: '1H', minutes: 60 },
  { label: '3H', minutes: 180 },
  { label: '6H', minutes: 360 },
  { label: '24H', minutes: 1440 },
  { label: 'Live', minutes: 60 },
] as const

const currentTimeRange = computed(() => {
  return TIME_RANGES.find((r) => r.minutes === timeRange.value) || TIME_RANGES[4]
})

const lastUpdatedLabel = computed(() => {
  if (!lastUpdated.value) return 'Never'
  return formatRelativeTime(lastUpdated.value)
})

const connectionStatus = computed(() => {
  if (!isStreaming.value) return { label: 'Stopped', color: 'text-slate-500' }
  if (isPaused.value || isStreamPaused.value) return { label: 'Paused', color: 'text-amber-500' }
  if (!isConnected.value) return { label: 'Disconnected', color: 'text-red-500' }
  return { label: 'Live', color: 'text-green-500' }
})

async function handleCitySearch() {
  if (!citySearchTerm.value.trim()) {
    citySearchResults.value = []
    return
  }
  
  isSearching.value = true
  try {
    citySearchResults.value = await searchCities(citySearchTerm.value)
  } catch (e) {
    citySearchResults.value = []
  } finally {
    isSearching.value = false
  }
}

function selectCity(city: GeoLocation) {
  streamStore.selectedCity = city
  showCityModal.value = false
  citySearchTerm.value = ''
  citySearchResults.value = []
  
  // Restart stream with new city
  weatherStream.stop()
  weatherStream.start()
}

function handlePauseResume() {
  if (isPaused.value || isStreamPaused.value) {
    weatherStream.resume()
  } else {
    weatherStream.pause()
  }
}

function handleRefresh() {
  weatherStream.stop()
  weatherStream.start()
}

function setTimeRange(minutes: number) {
  timeRange.value = minutes
}
</script>

<template>
  <div class="stream-controls">
    <!-- PAUSED Overlay -->
    <Transition name="fade">
      <div
        v-if="isPaused || isStreamPaused"
        class="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-lg"
      >
        <div class="px-4 py-2 bg-slate-900 text-white rounded-lg shadow-lg">
          <span class="font-semibold">⏸ PAUSED</span>
        </div>
      </div>
    </Transition>

    <!-- Controls -->
    <div class="flex flex-col gap-3">
      <!-- Status & Last Updated -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div
            class="w-2 h-2 rounded-full"
            :class="isConnected && !isPaused && !isStreamPaused ? 'bg-green-500 animate-pulse' : 'bg-slate-400'"
          />
          <span class="text-sm font-medium" :class="connectionStatus.color">
            {{ connectionStatus.label }}
          </span>
        </div>
        <span class="text-xs text-slate-500 dark:text-slate-400">
          Updated {{ lastUpdatedLabel }}
        </span>
      </div>

      <!-- Control Buttons -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Pause/Resume -->
        <button
          type="button"
          @click="handlePauseResume"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
          :class="isDark
            ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
            : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'"
        >
          <span>{{ isPaused || isStreamPaused ? '▶' : '⏸' }}</span>
          <span>{{ isPaused || isStreamPaused ? 'Resume' : 'Pause' }}</span>
        </button>

        <!-- Refresh -->
        <button
          type="button"
          @click="handleRefresh"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
          :class="isDark
            ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
            : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'"
        >
          <span>↻</span>
          <span>Refresh</span>
        </button>

        <!-- City Switcher -->
        <button
          type="button"
          @click="showCityModal = true"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
          :class="isDark
            ? 'bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700'
            : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'"
        >
          <span>📍</span>
          <span>{{ selectedCity?.city || 'Change City' }}</span>
        </button>
      </div>

      <!-- Time Range Controls -->
      <div class="flex flex-wrap items-center gap-1">
        <button
          v-for="range in TIME_RANGES"
          :key="range.label"
          type="button"
          @click="setTimeRange(range.minutes)"
          class="px-2.5 py-1 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
          :class="currentTimeRange.label === range.label
            ? isDark
              ? 'bg-sky-600 text-white'
              : 'bg-sky-500 text-white'
            : isDark
              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
        >
          {{ range.label }}
        </button>
      </div>

      <!-- Error Display -->
      <Transition name="fade">
        <div
          v-if="lastError"
          class="px-3 py-2 text-xs rounded-lg bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
        >
          <span class="font-semibold">Error:</span> {{ lastError }}
        </div>
      </Transition>
    </div>

    <!-- City Search Modal -->
    <Transition name="modal">
      <div
        v-if="showCityModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
        @click.self="showCityModal = false"
      >
        <div
          class="w-full max-w-md rounded-xl border bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
        >
          <div class="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Change City
            </h3>
          </div>
          
          <div class="p-4">
            <input
              v-model="citySearchTerm"
              type="text"
              placeholder="Search for a city..."
              class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
              @input="handleCitySearch"
            />
            
            <div
              v-if="isSearching"
              class="mt-4 text-center text-sm text-slate-500 dark:text-slate-400"
            >
              Searching...
            </div>
            
            <div
              v-else-if="citySearchResults.length > 0"
              class="mt-4 space-y-2 max-h-64 overflow-auto"
            >
              <button
                v-for="city in citySearchResults"
                :key="`${city.city}-${city.country}`"
                type="button"
                @click="selectCity(city)"
                class="w-full px-3 py-2 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div class="font-medium text-slate-900 dark:text-slate-100">
                  {{ city.city }}
                </div>
                <div class="text-xs text-slate-500 dark:text-slate-400">
                  {{ city.country }}
                </div>
              </button>
            </div>
            
            <div
              v-else-if="citySearchTerm && !isSearching"
              class="mt-4 text-center text-sm text-slate-500 dark:text-slate-400"
            >
              No cities found
            </div>
          </div>
          
          <div class="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <button
              type="button"
              @click="showCityModal = false"
              class="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.stream-controls {
  min-height: 150px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
