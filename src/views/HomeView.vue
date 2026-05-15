<script setup lang="ts">
import DashboardGrid from '@/components/layout/DashboardGrid.vue'
import WeatherCard from '@/components/widgets/WeatherCard.vue'
import AirQualityCard from '@/components/widgets/AirQualityCard.vue'
import SunriseSunsetCard from '@/components/widgets/SunriseSunsetCard.vue'
import UVIndexCard from '@/components/widgets/UVIndexCard.vue'
import TemperatureLineChart from '@/components/charts/TemperatureLineChart.vue'
import WindSpeedBarChart from '@/components/charts/WindSpeedBarChart.vue'
import HumidityAreaChart from '@/components/charts/HumidityAreaChart.vue'
import TemperatureHeatmap from '@/components/charts/TemperatureHeatmap.vue'
import BaseWidget from '@/components/ui/BaseWidget.vue'
import StreamControls from '@/components/ui/StreamControls.vue'
import WeatherFeed from '@/components/feed/WeatherFeed.vue'
</script>

<template>
  <StreamControls />
  <DashboardGrid>
    <template #weather-hero>
      <WeatherCard />
    </template>
    <template #air-quality>
      <AirQualityCard />
    </template>
    <template #sun-card>
      <SunriseSunsetCard />
    </template>
    <template #uv-card>
      <UVIndexCard />
    </template>
    <template #temp-chart>
      <TemperatureLineChart />
    </template>
    <template #bar-chart>
      <WindSpeedBarChart />
    </template>
    <template #forecast-feed>
      <HumidityAreaChart />
    </template>
    <template #stream-controls>
      <BaseWidget title="Activity Feed">
        <WeatherFeed />
      </BaseWidget>
    </template>
  </DashboardGrid>
</template>
