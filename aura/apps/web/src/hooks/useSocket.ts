'use client'

import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@aura/shared'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let socket: AppSocket | null = null

export function useSocket(): AppSocket | null {
  const socketRef = useRef<AppSocket | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) return

    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000', {
        auth: { token },
        transports: ['websocket'],
      })
    }

    socketRef.current = socket

    return () => {
      // Don't disconnect on unmount — keep persistent connection
    }
  }, [])

  return socketRef.current
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
