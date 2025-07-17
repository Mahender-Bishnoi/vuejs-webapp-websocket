// composables/useWebSocket.ts
import { ref, onUnmounted } from 'vue'

export interface WebSocketOptions {
  url: string
  protocols?: string | string[]
  onMessage?: (event: MessageEvent) => void
  onOpen?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
  onError?: (event: Event) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useWebSocket(options: WebSocketOptions) {
  const socket = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = options.maxReconnectAttempts || 5
  const reconnectInterval = options.reconnectInterval || 3000

  let reconnectTimer: number | null = null

  const connect = () => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      socket.value = new WebSocket(options.url, options.protocols)

      socket.value.onopen = (event) => {
        isConnected.value = true
        reconnectAttempts.value = 0
        console.log('WebSocket connected to:', options.url)
        options.onOpen?.(event)
      }

      socket.value.onmessage = (event) => {
        options.onMessage?.(event)
      }

      socket.value.onclose = (event) => {
        isConnected.value = false
        console.log('WebSocket disconnected from:', options.url)
        options.onClose?.(event)

        // Attempt to reconnect if not manually closed
        if (!event.wasClean && reconnectAttempts.value < maxReconnectAttempts) {
          scheduleReconnect()
        }
      }

      socket.value.onerror = (event) => {
        console.error('WebSocket error:', event)
        options.onError?.(event)
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }

  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    if (socket.value) {
      socket.value.close(1000, 'Manual disconnect')
      socket.value = null
    }
    isConnected.value = false
  }

  const send = (data: string | ArrayBuffer | Blob) => {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(data)
      return true
    }
    console.warn('WebSocket is not connected. Cannot send message.')
    return false
  }

  const scheduleReconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
    }

    reconnectTimer = setTimeout(() => {
      reconnectAttempts.value++
      console.log(`Attempting to reconnect... (${reconnectAttempts.value}/${maxReconnectAttempts})`)
      connect()
    }, reconnectInterval)
  }

  // Clean up on component unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    socket,
    isConnected,
    reconnectAttempts,
    connect,
    disconnect,
    send
  }
}

// Alternative hook specifically for notifications
export function useNotificationWebSocket(baseUrl: string = `${import.meta.env.VITE_WS_URL}`) {
  const notifications = ref<any[]>([])
  
  const { isConnected, connect, disconnect, send } = useWebSocket({
    url: `${baseUrl}/notifications`,
    onMessage: (event) => {
      try {
        const notification = JSON.parse(event.data)
        notifications.value.unshift(notification)
        
        // Trigger bell animation
        const bellEvent = new CustomEvent('notification-received', {
          detail: { notification, timestamp: Date.now() }
        })
        window.dispatchEvent(bellEvent)
      } catch (error) {
        console.error('Error parsing notification:', error)
      }
    },
    onOpen: () => {
      console.log('Notification WebSocket connected')
    },
    onClose: () => {
      console.log('Notification WebSocket disconnected')
    },
    onError: (error) => {
      console.error('Notification WebSocket error:', error)
    }
  })

  return {
    notifications,
    isConnected,
    connect,
    disconnect,
    send
  }
}