<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { HeatmapChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  VisualMapComponent,
} from 'echarts/components'
import type { EChartsOption } from 'echarts'
import { storeToRefs } from 'pinia'
import { useDarkMode } from '@/composables/useDarkMode'
import { useWeatherStore } from '@/stores/weatherStore'
import { format } from 'date-fns'
import BaseChart from './BaseChart.vue'

use([
  HeatmapChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  VisualMapComponent,
])

const { isDarkMode: isDark } = useDarkMode()
const weather = useWeatherStore()
const { filteredHistory } = storeToRefs(weather)

const chartOption = computed<EChartsOption>(() => {
  const history = filteredHistory.value
  if (history.length === 0) {
    return {}
  }

  // Group data by day and hour for heatmap
  const dayMap = new Map<string, Map<number, number[]>>()
  
  history.forEach((p) => {
    const day = format(p.timestamp, 'EEE')
    const hour = new Date(p.timestamp).getHours()
    
    if (!dayMap.has(day)) {
      dayMap.set(day, new Map())
    }
    
    const hourMap = dayMap.get(day)!
    if (!hourMap.has(hour)) {
      hourMap.set(hour, [])
    }
    hourMap.get(hour)!.push(p.temperature)
  })

  // Convert to heatmap data format: [dayIndex, hour, temperature]
  const days = Array.from(dayMap.keys()).slice(-5) // Last 5 days
  const heatmapData: [number, number, number][] = []
  
  days.forEach((day, dayIndex) => {
    const hourMap = dayMap.get(day)
    if (hourMap) {
      hourMap.forEach((temps, hour) => {
        const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length
        heatmapData.push([dayIndex, hour, avgTemp])
      })
    }
  })

  const textColor = isDark.value ? '#f1f5f9' : '#1e293b'
  const gridColor = isDark.value ? '#334155' : '#e2e8f0'

  return {
    tooltip: {
      position: 'top',
      backgroundColor: isDark.value ? '#1e293b' : '#ffffff',
      borderColor: isDark.value ? '#334155' : '#e2e8f0',
      textStyle: {
        color: textColor,
      },
      formatter: (params: any) => {
        const day = days[params.value[0]]
        const hour = params.value[1]
        const temp = params.value[2]
        return `
          <div style="font-weight: 600; margin-bottom: 4px;">${day} ${hour}:00</div>
          <div>Temperature: ${temp.toFixed(1)}°C</div>
        `
      },
    },
    grid: {
      height: '70%',
      top: '10%',
      left: '10%',
      right: '5%',
      bottom: '15%',
    },
    xAxis: {
      type: 'category',
      data: days,
      splitArea: {
        show: true,
      },
      axisLabel: {
        color: textColor,
      },
      axisLine: {
        lineStyle: {
          color: gridColor,
        },
      },
    },
    yAxis: {
      type: 'category',
      data: Array.from({ length: 24 }, (_, i) => i),
      splitArea: {
        show: true,
      },
      axisLabel: {
        color: textColor,
        formatter: '{value}:00',
      },
      axisLine: {
        lineStyle: {
          color: gridColor,
        },
      },
    },
    visualMap: {
      min: Math.min(...heatmapData.map((d) => d[2])),
      max: Math.max(...heatmapData.map((d) => d[2])),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      inRange: {
        color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
      },
      textStyle: {
        color: textColor,
      },
    },
    series: [
      {
        name: 'Temperature',
        type: 'heatmap',
        data: heatmapData,
        label: {
          show: false,
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
    ],
  }
})
</script>

<template>
  <BaseChart :option="chartOption" />
</template>
