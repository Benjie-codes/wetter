<script setup lang="ts">
defineProps<{
  title: string
  message: string
  retryLabel?: string
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div class="error-state flex flex-col items-center justify-center p-6 text-center">
    <svg
      class="w-10 h-10 text-orange-500 mb-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
    <h3 class="font-semibold text-slate-700 dark:text-slate-200 mb-2">
      {{ title }}
    </h3>
    <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
      {{ message }}
    </p>
    <button
      type="button"
      @click="emit('retry')"
      class="px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors"
    >
      {{ retryLabel || 'Try Again' }}
    </button>
  </div>
</template>
