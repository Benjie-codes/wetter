<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useDebounceFn, onClickOutside } from '@vueuse/core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faBell, faMagnifyingGlass, faMoon, faSun, faXmark } from '@fortawesome/free-solid-svg-icons'
import { storeToRefs } from 'pinia'

import { searchCities } from '@/services'
import { useStreamStore } from '@/stores/streamStore'
import { useUiStore } from '@/stores/uiStore'
import { useWeatherStore } from '@/stores/weatherStore'
import type { GeoLocation } from '@/types'

const ui = useUiStore()
const { isDarkMode } = storeToRefs(ui)

const weather = useWeatherStore()
const { unreadCriticalFeedCount } = storeToRefs(weather)

const streamStore = useStreamStore()
const { isStreaming, isConnected, isStreamPaused } = storeToRefs(streamStore)

const isLive = computed(
  () => isStreaming.value && isConnected.value && !isStreamPaused.value,
)

const searchQuery = ref('')
const searchResults = ref<GeoLocation[]>([])
const searchLoading = ref(false)
const dropdownOpen = ref(false)
const mobileSearchOpen = ref(false)

const desktopSearchRoot = ref<HTMLElement | null>(null)
const mobileSearchRoot = ref<HTMLElement | null>(null)
const mobileSearchInput = ref<HTMLInputElement | null>(null)

