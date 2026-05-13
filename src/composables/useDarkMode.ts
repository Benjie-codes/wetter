import { watch } from 'vue'
import { storeToRefs } from 'pinia'

import { useUiStore } from '@/stores/uiStore'

const STORAGE_KEY = 'wetter:isDarkMode'

function readStoredDarkMode(): boolean | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    return raw === 'true' || raw === '1'
  } catch {
    return null
  }
}

function persistDarkMode(dark: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, dark ? 'true' : 'false')
  } catch {
    /* ignore quota / private mode */
  }
}

function applyDarkClass(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
}

/**
 * Keeps `document.documentElement` in sync with {@link useUiStore}.isDarkMode,
 * hydrates from localStorage or `prefers-color-scheme`, and persists every change.
 */
export function useDarkMode() {
  const ui = useUiStore()
  const { isDarkMode } = storeToRefs(ui)

  const stored = readStoredDarkMode()
  if (stored === null) {
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  } else {
    isDarkMode.value = stored
  }

  applyDarkClass(isDarkMode.value)

  watch(isDarkMode, (dark) => {
    applyDarkClass(dark)
    persistDarkMode(dark)
  })

  return { isDarkMode }
}
