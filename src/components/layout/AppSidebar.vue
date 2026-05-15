<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faCalendarDays,
  faCloudSun,
  faGear,
  faHouse,
  faWind,
} from '@fortawesome/free-solid-svg-icons'

const route = useRoute()

const nav = computed(() => [
  { name: 'home' as const, to: '/', label: 'Dashboard', icon: faHouse },
  { name: 'forecast' as const, to: '/forecast', label: 'Forecast', icon: faCalendarDays },
  { name: 'air-quality' as const, to: '/air-quality', label: 'Air Quality', icon: faWind },
  { name: 'settings' as const, to: '/settings', label: 'Settings', icon: faGear },
])

function isActive(item: (typeof nav.value)[number]): boolean {
  return route.name === item.name
}
</script>

<template>
  <aside
    class="fixed left-0 top-0 z-40 hidden h-screen w-[72px] flex-col border-r border-slate-700/60 bg-slate-800 lg:flex dark:border-slate-600/40 dark:bg-slate-800"
    aria-label="Main navigation"
  >
    <RouterLink
      to="/"
      class="flex shrink-0 flex-col items-center gap-1 border-b border-slate-700/60 px-2 py-4 transition-colors duration-200 hover:bg-slate-700/40 dark:border-slate-600/40"
    >
      <FontAwesomeIcon
        :icon="faCloudSun"
        class="size-7 text-sky-400 transition-colors duration-200"
        aria-hidden="true"
      />
      <span class="text-center text-[10px] font-semibold leading-tight tracking-tight text-white">
        Wetter
      </span>
    </RouterLink>

    <nav class="flex flex-1 flex-col items-center gap-1 px-2 py-3" role="navigation">
      <RouterLink
        v-for="item in nav"
        :key="item.name"
        :to="item.to"
        class="group relative flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
        :class="
          isActive(item)
            ? 'bg-slate-700/80 text-white'
            : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
        "
        :aria-current="isActive(item) ? 'page' : undefined"
      >
        <FontAwesomeIcon :icon="item.icon" class="size-5" aria-hidden="true" />
        <span
          class="pointer-events-none absolute left-full top-1/2 z-50 ml-3 w-max -translate-y-1/2 rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-200 group-hover:opacity-100 dark:bg-slate-700"
          role="tooltip"
        >
          {{ item.label }}
        </span>
      </RouterLink>
    </nav>
  </aside>
</template>