const debouncedSearch = useDebounceFn(async (q: string) => {
  searchLoading.value = true
  try {
    searchResults.value = await searchCities(q)
  } catch {
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}, 300)

function clearSearch() {
  searchResults.value = []
  searchLoading.value = false
}

function handleSearchInput(raw: string) {
  searchQuery.value = raw
  if (!raw.trim()) {
    clearSearch()
    return
  }
  dropdownOpen.value = true
  void debouncedSearch(raw.trim())
}

function pickCity(city: GeoLocation) {
  streamStore.selectedCity = { ...city }
  searchQuery.value = ''
  searchResults.value = []
  dropdownOpen.value = false
  mobileSearchOpen.value = false
}

function onBellClick() {
  weather.acknowledgeCriticalFeed()
}

function toggleMobileSearch() {
  mobileSearchOpen.value = !mobileSearchOpen.value
  if (mobileSearchOpen.value) {
    void nextTick(() => {
      mobileSearchInput.value?.focus()
    })
  }
}

watch(mobileSearchOpen, (open) => {
  if (open && searchQuery.value.trim()) {
    dropdownOpen.value = true
  }
})

onClickOutside(desktopSearchRoot, () => {
  dropdownOpen.value = false
})

onClickOutside(mobileSearchRoot, () => {
  mobileSearchOpen.value = false
  dropdownOpen.value = false
})

onUnmounted(() => {
  clearSearch()
})

const badgeLabel = computed(() => {
  const n = unreadCriticalFeedCount.value
  if (n > 99) return '99+'
  return String(n)
})
</script>

<template>
  <header
    class="sticky top-0 z-30 border-b border-slate-200/80 bg-white transition-colors duration-200 dark:border-slate-700/80 dark:bg-slate-800"
  >
    <div class="flex h-14 items-center gap-3 px-4 md:gap-4">
      <p class="shrink-0 text-sm text-slate-800 md:text-base dark:text-slate-100">
        Hello,
        <span class="font-bold">Jack</span>
      </p>

      <div ref="desktopSearchRoot" class="relative hidden max-w-md flex-1 md:block">
        <div class="relative mx-auto w-full max-w-md">
          <FontAwesomeIcon
            :icon="faMagnifyingGlass"
            class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            autocomplete="off"
            placeholder="Search city…"
            class="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-900 outline-none ring-sky-500/30 transition focus:border-sky-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-400"
            :value="searchQuery"
            @input="handleSearchInput(($event.target as HTMLInputElement).value)"
            @focus="dropdownOpen = true"
          />
          <div
            v-show="dropdownOpen && (searchResults.length > 0 || searchLoading)"
            class="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800"
            role="listbox"
          >
            <p v-if="searchLoading" class="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
              Searching…
            </p>
            <button
              v-for="(city, i) in searchResults"
              :key="`${city.lat}-${city.lon}-${i}`"
              type="button"
              class="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700/80"
              role="option"
              @mousedown.prevent="pickCity(city)"
            >
              <span class="font-medium">{{ city.city }}</span>
              <span class="text-xs text-slate-500 dark:text-slate-400">{{ city.country }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="ml-auto flex shrink-0 items-center gap-2 md:ml-0 md:gap-3">
        <button
          type="button"
          class="flex size-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-700/60"
          :aria-expanded="mobileSearchOpen"
          aria-controls="mobile-city-search"
          aria-label="Open city search"
          @click="toggleMobileSearch"
        >
          <FontAwesomeIcon :icon="faMagnifyingGlass" class="size-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="relative flex size-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60"
          aria-label="Notifications"
          @click="onBellClick"
        >
          <FontAwesomeIcon :icon="faBell" class="size-5" aria-hidden="true" />
          <span
            v-if="unreadCriticalFeedCount > 0"
            class="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold leading-none text-white ring-2 ring-white dark:ring-slate-800"
          >
            {{ badgeLabel }}
          </span>
        </button>

        <button
          type="button"
          class="flex size-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60"
          :aria-label="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="ui.toggleDarkMode()"
        >
          <Transition
            mode="out-in"
            enter-active-class="icon-enter-active"
            enter-from-class="icon-enter-from"
            leave-active-class="icon-leave-active"
            leave-to-class="icon-leave-to"
          >
            <FontAwesomeIcon
              v-if="isDarkMode"
              :key="'sun'"
              :icon="faSun"
              class="size-5 text-amber-400"
              aria-hidden="true"
            />
            <FontAwesomeIcon
              v-else
              :key="'moon'"
              :icon="faMoon"
              class="size-5"
              aria-hidden="true"
            />
          </Transition>
        </button>

        <div
          class="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-600"
          :title="isLive ? 'Streaming' : 'Paused or disconnected'"
        >
          <span v-if="isLive" class="relative flex size-3 shrink-0">
            <span
              class="absolute inline-flex size-full rounded-full bg-emerald-400 opacity-60 pulse-dot"
              aria-hidden="true"
            />
            <span
              class="relative inline-flex size-3 rounded-full bg-emerald-500"
              aria-hidden="true"
            />
          </span>
          <span
            v-else
            class="size-3 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500"
            aria-hidden="true"
          />
          <span class="hidden text-xs text-slate-500 sm:inline dark:text-slate-400">
            {{ isLive ? 'Live' : 'Idle' }}
          </span>
        </div>
      </div>
    </div>

    <div
      v-show="mobileSearchOpen"
      id="mobile-city-search"
      ref="mobileSearchRoot"
      class="border-t border-slate-200 px-4 py-3 md:hidden dark:border-slate-700/80"
    >
      <div class="relative mb-2 flex items-center gap-2">
        <div class="relative min-w-0 flex-1">
          <FontAwesomeIcon
            :icon="faMagnifyingGlass"
            class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            ref="mobileSearchInput"
            type="search"
            autocomplete="off"
            placeholder="Search city…"
            class="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none ring-sky-500/30 focus:border-sky-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100"
            :value="searchQuery"
            @input="handleSearchInput(($event.target as HTMLInputElement).value)"
            @focus="dropdownOpen = true"
          />
        </div>
        <button
          type="button"
          class="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60"
          aria-label="Close search"
          @click="mobileSearchOpen = false"
        >
          <FontAwesomeIcon :icon="faXmark" class="size-5" aria-hidden="true" />
        </button>
      </div>
      <div
        v-show="dropdownOpen && (searchResults.length > 0 || searchLoading)"
        class="max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-md dark:border-slate-600 dark:bg-slate-800"
      >
        <p v-if="searchLoading" class="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
          Searching…
        </p>
        <button
          v-for="(city, i) in searchResults"
          :key="`m-${city.lat}-${city.lon}-${i}`"
          type="button"
          class="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-700/80"
          @mousedown.prevent="pickCity(city)"
        >
          <span class="font-medium">{{ city.city }}</span>
          <span class="text-xs text-slate-500 dark:text-slate-400">{{ city.country }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.icon-enter-active {
  transition: opacity 0.2s, transform 0.3s;
}
.icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg);
}
.icon-leave-active {
  transition: opacity 0.2s, transform 0.3s;
}
.icon-leave-to {
  opacity: 0;
  transform: rotate(90deg);
}

@keyframes pulse-dot {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.4);
    opacity: 0.7;
  }
}

.pulse-dot {
  animation: pulse-dot 2s ease-in-out infinite;
}
</style>
