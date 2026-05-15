import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/forecast',
      name: 'forecast',
      component: () => import('@/views/ForecastView.vue'),
    },
    {
      path: '/air-quality',
      name: 'air-quality',
      component: () => import('@/views/AirQualityView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
    },
  ],
})

export default router
