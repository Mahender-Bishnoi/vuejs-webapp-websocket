<!-- src/views/Dashboard.vue -->
<template>
  <div class="dashboard">
    <div class="container">
      <h2>Dashboard</h2>
      <p>Welcome to your notification system dashboard.</p>
      
      <div class="notification-test-panel">
        <h3>Test Notifications</h3>
        <div class="test-controls">
          <button @click="sendNotification('info')" class="btn btn-info">
            Send Info Notification
          </button>
          <button @click="sendNotification('success')" class="btn btn-success">
            Send Success Notification
          </button>
          <button @click="sendNotification('warning')" class="btn btn-warning">
            Send Warning Notification
          </button>
          <button @click="sendNotification('error')" class="btn btn-error">
            Send Error Notification
          </button>
        </div>
      </div>

      <div class="connection-status">
        <div class="status-indicator">
          <span 
            class="status-dot"
            :class="{ 'connected': isConnected, 'disconnected': !isConnected }"
          ></span>
          WebSocket: {{ isConnected ? 'Connected' : 'Disconnected' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotificationStore } from '../stores/notification'

const notificationStore = useNotificationStore()
const isConnected = computed(() => notificationStore.isConnected)

const sendNotification = async (type: 'info' | 'success' | 'warning' | 'error') => {
  const messages = {
    info: { title: 'Info', message: 'This is an informational message' },
    success: { title: 'Success', message: 'Operation completed successfully!' },
    warning: { title: 'Warning', message: 'Please check your input' },
    error: { title: 'Error', message: 'Something went wrong' }
  }

  const notification = messages[type]
  const baseURL = import.meta.env.VITE_API_URL
  
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
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
}

.notification-test-panel {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
  margin: 2rem 0;
}

.test-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-info { background: #17a2b8; color: white; }
.btn-success { background: #28a745; color: white; }
.btn-warning { background: #ffc107; color: #212529; }
.btn-error { background: #dc3545; color: white; }

.connection-status {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.connected { background: #28a745; }
.status-dot.disconnected { background: #dc3545; }
</style>