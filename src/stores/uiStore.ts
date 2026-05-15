import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  const isDarkMode = ref(false)
  const activeTimeRange = ref(60)
  const isPaused = ref(false)

  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value
  }

  function setTimeRange(label: string) {
    activeTimeRange.value = label === 'Live' ? 99999 : parseInt(label) * 60
  }

  return {
    isDarkMode,
    activeTimeRange,
    isPaused,
    toggleDarkMode,
    setTimeRange,
  }
})
