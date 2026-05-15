import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import useTrafficStore from '../store/trafficStore'

export function useSocket() {
  const socketRef = useRef(null)
  const { updateLiveTraffic, addAlert, updateHeatmap } = useTrafficStore()

  useEffect(() => {
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    })

    const socket = socketRef.current

    socket.on('traffic:update', updateLiveTraffic)
    socket.on('alert:new', addAlert)
    socket.on('heatmap:update', updateHeatmap)

    return () => {
      socket.disconnect()
    }
  }, [])

  return socketRef.current
}
