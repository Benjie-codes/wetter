import { createApp } from 'vue'
import { config } from '@fortawesome/fontawesome-svg-core'
import { createPinia } from 'pinia'
import '@fortawesome/fontawesome-svg-core/styles.css'
import '@/assets/main.css'

import App from './App.vue'
import router from './router'
import { useWeatherStore } from '@/stores/weatherStore'

config.autoAddCss = false

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  const store = useWeatherStore()
  store.addFeedEvent({
    type: 'error',
    severity: 'critical',
    timestamp: Date.now(),
    payload: null,
  })
  console.error('[Wetter Error]', err, info)
}

app.mount('#app')
