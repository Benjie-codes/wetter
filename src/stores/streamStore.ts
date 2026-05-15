import { ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import type { GeoLocation } from '@/types'

export const useStreamStore = defineStore('stream', () => {
  const isStreaming = ref(false)
  const isConnected = ref(false)
  const isStreamPaused = ref(false)
  const reconnectAttempts = ref(0)
  const lastError = ref<string | null>(null)
  const selectedCity = shallowRef<GeoLocation | null>(null)

  return {
    isStreaming,
    isConnected,
    isStreamPaused,
    reconnectAttempts,
    lastError,
    selectedCity,
  }
})
