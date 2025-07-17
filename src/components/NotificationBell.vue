<template>
  <div class="notification-bell-container">
    <!-- Bell Icon Button -->
    <button
      @click="handleBellClick"
      class="bell-button"
      :class="{ 'bell-animate': isAnimating }"
      :title="hasUnread ? `${unreadCount} unread notifications` : 'No new notifications'"
    >
      <!-- Bell Icon -->
      <svg
        class="bell-icon"
        :class="{ 'has-unread': hasUnread }"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      
      <!-- Notification Badge -->
      <span
        v-if="hasUnread"
        class="notification-badge"
        :class="{ 'badge-animate': isAnimating }"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- Notification Dropdown -->
    <div
      v-if="showDropdown"
      class="notification-dropdown"
      @click.stop
    >
      <!-- Dropdown Header -->
      <div class="dropdown-header">
        <h3>Notifications</h3>
        <div class="header-actions">
          <button
            v-if="hasUnread"
            @click="markAllAsRead"
            class="mark-all-read-btn"
          >
            Mark all read
          </button>
          <button
            v-if="notifications.length > 0"
            @click="clearAllNotifications"
            class="clear-all-btn"
          >
            Clear all
          </button>
        </div>
      </div>

      <!-- Notification List -->
      <div class="notification-list">
        <div
          v-if="notifications.length === 0"
          class="no-notifications"
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <p>No notifications yet</p>
        </div>

        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="{ 'unread': !notification.read, [notification.type]: true }"
          @click="handleNotificationClick(notification)"
        >
          <!-- Notification Icon -->
          <div class="notification-icon">
            <svg
              v-if="notification.type === 'success'"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22,4 12,14.01 9,11.01"></polyline>
            </svg>
            <svg
              v-else-if="notification.type === 'error'"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <svg
              v-else-if="notification.type === 'warning'"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <svg
              v-else
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>

          <!-- Notification Content -->
          <div class="notification-content">
            <h4 class="notification-title">{{ notification.title }}</h4>
            <p class="notification-message">{{ notification.message }}</p>
            <span class="notification-time">{{ formatTime(notification.timestamp) }}</span>
          </div>

          <!-- Unread Indicator -->
          <div
            v-if="!notification.read"
            class="unread-indicator"
          ></div>

          <!-- Close Button -->
          <button
            @click.stop="removeNotification(notification.id)"
            class="remove-btn"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Overlay to close dropdown -->
    <div
      v-if="showDropdown"
      class="dropdown-overlay"
      @click="closeDropdown"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotificationStore } from '@/stores/notification'

const notificationStore = useNotificationStore()

// Reactive references
const showDropdown = ref(false)
const isAnimating = ref(false)

// Computed properties
const notifications = computed(() => notificationStore.notifications)
const unreadCount = computed(() => notificationStore.unreadCount)
const hasUnread = computed(() => notificationStore.hasUnread)

// Handle bell click - mark all as read and toggle dropdown
const handleBellClick = () => {
  // Mark all notifications as read when bell is clicked
  if (hasUnread.value) {
    notificationStore.markAllAsRead()
  }
  
  // Toggle dropdown
  showDropdown.value = !showDropdown.value
}

// Handle individual notification click
const handleNotificationClick = (notification: any) => {
  // Mark individual notification as read
  notificationStore.markAsRead(notification.id)
  
  // You can add custom logic here for notification click
  console.log('Notification clicked:', notification)
}

// Close dropdown
const closeDropdown = () => {
  showDropdown.value = false
}

// Mark all notifications as read
const markAllAsRead = () => {
  notificationStore.markAllAsRead()
}

// Clear all notifications
const clearAllNotifications = () => {
  notificationStore.clearAllNotifications()
  closeDropdown()
}

// Remove individual notification
const removeNotification = (id: string) => {
  notificationStore.removeNotification(id)
}

// Format timestamp
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

// Handle notification received event
const handleNotificationReceived = () => {
  triggerBellAnimation()
}

// Trigger bell animation
const triggerBellAnimation = () => {
  isAnimating.value = true
  setTimeout(() => {
    isAnimating.value = false
  }, 600)
}

// Handle click outside to close dropdown
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.notification-bell-container')) {
    showDropdown.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('notification-received', handleNotificationReceived)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('notification-received', handleNotificationReceived)
})
</script>

<style scoped>
.notification-bell-container {
  position: relative;
  display: inline-block;
}

.bell-button {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bell-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.bell-icon {
  color: #6b7280;
  transition: all 0.2s ease;
}

.bell-icon.has-unread {
  color: #3b82f6;
}

.bell-animate {
  animation: bellShake 0.6s ease-in-out;
}

@keyframes bellShake {
  0%, 100% { transform: rotate(0deg); }
  10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
  20%, 40%, 60%, 80% { transform: rotate(10deg); }
}

.notification-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background-color: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  line-height: 1.2;
}

.badge-animate {
  animation: badgePulse 0.6s ease-in-out;
}

@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 380px;
  max-height: 500px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;
  margin-top: 8px;
}

.dropdown-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f9fafb;
}

.dropdown-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.mark-all-read-btn,
.clear-all-btn {
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.mark-all-read-btn:hover,
.clear-all-btn:hover {
  background-color: #eff6ff;
}

.clear-all-btn {
  color: #ef4444;
}

.clear-all-btn:hover {
  background-color: #fef2f2;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.no-notifications {
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
}

.no-notifications svg {
  opacity: 0.5;
  margin-bottom: 12px;
}

.notification-item {
  padding: 12px 20px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}

.notification-item:hover {
  background-color: #f9fafb;
}

.notification-item.unread {
  background-color: #eff6ff;
  border-left: 3px solid #3b82f6;
}

.notification-item.success .notification-icon {
  color: #10b981;
}

.notification-item.error .notification-icon {
  color: #ef4444;
}

.notification-item.warning .notification-icon {
  color: #f59e0b;
}

.notification-item.info .notification-icon {
  color: #3b82f6;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.notification-message {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: #4b5563;
  line-height: 1.4;
}

.notification-time {
  font-size: 11px;
  color: #9ca3af;
}

.unread-indicator {
  width: 8px;
  height: 8px;
  background-color: #3b82f6;
  border-radius: 50%;
  margin-top: 4px;
}

.remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: #9ca3af;
  transition: all 0.2s;
  opacity: 0;
}

.notification-item:hover .remove-btn {
  opacity: 1;
}

.remove-btn:hover {
  background-color: #fee2e2;
  color: #ef4444;
}

.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .notification-dropdown {
    width: 320px;
    right: -20px;
  }
}
</style>