<!-- src/views/NotificationsPage.vue -->
<template>
  <div class="notifications-page">
    <div class="container">
      <div class="page-header">
        <h2>All Notifications</h2>
        <div class="page-actions">
          <button 
            v-if="hasUnread" 
            @click="markAllAsRead"
            class="btn btn-primary"
          >
            Mark All Read
          </button>
          <button 
            v-if="notifications.length > 0"
            @click="clearAll"
            class="btn btn-secondary"
          >
            Clear All
          </button>
        </div>
      </div>

      <div class="notifications-grid">
        <div 
          v-if="notifications.length === 0" 
          class="empty-state"
        >
          <h3>No notifications yet</h3>
          <p>You'll see notifications here when they arrive.</p>
        </div>

        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          class="notification-card"
          :class="{ 'unread': !notification.read }"
        >
          <div class="notification-header">
            <h3>{{ notification.title }}</h3>
            <span class="notification-time">
              {{ formatTimestamp(notification.timestamp) }}
            </span>
          </div>
          <p class="notification-message">{{ notification.message }}</p>
          <div class="notification-actions">
            <button 
              v-if="!notification.read"
              @click="markAsRead(notification.id)"
              class="btn btn-sm btn-primary"
            >
              Mark as Read
            </button>
            <button 
              @click="removeNotification(notification.id)"
              class="btn btn-sm btn-danger"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotificationStore } from '../stores/notification'

const notificationStore = useNotificationStore()

const notifications = computed(() => notificationStore.notifications)
const hasUnread = computed(() => notificationStore.hasUnread)

const markAsRead = (id: string) => {
  notificationStore.markAsRead(id)
}

const markAllAsRead = () => {
  notificationStore.markAllAsRead()
}

const removeNotification = (id: string) => {
  notificationStore.removeNotification(id)
}

const clearAll = () => {
  notificationStore.clearAllNotifications()
}

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}
</script>

<style scoped>
.container {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-actions {
  display: flex;
  gap: 1rem;
}

.notifications-grid {
  display: grid;
  gap: 1rem;
}

.notification-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.notification-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.notification-card.unread {
  border-left: 4px solid #007bff;
  background: #f8f9ff;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.notification-header h3 {
  margin: 0;
  color: #333;
}

.notification-time {
  color: #666;
  font-size: 0.9rem;
}

.notification-message {
  color: #666;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.notification-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-primary { background: #007bff; color: white; }
.btn-secondary { background: #6c757d; color: white; }
.btn-danger { background: #dc3545; color: white; }
.btn-sm { padding: 4px 8px; font-size: 12px; }

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}
</style>
