<script setup lang="ts">
import { shallowRef, watch, watchEffect, onUnmounted, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import VChart from 'vue-echarts'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/uiStore'

use([CanvasRenderer])

const uiStore = useUiStore()
const { isDarkMode } = storeToRefs(uiStore)

const props = defineProps<{
  option: EChartsOption
  theme?: string | object
}>()

const chartRef = shallowRef<InstanceType<typeof VChart> | null>(null)

// Compute the effective theme based on dark mode
const effectiveTheme = computed(() => {
  if (props.theme) return props.theme
  return isDarkMode.value ? 'dark' : ''
})

// Watch for dark mode changes and update chart theme
watch(isDarkMode, () => {
  if (chartRef.value) {
    chartRef.value.setOption(props.option, { notMerge: true })
  }
})

watchEffect(() => {
  if (chartRef.value) {
    chartRef.value.setOption(props.option, { notMerge: false, lazyUpdate: true })
  }
})

// CLEANUP: ECharts disposed onUnmounted
onUnmounted(() => {
  if (chartRef.value) {
    chartRef.value.dispose()
  }
})
</script>

<template>
  <VChart
    ref="chartRef"
    :option="option"
    :theme="effectiveTheme"
    :init-options="{ renderer: 'canvas' }"
    :autoresize="true"
    class="base-chart"
  />
</template>

<style scoped>
.base-chart {
  width: 100%;
  height: 100%;
  min-height: 200px;
}
</style>
