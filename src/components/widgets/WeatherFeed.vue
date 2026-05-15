<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useVirtualList } from '@vueuse/core'
import { formatRelativeTime } from '@/utils'

import { useWeatherStore } from '@/stores/weatherStore'
import { useDarkMode } from '@/composables/useDarkMode'

const { isDarkMode: isDark } = useDarkMode()
const weather = useWeatherStore()
const { eventFeed, unreadCriticalFeedCount } = storeToRefs(weather)

const searchTerm = ref('')
const severityFilter = ref<'all' | 'info' | 'warning' | 'critical'>('all')
const feedContainer = ref<HTMLElement | null>(null)

const filteredFeed = computed(() => {
  let feed = [...eventFeed.value].reverse()
  
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    feed = feed.filter((event) => {
      const type = event.type.toLowerCase()
      const payload = JSON.stringify(event.payload).toLowerCase()
      return type.includes(term) || payload.includes(term)
    })
  }
  
  if (severityFilter.value !== 'all') {
    feed = feed.filter((event) => event.severity === severityFilter.value)
  }
  
  return feed
})

const { list: virtualList, containerProps, wrapperProps } = useVirtualList(
  filteredFeed,
  {
    itemHeight: 80,
    overscan: 5,
  },
)

const severityColors = computed(() => ({
  info: isDark.value ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-700',
  warning: isDark.value ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-700',
  critical: isDark.value ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-700',
}))

const severityIcons = computed(() => ({
  info: '●',
  warning: '▲',
  critical: '⚠',
}))

function getSeverityClass(severity: string) {
  return severityColors.value[severity as keyof typeof severityColors.value] || severityColors.value.info
}

function getSeverityIcon(severity: string) {
  return severityIcons.value[severity as keyof typeof severityIcons.value] || severityIcons.value.info
}

function formatEventPayload(payload: unknown): string {
  if (typeof payload === 'string') return payload
  if (typeof payload === 'object' && payload !== null) {
    return JSON.stringify(payload, null, 2)
  }
  return String(payload)
}

// Acknowledge critical events when feed is viewed
watch(unreadCriticalFeedCount, (count) => {
  if (count > 0) {
    weather.acknowledgeCriticalFeed()
  }
})
</script>

<template>
  <div class="weather-feed flex flex-col h-full">
    <div class="flex items-center justify-between gap-2 mb-3">
      <div class="flex items-center gap-2 flex-1">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Search events..."
          class="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <select
        v-model="severityFilter"
        class="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        <option value="all">All</option>
        <option value="info">Info</option>
        <option value="warning">Warning</option>
        <option value="critical">Critical</option>
      </select>
    </div>

    <div
      ref="feedContainer"
      v-bind="containerProps"
      class="flex-1 overflow-auto rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
    >
      <div v-bind="wrapperProps" class="relative">
        <TransitionGroup name="feed-item" tag="div" class="space-y-2 p-2">
          <div
            v-for="{ data: event, index } in virtualList"
            :key="event.timestamp"
            :style="{ position: 'absolute', top: `${index * 80}px`, left: 0, right: 0 }"
            class="feed-item p-3 rounded-lg border transition-all duration-300"
            :class="getSeverityClass(event.severity)"
          >
            <div class="flex items-start gap-3">
              <span class="text-lg" aria-hidden="true">
                {{ getSeverityIcon(event.severity) }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2 mb-1">
                  <span class="text-xs font-semibold uppercase tracking-wide">
                    {{ event.type }}
                  </span>
                  <span class="text-xs opacity-70">
                    {{ formatRelativeTime(event.timestamp) }}
                  </span>
                </div>
                <pre
                  v-if="event.payload"
                  class="text-xs whitespace-pre-wrap break-words opacity-90 font-mono"
                >{{ formatEventPayload(event.payload) }}</pre>
              </div>
            </div>
          </div>
        </TransitionGroup>
        
        <div
          v-if="filteredFeed.length === 0"
          class="absolute inset-0 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400"
        >
          No events to display
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feed-item-enter-active,
.feed-item-leave-active {
  transition: all 0.3s ease;
}

.feed-item-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.feed-item-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.feed-item-move {
  transition: transform 0.3s ease;
}
</style>
