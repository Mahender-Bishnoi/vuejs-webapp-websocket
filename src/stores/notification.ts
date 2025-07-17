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
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const reconnectDelay = 3000

  const unreadCount = computed(() => 
    notifications.value.filter(n => !n.read).length
  )

  const hasUnread = computed(() => unreadCount.value > 0)

  const getWebSocketUrl = (): string => {
    // Get base WebSocket URL from environment
    let wsUrl = import.meta.env.VITE_WS_URL
    
    // If not defined, construct from API URL
    if (!wsUrl) {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
      wsUrl = apiUrl.replace(/^https?:\/\//, 'ws://').replace(/\/api$/, '/ws')
    }
    
    // Ensure proper protocol
    if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
      wsUrl = `ws://${wsUrl}`
    }
    
    // Add notifications endpoint
    const baseUrl = wsUrl.replace(/\/$/, '')
    return `${baseUrl}/notifications`
  }

  const connectWebSocket = () => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected')
      return
    }

    if (socket.value?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket already connecting')
      return
    }

    const wsUrl = getWebSocketUrl()
    console.log('Attempting to connect to WebSocket:', wsUrl)

    try {
      socket.value = new WebSocket(wsUrl)

      socket.value.onopen = (event) => {
        isConnected.value = true
        reconnectAttempts.value = 0
        console.log('WebSocket connected successfully to:', wsUrl)
        
        // Send initial message if your backend expects it
        // socket.value?.send(JSON.stringify({ type: 'subscribe', userId: 'current-user-id' }))
      }

      socket.value.onmessage = (event) => {
        try {
          console.log('Received WebSocket message:', event.data)
          const data = JSON.parse(event.data)
          
          // Handle different message types
          if (data.type === 'notification') {
            const notification: NotificationMessage = {
              id: data.id || `notification-${Date.now()}`,
              title: data.title || 'Notification',
              message: data.message || '',
              type: data.notificationType || 'info',
              timestamp: data.timestamp || new Date().toISOString(),
              userId: data.userId,
              read: false
            }
            
            notifications.value.unshift(notification)
            triggerBellBlink()
          } else {
            // Handle other message types
            console.log('Received non-notification message:', data)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
          console.log('Raw message:', event.data)
        }
      }

      socket.value.onclose = (event) => {
        isConnected.value = false
        console.log('WebSocket disconnected:', event.code, event.reason)
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttempts.value < maxReconnectAttempts) {
          scheduleReconnect()
        }
      }

      socket.value.onerror = (error) => {
        console.error('WebSocket error:', error)
        isConnected.value = false
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      scheduleReconnect()
    }
  }

  const scheduleReconnect = () => {
    if (reconnectAttempts.value >= maxReconnectAttempts) {
      console.log('Max reconnection attempts reached')
      return
    }

    reconnectAttempts.value++
    console.log(`Scheduling reconnect attempt ${reconnectAttempts.value}/${maxReconnectAttempts} in ${reconnectDelay}ms`)
    
    setTimeout(() => {
      connectWebSocket()
    }, reconnectDelay)
  }

  const disconnectWebSocket = () => {
    if (socket.value) {
      socket.value.close(1000, 'Manual disconnect')
      socket.value = null
      isConnected.value = false
    }
  }

  const sendMessage = (message: any): boolean => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      try {
        socket.value.send(JSON.stringify(message))
        return true
      } catch (error) {
        console.error('Failed to send WebSocket message:', error)
        return false
      }
    }
    console.warn('WebSocket is not connected. Cannot send message.')
    return false
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
    reconnectAttempts,
    connectWebSocket,
    disconnectWebSocket,
    sendMessage,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications
  }
})