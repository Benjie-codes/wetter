import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  const isDarkMode = ref(false)
  const activeTimeRange = ref(60)
  const isPaused = ref(false)

  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value
  }

  return {
    isDarkMode,
    activeTimeRange,
    isPaused,
    toggleDarkMode,
  }
})
