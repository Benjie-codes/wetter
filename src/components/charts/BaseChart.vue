<script setup lang="ts">
import { shallowRef, watchEffect, onUnmounted, type PropType } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import VChart from 'vue-echarts'

use([CanvasRenderer]) 

const props = defineProps<{
  option: EChartsOption
  theme?: string | object
}>()

const chartRef = shallowRef<InstanceType<typeof VChart> | null>(null)

watchEffect(() => {
  if (chartRef.value) {
    chartRef.value.setOption(props.option, { notMerge: false, lazyUpdate: true })
  }
})

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
    :theme="theme"
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
