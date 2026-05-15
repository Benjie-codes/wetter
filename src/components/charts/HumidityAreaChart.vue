<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  MarkAreaComponent,
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
  MarkAreaComponent,
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
  const humidity = history.map((p) => p.humidity)

  const textColor = isDark.value ? '#f1f5f9' : '#1e293b'
  const gridColor = isDark.value ? '#334155' : '#e2e8f0'
  const lineColor = isDark.value ? '#8b5cf6' : '#7c3aed'

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
        return `
          <div style="font-weight: 600; margin-bottom: 4px;">${data.axisValue}</div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>Humidity: ${data.value.toFixed(1)}%</span>
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
      min: 0,
      max: 100,
      axisLine: {
        lineStyle: {
          color: gridColor,
        },
      },
      axisLabel: {
        color: textColor,
        formatter: '{value}%',
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
        name: 'Humidity',
        type: 'line',
        data: humidity,
        step: 'middle',
        showSymbol: false,
        lineStyle: {
          color: lineColor,
          width: 2,
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
                color: isDark.value ? 'rgba(139, 92, 246, 0.4)' : 'rgba(124, 58, 237, 0.4)',
              },
              {
                offset: 1,
                color: isDark.value ? 'rgba(139, 92, 246, 0.05)' : 'rgba(124, 58, 237, 0.05)',
              },
            ],
          },
        },
        markArea: {
          silent: true,
          data: [
            [
              {
                yAxis: 0,
                label: {
                  show: true,
                  position: 'insideTopLeft',
                  formatter: 'Dry',
                  color: isDark.value ? '#22c55e' : '#16a34a',
                  fontSize: 10,
                },
                itemStyle: {
                  color: isDark.value ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.1)',
                },
              },
              {
                yAxis: 30,
              },
            ],
            [
              {
                yAxis: 30,
                label: {
                  show: true,
                  position: 'insideTopLeft',
                  formatter: 'Comfortable',
                  color: isDark.value ? '#eab308' : '#ca8a04',
                  fontSize: 10,
                },
                itemStyle: {
                  color: isDark.value ? 'rgba(234, 179, 8, 0.1)' : 'rgba(202, 138, 4, 0.1)',
                },
              },
              {
                yAxis: 60,
              },
            ],
            [
              {
                yAxis: 60,
                label: {
                  show: true,
                  position: 'insideTopLeft',
                  formatter: 'Humid',
                  color: isDark.value ? '#f97316' : '#ea580c',
                  fontSize: 10,
                },
                itemStyle: {
                  color: isDark.value ? 'rgba(249, 115, 22, 0.1)' : 'rgba(234, 88, 12, 0.1)',
                },
              },
              {
                yAxis: 100,
              },
            ],
          ],
        },
      },
    ],
  }
})
</script>

<template>
  <BaseWidget title="Humidity" :is-loading="isLoading" skeleton-variant="chart">
    <BaseChart :option="chartOption" />
  </BaseWidget>
</template>
