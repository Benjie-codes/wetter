<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { formatRelativeTime } from '@/utils'

import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useDarkMode } from '@/composables/useDarkMode'
import { useWeatherStream } from '@/composables/useWeatherStream'
import { useStreamStore } from '@/stores/streamStore'

useDarkMode()

const streamStore = useStreamStore()
const { isConnected } = storeToRefs(streamStore)

streamStore.selectedCity = {
  city: 'Lagos',
  country: 'NG',
  lat: 6.5244,
  lon: 3.3792,
}

const weatherStream = useWeatherStream()
const { lastUpdated } = weatherStream

const lastUpdatedLabel = computed(() => {
  if (!lastUpdated.value) return 'never'
  return formatRelativeTime(lastUpdated.value)
})

function handleReconnect() {
  weatherStream.forceRefresh()
}

onMounted(() => {
  weatherStream.start()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-900">
    <!-- Connection Banner -->
    <Transition name="slide-down">
      <div
        v-if="!isConnected"
        class="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white py-2 text-sm text-center"
      >
        ⚠️ Connection lost · Last updated {{ lastUpdatedLabel }} ·
        <button
          type="button"
          class="text-white underline hover:no-underline ml-2"
          @click="handleReconnect"
        >
          Reconnect
        </button>
      </div>
    </Transition>

    <AppSidebar />
    <div class="min-h-screen lg:pl-[72px]">
      <AppHeader />
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
}

.slide-down-leave-to {
  transform: translateY(-100%);
}
</style>
