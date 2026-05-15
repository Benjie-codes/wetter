<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useVirtualList } from '@vueuse/core'
import { formatRelativeTime } from '@/utils'

import { useWeatherStore } from '@/stores/weatherStore'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'

const weather = useWeatherStore()
const { eventFeed } = storeToRefs(weather)

const isLoading = computed(() => eventFeed.value.length === 0)

const searchTerm = ref('')
const feedContainer = ref<HTMLElement | null>(null)
const scrollPosition = ref(0)

const filteredFeed = computed(() => {
  let feed = [...eventFeed.value].reverse()
  
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    feed = feed.filter((event) => {
      const type = event.type.toLowerCase()
      const severity = event.severity.toLowerCase()
      return type.includes(term) || severity.includes(term)
    })
  }
  
  return feed
})

const shouldVirtualize = computed(() => filteredFeed.value.length > 20)

const { list: virtualList, containerProps, wrapperProps } = useVirtualList(
  filteredFeed,
  {
    itemHeight: 56,
    overscan: 5,
  },
)

const severityColors = {
  info: 'bg-blue-500',
  warning: 'bg-orange-500',
  critical: 'bg-red-500',
}

const severityBorders = {
  info: 'border-blue-500',
  warning: 'border-orange-500',
  critical: 'border-red-500',
}

function getSeverityColor(severity: string) {
  return severityColors[severity as keyof typeof severityColors] || severityColors.info
}

function getSeverityBorder(severity: string) {
  return severityBorders[severity as keyof typeof severityBorders] || severityBorders.info
}

function formatEventDescription(event: any): string {
  if (!event.payload) return ''
  if (typeof event.payload === 'string') return event.payload
  if (event.payload.reason) return event.payload.reason
  if (event.payload.message) return event.payload.message
  if (event.payload.city) return `City: ${event.payload.city}`
  return ''
}

// Preserve scroll position during updates
watch(filteredFeed, async () => {
  if (feedContainer.value) {
    scrollPosition.value = feedContainer.value.scrollTop
    await nextTick()
    if (feedContainer.value) {
      feedContainer.value.scrollTop = scrollPosition.value
    }
  }
}, { flush: 'post' })
</script>

<template>
  <div class="weather-feed">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-100">
        Activity Feed
      </h3>
      <input
        v-model="searchTerm"
        type="text"
        placeholder="Filter events..."
        class="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />
    </div>

    <div
      ref="feedContainer"
      class="max-h-[400px] overflow-y-auto"
    >
      <TransitionGroup name="feed" tag="div" class="space-y-2">
        <template v-if="!shouldVirtualize">
          <div
            v-for="event in filteredFeed"
            :key="event.timestamp"
            class="bg-white dark:bg-slate-700 rounded-lg mb-2 px-3 py-2 border-l-3"
            :class="getSeverityBorder(event.severity)"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                :class="getSeverityColor(event.severity)"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
                    {{ event.type }}
                  </span>
                  <span class="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                    {{ formatRelativeTime(event.timestamp) }}
                  </span>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {{ formatEventDescription(event) }}
                </p>
              </div>
            </div>
          </div>
        </template>
      </TransitionGroup>

      <div
        v-if="shouldVirtualize"
        v-bind="containerProps"
        class="relative"
      >
        <div v-bind="wrapperProps">
          <div
            v-for="{ data: event, index } in virtualList"
            :key="event.timestamp"
            class="bg-white dark:bg-slate-700 rounded-lg px-3 py-2 border-l-3 absolute left-0 right-0"
            :class="getSeverityBorder(event.severity)"
            :style="{ top: `${index * 56}px` }"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                :class="getSeverityColor(event.severity)"
              />
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-semibold uppercase tracking-wide text-slate-900 dark:text-slate-100">
                    {{ event.type }}
                  </span>
                  <span class="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                    {{ formatRelativeTime(event.timestamp) }}
                  </span>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {{ formatEventDescription(event) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="filteredFeed.length === 0"
        class="text-center text-sm text-slate-500 dark:text-slate-400 py-8"
      >
        No events matching filter
      </div>

      <!-- Skeleton loading state -->
      <div v-if="isLoading" class="space-y-2">
        <SkeletonLoader
          v-for="i in 3"
          :key="i"
          variant="feed-item"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.feed-enter-active {
  transition: all 0.2s ease-out;
}

.feed-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
