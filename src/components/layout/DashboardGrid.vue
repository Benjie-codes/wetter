<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { useWeatherStore } from '@/stores/weatherStore'
import { useStreamStore } from '@/stores/streamStore'

/**
 * Main dashboard content grid.
 *
 * Slots: weather-hero, air-quality, temp-chart, bar-chart, sun-card, uv-card,
 * forecast-feed, stream-controls
 */
const weather = useWeatherStore()
const streamStore = useStreamStore()
const { isPaused } = storeToRefs(weather)
const { isStreamPaused } = storeToRefs(streamStore)

const isStreamPausedState = computed(() => isPaused.value || isStreamPaused.value)
</script>

<template>
  <main class="dashboard-grid bg-slate-50 p-4 transition-colors duration-200 dark:bg-slate-900 md:p-5 lg:p-6 relative">
    <!-- Paused Overlay Banner -->
    <Transition name="fade">
      <div
        v-if="isStreamPausedState"
        class="absolute top-0 left-0 right-0 h-8 bg-orange-500/20 text-orange-600 dark:text-orange-400 text-center text-sm flex items-center justify-center z-10"
      >
        ⏸  Stream paused — data is not updating
      </div>
    </Transition>

    <section class="dashboard-grid__cell min-w-0" data-area="weather-hero">
      <slot name="weather-hero" />
    </section>
    <section class="dashboard-grid__cell min-w-0" data-area="air-quality">
      <slot name="air-quality" />
    </section>
    <section class="dashboard-grid__cell min-w-0" data-area="temp-chart">
      <slot name="temp-chart" />
    </section>
    <section class="dashboard-grid__cell min-w-0" data-area="bar-chart">
      <slot name="bar-chart" />
    </section>
    <section class="dashboard-grid__cell min-w-0" data-area="sun-card">
      <slot name="sun-card" />
    </section>
    <section class="dashboard-grid__cell min-w-0" data-area="uv-card">
      <slot name="uv-card" />
    </section>
    <section class="dashboard-grid__cell min-w-0" data-area="forecast-feed">
      <slot name="forecast-feed" />
    </section>
    <section class="dashboard-grid__cell dashboard-grid__cell--stream min-w-0" data-area="stream-controls">
      <slot name="stream-controls" />
    </section>
  </main>
</template>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem; /* 16px mobile */
  min-height: 0;
}

.dashboard-grid__cell--stream {
  grid-column: 1 / -1;
}

@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.25rem; /* 20px tablet */
  }
}

@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem; /* 24px desktop */
  }
}

@media (min-width: 1280px) {
  .dashboard-grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(14rem, 20rem);
    grid-template-rows: auto auto minmax(0, 1fr) auto;
    grid-template-areas:
      'weather-hero air-quality sun-card'
      'temp-chart bar-chart uv-card'
      'temp-chart bar-chart forecast-feed'
      'stream-controls stream-controls stream-controls';
    gap: 1.5rem; /* 24px wide desktop */
    align-items: stretch;
  }

  .dashboard-grid__cell[data-area='weather-hero'] {
    grid-area: weather-hero;
  }
  .dashboard-grid__cell[data-area='air-quality'] {
    grid-area: air-quality;
  }
  .dashboard-grid__cell[data-area='temp-chart'] {
    grid-area: temp-chart;
    min-height: 300px;
  }
  .dashboard-grid__cell[data-area='bar-chart'] {
    grid-area: bar-chart;
    min-height: 300px;
  }
  .dashboard-grid__cell[data-area='sun-card'] {
    grid-area: sun-card;
  }
  .dashboard-grid__cell[data-area='uv-card'] {
    grid-area: uv-card;
  }
  .dashboard-grid__cell[data-area='forecast-feed'] {
    grid-area: forecast-feed;
    min-height: 300px;
  }
  .dashboard-grid__cell[data-area='stream-controls'] {
    grid-area: stream-controls;
    grid-column: unset;
    min-height: 200px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
