import { nextTick } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import Account from '@/types/account'

// Import your components/views
import Dashboard from '../views/Dashboard.vue'
import NotificationsPage from '../views/NotificationsPage.vue'
import Profile from '../views/Profile.vue'
import Settings from '../views/Settings.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Profile, // Using Profile as login component as per your original setup
      meta: { anonymous: true, title: 'Login' }
    },
    {
      path: '/',
      name: 'Dashboard',
      component: Dashboard,
      meta: { title: 'Dashboard' }
    },
    {
      path: '/home',
      name: 'home',
      component: Dashboard, // Redirect home to Dashboard for consistency
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
      path: '/about',
      name: 'about',
      component: Dashboard, // Keep your existing about route pointing to Dashboard
      meta: { title: 'About' }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFound.vue'),
      meta: { title: 'Page Not Found' }
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

const checkLogin = (to: any, from: any, next: () => any) => {
  const model = new Account()
  model.getLoginStatus(
    () => {
      next()
    },
    () => {
      router.push("/login")
    }
  )
}

// Global navigation guards
router.beforeEach((to, from, next) => {
  // Update page title
  document.title = to.meta.title ? `${to.meta.title} - Notification System` : 'Notification System'
  
  // Check if route allows anonymous access
  if (to.matched.some(m => m.meta.anonymous)) {
    next()
  } else {
    nextTick(() => checkLogin(to, from, next))
  }
})

export default router