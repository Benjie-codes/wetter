<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    value: string
    /** Unicode symbol or SVG path `d` string */
    icon?: string
    trend: 'up' | 'down' | 'neutral'
    trendValue?: string
  }>(),
  {
    icon: '',
    trendValue: undefined,
  },
)

const isSvgPath = computed(() => {
  const t = props.icon.trim()
  if (t.length < 8) return false
  return /^M[\d\s,.+-]+/i.test(t) || /^m[\d\s,.+-]+/.test(t)
})

const trendGlyph = computed(() => {
  if (props.trend === 'up') return '▲'
  if (props.trend === 'down') return '▼'
  return '—'
})

const trendClass = computed(() => {
  if (props.trend === 'up') return 'text-emerald-600 dark:text-emerald-400'
  if (props.trend === 'down') return 'text-red-600 dark:text-red-400'
  return 'text-slate-400 dark:text-slate-500'
})
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-colors duration-200 dark:border-slate-600 dark:bg-slate-800/90"
  >
    <div
      v-if="icon"
      class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
    >
      <svg
        v-if="isSvgPath"
        viewBox="0 0 24 24"
        class="size-6"
        aria-hidden="true"
      >
        <path fill="currentColor" :d="icon" />
      </svg>
      <span v-else class="text-lg leading-none">{{ icon }}</span>
    </div>
    <div class="min-w-0 flex-1">
      <p class="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {{ label }}
      </p>
      <p class="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
        {{ value }}
      </p>
    </div>
    <div class="flex shrink-0 flex-col items-end gap-0.5 text-xs">
      <span class="font-semibold leading-none" :class="trendClass" aria-hidden="true">
        {{ trendGlyph }}
      </span>
      <span v-if="trendValue" class="tabular-nums text-slate-600 dark:text-slate-300">
        {{ trendValue }}
      </span>
    </div>
  </div>
</template>
