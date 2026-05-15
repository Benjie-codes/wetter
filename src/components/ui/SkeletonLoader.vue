<script setup lang="ts">
import type { PropType } from 'vue'

defineProps<{
  variant?: 'card' | 'chart' | 'feed-item' | 'metric' | 'hero'
}>()
</script>

<template>
  <div class="skeleton-loader animate-pulse bg-slate-200 dark:bg-slate-600 rounded">
    <!-- Hero variant: tall card with lines and badges -->
    <template v-if="variant === 'hero'">
      <div class="min-h-[200px] p-4 space-y-3">
        <div class="h-4 bg-slate-300 dark:bg-slate-500 rounded w-1/5" />
        <div class="h-4 bg-slate-300 dark:bg-slate-500 rounded w-2/5" />
        <div class="h-12 bg-slate-300 dark:bg-slate-500 rounded w-full" />
        <div class="flex gap-2 mt-4">
          <div class="w-8 h-8 bg-slate-300 dark:bg-slate-500 rounded" />
          <div class="w-8 h-8 bg-slate-300 dark:bg-slate-500 rounded" />
          <div class="w-8 h-8 bg-slate-300 dark:bg-slate-500 rounded" />
        </div>
      </div>
    </template>

    <!-- Card variant: short line + wide rectangle -->
    <template v-else-if="variant === 'card'">
      <div class="p-4 space-y-3">
        <div class="h-4 bg-slate-300 dark:bg-slate-500 rounded w-3/10" />
        <div class="h-20 bg-slate-300 dark:bg-slate-500 rounded w-full" />
      </div>
    </template>

    <!-- Chart variant: wide rectangle + axis lines -->
    <template v-else-if="variant === 'chart'">
      <div class="p-4 space-y-3">
        <div class="h-[200px] bg-slate-300 dark:bg-slate-500 rounded w-full" />
        <div class="h-2 bg-slate-300 dark:bg-slate-500 rounded w-full" />
        <div class="h-2 bg-slate-300 dark:bg-slate-500 rounded w-3/4" />
      </div>
    </template>

    <!-- Feed-item variant: circle + two lines -->
    <template v-else-if="variant === 'feed-item'">
      <div class="flex items-center gap-3 p-3">
        <div class="w-8 h-8 bg-slate-300 dark:bg-slate-500 rounded-full flex-shrink-0" />
        <div class="flex-1 space-y-2">
          <div class="h-3 bg-slate-300 dark:bg-slate-500 rounded w-7/10" />
          <div class="h-3 bg-slate-300 dark:bg-slate-500 rounded w-4/10" />
        </div>
      </div>
    </template>

    <!-- Metric variant: small square + centred lines -->
    <template v-else-if="variant === 'metric'">
      <div class="w-20 h-15 flex flex-col items-center justify-center space-y-2">
        <div class="w-16 h-12 bg-slate-300 dark:bg-slate-500 rounded" />
        <div class="h-3 bg-slate-300 dark:bg-slate-500 rounded w-12" />
        <div class="h-3 bg-slate-300 dark:bg-slate-500 rounded w-8" />
      </div>
    </template>

    <!-- Default: card variant -->
    <template v-else>
      <div class="p-4 space-y-3">
        <div class="h-4 bg-slate-300 dark:bg-slate-500 rounded w-3/10" />
        <div class="h-20 bg-slate-300 dark:bg-slate-500 rounded w-full" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.skeleton-loader {
  width: 100%;
  height: 100%;
}
</style>
