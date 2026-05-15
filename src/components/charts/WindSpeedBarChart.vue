<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  MarkLineComponent,
} from 'echarts/components'
import type { EChartsOption } from 'echarts'
import { storeToRefs } from 'pinia'
import { useDarkMode } from '@/composables/useDarkMode'
import { useWeatherStore } from '@/stores/weatherStore'
import { format } from 'date-fns'
import { formatWindCompass } from '@/utils/formatters'
import BaseChart from './BaseChart.vue'

use([
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  MarkLineComponent,
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
  const windSpeeds = history.map((p) => p.windSpeed * 3.6) // Convert m/s to km/h
  const windDirections = history.map((p) => formatWindCompass(p.windDirection))

  const textColor = isDark.value ? '#f1f5f9' : '#1e293b'
  const gridColor = isDark.value ? '#334155' : '#e2e8f0'

  // Color bars based on intensity
  const barColors = windSpeeds.map((speed) => {
    if (speed < 20) return isDark.value ? '#22c55e' : '#16a34a' // Green - low
    if (speed < 40) return isDark.value ? '#eab308' : '#ca8a04' // Yellow - moderate
    if (speed < 60) return isDark.value ? '#f97316' : '#ea580c' // Orange - high
    return isDark.value ? '#ef4444' : '#dc2626' // Red - very high
  })

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
        const direction = windDirections[data.dataIndex]
        return `
          <div style="font-weight: 600; margin-bottom: 4px;">${data.axisValue}</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>Wind Speed: ${data.value.toFixed(1)} km/h</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>Direction: ${direction}</span>
          </div>
        `
      },
    },
    grid: {
      left: '10%',
      right: '5%',
      top: '10%',
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
        formatter: '{value} km/h',
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
        name: 'Wind Speed',
        type: 'bar',
        data: windSpeeds,
        itemStyle: {
          color: (params: any) => barColors[params.dataIndex],
        },
        markLine: {
          symbol: 'none',
          data: [
            {
              yAxis: 40,
              label: {
                formatter: 'Warning: 40 km/h',
                position: 'end',
                color: isDark.value ? '#f97316' : '#ea580c',
                fontWeight: 'bold',
              },
              lineStyle: {
                color: isDark.value ? '#f97316' : '#ea580c',
                type: 'solid',
                width: 2,
              },
            },
          ],
        },
      },
    ],
  }
})
</script>

<template>
  <BaseWidget title="Wind Speed" :is-loading="isLoading" skeleton-variant="chart">
    <BaseChart :option="chartOption" />
  </BaseWidget>
</template>
