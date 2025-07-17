<!-- src/views/Dashboard.vue -->
<template>
  <div class="dashboard">
    <div class="container">
      <h2>Dashboard</h2>
      <p>Welcome to your notification system dashboard.</p>
      
      <div class="notification-test-panel">
        <h3>Test Notifications via API</h3>
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

      <div class="notification-test-panel">
        <h3>Test Notifications Directly (Store)</h3>
        <div class="test-controls">
          <button @click="addTestNotification('info')" class="btn btn-info">
            Add Info to Store
          </button>
          <button @click="addTestNotification('success')" class="btn btn-success">
            Add Success to Store
          </button>
          <button @click="addTestNotification('warning')" class="btn btn-warning">
            Add Warning to Store
          </button>
          <button @click="addTestNotification('error')" class="btn btn-error">
            Add Error to Store
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
        <div class="status-info">
          <p>Total Notifications: {{ notificationCount }}</p>
          <p>Unread: {{ unreadCount }}</p>
        </div>
      </div>

      <div class="debug-panel">
        <h3>Debug Info</h3>
        <div class="debug-info">
          <p><strong>API URL:</strong> {{ apiUrl }}</p>
          <p><strong>WebSocket URL:</strong> {{ wsUrl }}</p>
          <p><strong>Reconnect Attempts:</strong> {{ reconnectAttempts }}</p>
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
const notificationCount = computed(() => notificationStore.notifications.length)
const unreadCount = computed(() => notificationStore.unreadCount)
const reconnectAttempts = computed(() => notificationStore.reconnectAttempts)

const apiUrl = import.meta.env.VITE_API_URL
const wsUrl = import.meta.env.VITE_WS_URL

const sendNotification = async (type: 'info' | 'success' | 'warning' | 'error') => {
  const messages = {
    info: { title: 'API Info', message: 'This is an API informational message' },
    success: { title: 'API Success', message: 'API operation completed successfully!' },
    warning: { title: 'API Warning', message: 'API warning - please check your input' },
    error: { title: 'API Error', message: 'API error - something went wrong' }
  }

  const notification = messages[type]
  
  try {
    const response = await fetch(`${apiUrl}/notifications/send`, {
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    console.log('Notification sent successfully via API')
  } catch (error) {
    console.error('Failed to send notification via API:', error)
    
    // Show error notification
    alert(`Failed to send notification: ${error}`)
  }
}

const addTestNotification = (type: 'info' | 'success' | 'warning' | 'error') => {
  notificationStore.addTestNotification(type)
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
  border: 1px solid #e9ecef;
}

.notification-test-panel h3 {
  margin-top: 0;
  color: #495057;
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

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-info { background: #17a2b8; color: white; }
.btn-info:hover { background: #138496; }

.btn-success { background: #28a745; color: white; }
.btn-success:hover { background: #218838; }

.btn-warning { background: #ffc107; color: #212529; }
.btn-warning:hover { background: #e0a800; }

.btn-error { background: #dc3545; color: white; }
.btn-error:hover { background: #c82333; }

.connection-status {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.connected { 
  background: #28a745; 
  animation: pulse 2s infinite;
}

.status-dot.disconnected { 
  background: #dc3545; 
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.status-info p {
  margin: 0.5rem 0;
  color: #495057;
}

.debug-panel {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.debug-panel h3 {
  margin-top: 0;
  color: #495057;
}

.debug-info p {
  margin: 0.5rem 0;
  font-family: monospace;
  font-size: 0.9rem;
  color: #495057;
}
</style>