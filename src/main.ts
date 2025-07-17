// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// Import your components/views
import Dashboard from './views/Dashboard.vue'
import NotificationsPage from './views/NotificationsPage.vue'
import Profile from './views/Profile.vue'
import Settings from './views/Settings.vue'

// Define routes
const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { title: 'Dashboard' }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: NotificationsPage,
    meta: { title: 'Notifications' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { title: 'Profile' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { title: 'Settings' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('./views/NotFound.vue'),
    meta: { title: 'Page Not Found' }
  }
]

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

// Global navigation guards
router.beforeEach((to, from, next) => {
  // Update page title
  document.title = to.meta.title ? `${to.meta.title} - Notification System` : 'Notification System'
  
  // Add authentication check here if needed
  // if (to.meta.requiresAuth && !isAuthenticated()) {
  //   next('/login')
  //   return
  // }
  
  next()
})

// Create app instance
const app = createApp(App)
const pinia = createPinia()

// Use plugins
app.use(pinia)
app.use(router)

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', instance)
  console.error('Info:', info)
}

// Global properties
app.config.globalProperties.$api = {
  baseURL: import.meta.env.VITE_API_URL,
  websocketURL: import.meta.env.VITE_WS_URL
}

// Mount the app
app.mount('#app')

// Clean up any existing service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister()
      console.log('Unregistered existing service worker:', registration.scope)
    }
  }).catch(error => {
    console.log('Error cleaning up service workers:', error)
  })
}