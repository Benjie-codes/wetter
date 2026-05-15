<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from 'echarts/components'
import type { EChartsOption } from 'echarts'
import { storeToRefs } from 'pinia'
import { useDarkMode } from '@/composables/useDarkMode'
import { useWeatherStore } from '@/stores/weatherStore'
import { format } from 'date-fns'
import BaseChart from './BaseChart.vue'

use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
])

const { isDarkMode: isDark } = useDarkMode()
const weather = useWeatherStore()
const { filteredHistory } = storeToRefs(weather)

const isLoading = computed(() => filteredHistory.value.length === 0)

const chartOption = computed<EChartsOption>(() => {
  const history = filteredHistory.value
  if (history.length === 0) {
    return {}
  }

  const timestamps = history.map((p) => format(p.timestamp, 'HH:mm'))
  const temperatures = history.map((p) => p.temperature)
  const feelsLike = history.map((p) => p.feelsLike)

  const textColor = isDark.value ? '#f1f5f9' : '#1e293b'
  const gridColor = isDark.value ? '#334155' : '#e2e8f0'
  const lineColor = isDark.value ? '#38bdf8' : '#0ea5e9'
  const feelsLikeColor = isDark.value ? '#94a3b8' : '#64748b'

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark.value ? '#1e293b' : '#ffffff',
      borderColor: isDark.value ? '#334155' : '#e2e8f0',
      textStyle: {
        color: textColor,
      },
      formatter: (params: any) => {
        const data = params[0]
        const feelsLikeData = params[1]
        return `
          <div style="font-weight: 600; margin-bottom: 4px;">${data.axisValue}</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: ${lineColor};">●</span>
            <span>Temperature: ${data.value.toFixed(1)}°C</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: ${feelsLikeColor};">●</span>
            <span>Feels like: ${feelsLikeData.value.toFixed(1)}°C</span>
          </div>
        `
      },
    },
    grid: {
      left: '10%',
      right: '5%',
      top: '15%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: timestamps,
      axisLine: {
        lineStyle: {
          color: gridColor,
        },
      },
      axisLabel: {
        color: textColor,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: gridColor,
        },
      },
      axisLabel: {
        color: textColor,
        formatter: '{value}°C',
      },
      splitLine: {
        lineStyle: {
          color: gridColor,
          type: 'dashed',
        },
      },
    },
    series: [
      {
        name: 'Temperature',
        type: 'line',
        data: temperatures,
        smooth: true,
        showSymbol: false,
        lineStyle: {
          color: lineColor,
          width: 3,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: isDark.value ? 'rgba(56, 189, 248, 0.3)' : 'rgba(14, 165, 233, 0.3)',
              },
              {
                offset: 1,
                color: isDark.value ? 'rgba(56, 189, 248, 0.05)' : 'rgba(14, 165, 233, 0.05)',
              },
            ],
          },
        },
      },
      {
        name: 'Feels Like',
        type: 'line',
        data: feelsLike,
        smooth: true,
        showSymbol: false,
        lineStyle: {
          color: feelsLikeColor,
          width: 2,
          type: 'dashed',
        },
      },
    ],
  }
})
</script>

<template>
  <BaseWidget title="Temperature" :is-loading="isLoading" skeleton-variant="chart">
    <BaseChart :option="chartOption" />
  </BaseWidget>
</template>
