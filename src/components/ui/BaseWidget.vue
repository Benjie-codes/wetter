<script setup lang="ts">
import { computed } from 'vue'
import ErrorState from './ErrorState.vue'
import SkeletonLoader from './SkeletonLoader.vue'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    isLoading?: boolean
    hasError?: boolean
    errorMessage?: string
    errorTitle?: string
    skeletonVariant?: 'card' | 'chart' | 'feed-item' | 'metric' | 'hero'
    /** `hero` = blue gradient hero; `aqi` = sky/teal dashboard tile */
    variant?: 'default' | 'hero' | 'aqi'
  }>(),
  {
    subtitle: undefined,
    isLoading: false,
    hasError: false,
    errorMessage: undefined,
    errorTitle: 'Error',
    skeletonVariant: 'card',
    variant: 'default',
  },
)

const emit = defineEmits<{
  retry: []
}>()

const isHero = computed(() => props.variant === 'hero')
const isAqi = computed(() => props.variant === 'aqi')
const isTinted = computed(() => isHero.value || isAqi.value)

const rootClass = computed(() => {
  if (isHero.value) {
    return 'border border-white/20 bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-sm dark:from-sky-500 dark:to-blue-800 dark:shadow-black/10'
  }
  if (isAqi.value) {
    return 'border border-white/20 bg-gradient-to-br from-sky-400 to-teal-600 text-white shadow-sm dark:from-sky-500 dark:to-teal-800 dark:shadow-black/10'
  }
  return 'border border-slate-200 bg-white text-slate-900 dark:border-slate-700/80 dark:bg-slate-800 dark:text-slate-100'
})

const headerClass = computed(() =>
  isTinted.value ? 'text-white' : 'text-slate-900 dark:text-slate-100',
)

const subtitleClass = computed(() =>
  isTinted.value ? 'text-white/75' : 'text-slate-500 dark:text-slate-400',
)
</script>

<template>
  <section
    class="rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md"
    :class="rootClass"
  >
    <header
      v-if="title || subtitle"
      class="transition-all duration-300"
      :class="[headerClass, subtitle ? 'mb-4' : 'mb-3']"
    >
      <h2 class="text-base font-semibold leading-tight tracking-tight">
        {{ title }}
      </h2>
      <p
        v-if="subtitle"
        class="mt-0.5 text-sm transition-all duration-300"
        :class="subtitleClass"
      >
        {{ subtitle }}
      </p>
    </header>

    <Transition name="fade" mode="out-in">
      <ErrorState
        v-if="hasError"
        :title="errorTitle"
        :message="errorMessage ?? 'Something went wrong.'"
        @retry="emit('retry')"
      />

      <SkeletonLoader
        v-else-if="isLoading"
        :variant="skeletonVariant"
      />

      <div v-else class="transition-all duration-300">
        <slot />
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
