// stores/notification.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface NotificationMessage {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: string
  userId?: string
  read?: boolean
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<NotificationMessage[]>([])
  const isConnected = ref(false)
  const socket = ref<WebSocket | null>(null)

  const unreadCount = computed(() => 
    notifications.value.filter(n => !n.read).length
  )

  const hasUnread = computed(() => unreadCount.value > 0)

  const connectWebSocket = (url: string = `${import.meta.env.VITE_WS_URL}`) => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      return
    }

    socket.value = new WebSocket(url)

    socket.value.onopen = () => {
      isConnected.value = true
      console.log('WebSocket connected')
    }

    socket.value.onmessage = (event) => {
      try {
        const notification: NotificationMessage = JSON.parse(event.data)
        notification.read = false
        notifications.value.unshift(notification)
        
        // Trigger visual notification (bell blinking)
        triggerBellBlink()
      } catch (error) {
        console.error('Error parsing notification:', error)
      }
    }

    socket.value.onclose = () => {
      isConnected.value = false
      console.log('WebSocket disconnected')
      
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        connectWebSocket(url)
      }, 3000)
    }

    socket.value.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  const disconnectWebSocket = () => {
    if (socket.value) {
      socket.value.close()
      socket.value = null
      isConnected.value = false
    }
  }

  const markAsRead = (id: string) => {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  const markAllAsRead = () => {
    notifications.value.forEach(notification => {
      notification.read = true
    })
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearAllNotifications = () => {
    notifications.value = []
  }

  const triggerBellBlink = () => {
    // Dispatch custom event for bell component
    const event = new CustomEvent('notification-received', {
      detail: { timestamp: Date.now() }
    })
    window.dispatchEvent(event)
  }

  return {
    notifications,
    isConnected,
    unreadCount,
    hasUnread,
    connectWebSocket,
    disconnectWebSocket,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications
  }
})