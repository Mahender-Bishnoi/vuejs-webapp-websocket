<!-- components/NotificationBell.vue -->
<template>
  <div class="notification-bell-container">
    <button 
      @click="toggleDropdown" 
      class="notification-bell-button"
      :class="{ 'blinking': isBlinking }"
      :title="`${unreadCount} unread notifications`"
    >
      <svg 
        class="bell-icon" 
        fill="currentColor" 
        viewBox="0 0 24 24"
        width="24" 
        height="24"
      >
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
      </svg>
      
      <span 
        v-if="hasUnread" 
        class="notification-badge"
        :class="{ 'pulse': isBlinking }"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <div 
      v-if="showDropdown" 
      class="notification-dropdown"
      v-click-outside="closeDropdown"
    >
      <div class="notification-header">
        <h3>Notifications</h3>
        <div class="notification-actions">
          <button 
            v-if="hasUnread" 
            @click="markAllAsRead"
            class="mark-all-read-btn"
          >
            Mark all read
          </button>
          <button 
            v-if="notifications.length > 0"
            @click="clearAll"
            class="clear-all-btn"
          >
            Clear all
          </button>
        </div>
      </div>

      <div class="notification-list">
        <div 
          v-if="notifications.length === 0" 
          class="no-notifications"
        >
          No notifications yet
        </div>

        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="notification-item"
          :class="{ 'unread': !notification.read }"
          @click="markAsRead(notification.id)"
        >
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-timestamp">
              {{ formatTimestamp(notification.timestamp) }}
            </div>
          </div>
          <div class="notification-type-indicator" :class="notification.type"></div>
          <button 
            @click.stop="removeNotification(notification.id)"
            class="remove-btn"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotificationStore } from '../stores/notification'

const notificationStore = useNotificationStore()

const showDropdown = ref(false)
const isBlinking = ref(false)
let blinkTimeout: number | null = null

const notifications = computed(() => notificationStore.notifications)
const unreadCount = computed(() => notificationStore.unreadCount)
const hasUnread = computed(() => notificationStore.hasUnread)

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    stopBlinking()
  }
}

const closeDropdown = () => {
  showDropdown.value = false
}

const markAsRead = (id: string) => {
  notificationStore.markAsRead(id)
}

const markAllAsRead = () => {
  notificationStore.markAllAsRead()
  stopBlinking()
}

const removeNotification = (id: string) => {
  notificationStore.removeNotification(id)
}

const clearAll = () => {
  notificationStore.clearAllNotifications()
  stopBlinking()
}

const startBlinking = () => {
  isBlinking.value = true
  
  // Stop blinking after 5 seconds
  if (blinkTimeout) {
    clearTimeout(blinkTimeout)
  }
  
  blinkTimeout = setTimeout(() => {
    stopBlinking()
  }, 5000)
}

const stopBlinking = () => {
  isBlinking.value = false
  if (blinkTimeout) {
    clearTimeout(blinkTimeout)
    blinkTimeout = null
  }
}

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return date.toLocaleDateString()
}

const handleNotificationReceived = () => {
  startBlinking()
}

// Listen for notification events
onMounted(() => {
  window.addEventListener('notification-received', handleNotificationReceived)
  
  // Connect to WebSocket
  notificationStore.connectWebSocket()
})

onUnmounted(() => {
  window.removeEventListener('notification-received', handleNotificationReceived)
  if (blinkTimeout) {
    clearTimeout(blinkTimeout)
  }
})

// Click outside directive
const vClickOutside = {
  beforeMount(el: any, binding: any) {
    el.clickOutsideEvent = (event: Event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent)
  },
  unmounted(el: any) {
    document.removeEventListener('click', el.clickOutsideEvent)
  }
}
</script>

<style scoped>
.notification-bell-container {
  position: relative;
  display: inline-block;
}

.notification-bell-button {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.notification-bell-button:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.bell-icon {
  width: 24px;
  height: 24px;
  color: #666;
  transition: color 0.3s ease;
}

.notification-bell-button:hover .bell-icon {
  color: #333;
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #ff4444;
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  line-height: 1;
  padding: 0 4px;
}

.blinking {
  animation: blink 1s infinite;
}

.pulse {
  animation: pulse 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.3; }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 350px;
  max-height: 400px;
  overflow: hidden;
  z-index: 1000;
  margin-top: 5px;
}

.notification-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.notification-actions {
  display: flex;
  gap: 10px;
}

.mark-all-read-btn,
.clear-all-btn {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.mark-all-read-btn:hover,
.clear-all-btn:hover {
  background-color: rgba(0, 123, 255, 0.1);
}

.notification-list {
  max-height: 300px;
  overflow-y: auto;
}

.no-notifications {
  padding: 40px 20px;
  text-align: center;
  color: #666;
  font-style: italic;
}

.notification-item {
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  position: relative;
  transition: background-color 0.2s ease;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #f0f7ff;
  border-left: 3px solid #007bff;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 4px;
}

.notification-timestamp {
  font-size: 11px;
  color: #999;
}

.notification-type-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}

.notification-type-indicator.info {
  background-color: #17a2b8;
}

.notification-type-indicator.success {
  background-color: #28a745;
}

.notification-type-indicator.warning {
  background-color: #ffc107;
}

.notification-type-indicator.error {
  background-color: #dc3545;
}

.remove-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.remove-btn:hover {
  background-color: #f5f5f5;
  color: #666;
}
</style>