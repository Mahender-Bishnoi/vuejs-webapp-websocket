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
      const apiUrl = import.meta.env.VITE_API_URL
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

  const parseNotificationMessage = (rawData: string): NotificationMessage => {
    console.log('Parsing notification message:', rawData)
    
    try {
      // First, try to parse as JSON
      const data = JSON.parse(rawData)
      
      // Handle different message formats that might come from your backend
      let notification: NotificationMessage

      // Check if it's already in the correct format
      if (data.id && data.title && data.message) {
        notification = {
          id: data.id,
          title: data.title,
          message: data.message,
          type: data.type || data.notificationType || 'info',
          timestamp: data.timestamp || new Date().toISOString(),
          userId: data.userId,
          read: false
        }
      } 
      // Handle nested notification object
      else if (data.type === 'notification' && data.notification) {
        notification = {
          id: data.notification.id || `notification-${Date.now()}`,
          title: data.notification.title || 'Notification',
          message: data.notification.message || '',
          type: data.notification.type || data.notification.notificationType || 'info',
          timestamp: data.notification.timestamp || new Date().toISOString(),
          userId: data.notification.userId,
          read: false
        }
      }
      // Handle direct notification data from API
      else if (data.title && data.message) {
        notification = {
          id: data.id || `notification-${Date.now()}`,
          title: data.title,
          message: data.message,
          type: data.type || 'info',
          timestamp: data.timestamp || new Date().toISOString(),
          userId: data.userId,
          read: false
        }
      }
      // Handle any other JSON format - create a generic notification
      else {
        notification = {
          id: `notification-${Date.now()}`,
          title: data.title || 'New Notification',
          message: data.message || JSON.stringify(data),
          type: data.type || 'info',
          timestamp: data.timestamp || new Date().toISOString(),
          userId: data.userId,
          read: false
        }
      }
      
      return notification
      
    } catch (error) {
      console.log('Not valid JSON, treating as plain string notification')
      
      // Handle plain string notifications
      let title = 'New Message'
      let message = rawData
      let type: 'info' | 'success' | 'warning' | 'error' = 'info'
      
      // Try to extract type from string patterns
      const lowerMessage = rawData.toLowerCase()
      if (lowerMessage.includes('error') || lowerMessage.includes('failed') || lowerMessage.includes('problem')) {
        type = 'error'
        title = 'Error'
      } else if (lowerMessage.includes('success') || lowerMessage.includes('completed') || lowerMessage.includes('done')) {
        type = 'success'
        title = 'Success'
      } else if (lowerMessage.includes('warning') || lowerMessage.includes('caution') || lowerMessage.includes('alert')) {
        type = 'warning'
        title = 'Warning'
      }
      
      // Try to parse structured string formats
      // Format: "TYPE: TITLE - MESSAGE"
      const structuredMatch = rawData.match(/^(INFO|SUCCESS|WARNING|ERROR):\s*(.+?)\s*-\s*(.+)$/i)
      if (structuredMatch) {
        type = structuredMatch[1].toLowerCase() as 'info' | 'success' | 'warning' | 'error'
        title = structuredMatch[2].trim()
        message = structuredMatch[3].trim()
      }
      
      // Format: "TITLE: MESSAGE"
      const titleMatch = rawData.match(/^(.+?):\s*(.+)$/)
      if (titleMatch && !structuredMatch) {
        title = titleMatch[1].trim()
        message = titleMatch[2].trim()
      }
      
      return {
        id: `notification-${Date.now()}`,
        title,
        message,
        type,
        timestamp: new Date().toISOString(),
        read: false
      }
    }
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
        socket.value?.send(JSON.stringify({ type: 'subscribe', userId: 'current-user-id' }))
      }

      socket.value.onmessage = (event) => {
        try {
          console.log('Received WebSocket message:', event.data)
          
          // Parse the notification regardless of format (JSON or string)
          const notification = parseNotificationMessage(event.data)
          
          console.log('Processed notification:', notification)
          notifications.value.unshift(notification)
          triggerBellBlink()
          
        } catch (error) {
          console.error('Error processing WebSocket message:', error)
          console.log('Raw message:', event.data)
          
          // Create fallback notification for completely unparseable messages
          const fallbackNotification: NotificationMessage = {
            id: `notification-${Date.now()}`,
            title: 'System Message',
            message: 'Received a message that could not be processed',
            type: 'info',
            timestamp: new Date().toISOString(),
            read: false
          }
          
          notifications.value.unshift(fallbackNotification)
          triggerBellBlink()
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
    
    // Optional: Send read status to backend
    // sendMessage({ type: 'mark_all_read', userId: 'current-user-id' })
    
    console.log('All notifications marked as read')
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

  // Add a method to manually add notifications for testing
  const addTestNotification = (type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const messages = {
      info: { title: 'Test Info', message: 'This is a test informational message' },
      success: { title: 'Test Success', message: 'This is a test success message' },
      warning: { title: 'Test Warning', message: 'This is a test warning message' },
      error: { title: 'Test Error', message: 'This is a test error message' }
    }

    const notification: NotificationMessage = {
      id: `test-${Date.now()}`,
      ...messages[type],
      type,
      timestamp: new Date().toISOString(),
      read: false
    }

    notifications.value.unshift(notification)
    triggerBellBlink()
  }

  // Add method to test string notifications
  const addTestStringNotification = (stringMessage: string) => {
    const notification = parseNotificationMessage(stringMessage)
    notifications.value.unshift(notification)
    triggerBellBlink()
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
    clearAllNotifications,
    addTestNotification,
    addTestStringNotification
  }
})