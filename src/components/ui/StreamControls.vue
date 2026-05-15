<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { formatRelativeTime } from '@/utils'

import { useWeatherStore } from '@/stores/weatherStore'
import { useStreamStore } from '@/stores/streamStore'
import { useUiStore } from '@/stores/uiStore'
import { useWeatherStream } from '@/composables/useWeatherStream'
import { searchCities } from '@/services'
import type { GeoLocation } from '@/types'

const weather = useWeatherStore()
const streamStore = useStreamStore()
const uiStore = useUiStore()
const { isPaused, timeRange } = storeToRefs(weather)
const { isStreamPaused, selectedCity } = storeToRefs(streamStore)

const weatherStream = useWeatherStream()
const { lastUpdated, isConnected, isStreaming } = weatherStream

const showCityModal = ref(false)
const citySearchTerm = ref('')
const citySearchResults = ref<GeoLocation[]>([])
const isSearching = ref(false)
const lastUpdatedLabel = ref('Never')

const TIME_RANGES = [
  { label: '1H', minutes: 60 },
  { label: '3H', minutes: 180 },
  { label: '6H', minutes: 360 },
  { label: '24H', minutes: 1440 },
  { label: 'Live', minutes: 99999 },
] as const

const currentTimeRange = computed(() => {
  return TIME_RANGES.find((r) => r.minutes === timeRange.value) || TIME_RANGES[4]
})

const isStreamActive = computed(() => {
  return isStreaming.value && !isPaused.value && !isStreamPaused.value
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
  weatherStream.forceRefresh()
}

function setTimeRange(minutes: number, label: string) {
  timeRange.value = minutes
  uiStore.setTimeRange(label)
}

// Update "Updated X ago" every 10 seconds
let updateInterval: ReturnType<typeof setInterval> | null = null

function updateLastUpdatedLabel() {
  if (lastUpdated.value) {
    lastUpdatedLabel.value = formatRelativeTime(lastUpdated.value)
  }
}

onMounted(() => {
  updateInterval = setInterval(updateLastUpdatedLabel, 10000)
  updateLastUpdatedLabel()
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<template>
  <div
    class="stream-controls bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-[64px] z-20 md:sticky md:top-[64px] fixed bottom-0 left-0 right-0 md:relative"
  >
    <div class="flex items-center justify-between gap-4 px-4 py-3">
      <!-- LEFT - Pause/Resume -->
      <button
        type="button"
        @click="handlePauseResume"
        class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200"
        :class="isPaused || isStreamPaused
          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'"
      >
        <span>{{ isPaused || isStreamPaused ? '▶' : '⏸' }}</span>
        <span>{{ isPaused || isStreamPaused ? 'Resume' : 'Pause' }}</span>
      </button>

      <!-- CENTRE - Time Range Pills -->
      <div class="flex items-center gap-1 flex-wrap">
        <button
          v-for="range in TIME_RANGES"
          :key="range.label"
          type="button"
          @click="setTimeRange(range.minutes, range.label)"
          class="px-3 py-1 text-sm font-medium rounded-md transition-all duration-200"
          :class="currentTimeRange.label === range.label
            ? 'bg-teal-600 text-white'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'"
        >
          {{ range.label }}
        </button>
      </div>

      <!-- RIGHT - Updated timestamp, Refresh, City -->
      <div class="flex items-center gap-3">
        <span class="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
          Updated {{ lastUpdatedLabel }}
        </span>
        
        <button
          type="button"
          @click="handleRefresh"
          class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="Manual refresh"
        >
          <svg class="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <button
          type="button"
          @click="showCityModal = true"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <span>📍</span>
          <span>{{ selectedCity?.city || 'City' }}</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
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
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
