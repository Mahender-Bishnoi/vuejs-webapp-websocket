<!-- App.vue -->
<template>
  <div id="app">
    <nav class="navbar">
      <div class="navbar-brand">
        <router-link to="/" class="brand-link">
          <h1>My Application</h1>
        </router-link>
      </div>
      
      <div class="navbar-nav">
        <router-link to="/" class="nav-link">Dashboard</router-link>
        <router-link to="/notifications" class="nav-link">Notifications</router-link>
        <router-link to="/profile" class="nav-link">Profile</router-link>
        <router-link to="/settings" class="nav-link">Settings</router-link>
      </div>
      
      <div class="navbar-actions">
        <NotificationBell />
        <button @click="sendTestNotification" class="test-btn">
          Test Notification
        </button>
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NotificationBell from './components/NotificationBell.vue'
import { useNotificationStore } from './stores/notification'

const router = useRouter()
const notificationStore = useNotificationStore()

// Direct environment variable access
const baseURL = import.meta.env.VITE_API_URL

const isConnected = computed(() => notificationStore.isConnected)

const sendTestNotification = () => {
  sendNotification('info')
}

const sendNotification = async (type: 'info' | 'success' | 'warning' | 'error') => {
  const messages = {
    info: { title: 'Info', message: 'This is an informational message' },
    success: { title: 'Success', message: 'Operation completed successfully!' },
    warning: { title: 'Warning', message: 'Please check your input' },
    error: { title: 'Error', message: 'Something went wrong' }
  }

  const notification = messages[type]
  
  try {
    await fetch(`${baseURL}/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: notification.title,
        message: notification.message,
        type: type,
        userId: 'current-user-id'
      })
    })
  } catch (error) {
    console.error('Failed to send notification:', error)
  }
}

onMounted(() => {
  notificationStore.connectWebSocket()
})
</script>

<style scoped>
.navbar {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-brand .brand-link {
  text-decoration: none;
  color: inherit;
}

.navbar-brand h1 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.navbar-nav {
  display: flex;
  gap: 2rem;
}

.nav-link {
  text-decoration: none;
  color: #666;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: #007bff;
  background-color: rgba(0, 123, 255, 0.1);
}

.nav-link.router-link-active {
  color: #007bff;
  background-color: rgba(0, 123, 255, 0.1);
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.test-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.test-btn:hover {
  background: #0056b3;
}

.main-content {
  padding: 2rem;
  min-height: calc(100vh - 80px);
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;
  }
  
  .navbar-nav {
    gap: 1rem;
  }
  
  .main-content {
    padding: 1rem;
  }
}
</style>